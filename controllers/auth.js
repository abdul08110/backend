// controllers/auth.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

import { generateToken } from '../utils/token.js';
import { sendConfirmationEmail, sendResetEmail } from '../utils/email.js';

export const register = async (req, res) => {
  const { email, password, address, username, city, state, pincode, mobile } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    const confirmationToken = generateToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ');

    if (existingUser.length > 0) {
      const user = existingUser[0];

      if (user.is_confirmed) {
        return res.json({
          success: false,
          message: 'Email already confirmed. You can log in now.'
        });
      }

      await pool.query(
        `UPDATE users SET confirmation_token = ?, confirmation_token_expiry = ? WHERE email = ?`,
        [confirmationToken, tokenExpiry, email]
      );
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users 
         (username, email, password, address, city, state, pincode, confirmation_token, confirmation_token_expiry, mobile) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, address, city, state, pincode, confirmationToken, tokenExpiry, mobile]
      );
    }

    await sendConfirmationEmail(email, confirmationToken);
    res.json({ success: true, message: 'Confirmation email sent' });

  } catch (err) {
    console.error('[ERROR] Register:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const confirmEmail = async (req, res) => {
  const { token } = req.query;

  try {
    const [users] = await pool.query(
      `SELECT * FROM users WHERE BINARY confirmation_token = ?`,
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid confirmation link' });
    }

    const user = users[0];
    const [dbTime] = await pool.query('SELECT NOW() AS current_time');
    const now = new Date(dbTime[0].current_time);
    const expiry = new Date(user.confirmation_token_expiry);

    if (expiry < now) {
      return res.status(400).json({ success: false, error: 'Confirmation link has expired' });
    }

    await pool.query(
      `UPDATE users SET is_confirmed = 1, confirmation_token = NULL, confirmation_token_expiry = NULL WHERE id = ?`,
      [user.id]
    );

    res.json({ success: true, message: 'Email confirmed successfully' });

  } catch (err) {
    console.error('[ERROR] Email confirmation:', err);
    res.status(500).json({ success: false, error: 'Server error during confirmation' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (!user[0]) return res.status(400).json({ error: 'Invalid credentials' });

    if (!user[0].is_confirmed) {
      return res.status(403).json({ error: 'Please confirm your email first' });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, name: user[0].username });

  } catch (err) {
    console.error('[ERROR] Login:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(400).json({ error: 'No account with that email found' });
    }

    const token = generateToken();
    const expiry = new Date(Date.now() + 60 * 60 * 1000)
      .toISOString().slice(0, 19).replace('T', ' ');

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry, email]
    );

    await sendResetEmail(email, token);

    res.json({ success: true, message: 'Reset link sent to your email' });

  } catch (err) {
    console.error('[ERROR] Password reset request:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE BINARY reset_token = ? AND reset_token_expiry > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.query(
      'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
      [hashedPassword, users[0].id]
    );

    res.json({ success: true, message: 'Password reset successful' });

  } catch (err) {
    console.error('[ERROR] Reset password:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const checkEmailExists = async (req, res) => {
  const { email } = req.body;
  try {
    const [user] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    res.json({ exists: user.length > 0 });
  } catch (err) {
    console.error('[ERROR] Email check failed:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT username AS name, email, mobile FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, user: users[0] });

  } catch (err) {
    console.error('[AUTH /me ERROR]', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

export const checkContestRegistration = async (req, res) => {
  const userId = req.user.id;
  const { contest_id } = req.body;

  try {
    const [existing] = await pool.query(
      'SELECT id FROM contest_registrations WHERE user_id = ? AND contest_id = ?',
      [userId, contest_id]
    );

    res.json({ alreadyRegistered: existing.length > 0 });
  } catch (err) {
    console.error('[CHECK ERROR]', err);
    res.status(500).json({ error: 'Error checking registration' });
  }
};
