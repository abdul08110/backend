import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../config/db.js';

const generateToken = () => crypto.randomBytes(32).toString('hex');

const sendConfirmationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const confirmationLink = `${process.env.FRONTEND_URL}/confirm-email?token=${token}`;

  await transporter.sendMail({
    to: email,
    subject: 'Confirm Your Email Address',
    html: `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px; text-align: center;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <h2 style="color: #4f46e5;">Welcome to Quizora 👋</h2>
      <p style="font-size: 16px; color: #333;">Thanks for signing up! Please confirm your email address to get started.</p>
      <a href="${confirmationLink}" 
         style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
         ✅ Confirm Email
      </a>
      <p style="margin-top: 30px; font-size: 13px; color: #888;">If you didn’t sign up, you can safely ignore this email.<br>This link will expire in 24 hours.</p>
    </div>
  </div>
  `,
  });
};

export const register = async (req, res) => {
  const { email, password, address, username, city, state, pincode, mobile } = req.body;

  // Basic Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password are required' });
  }

  try {
    const [existingUser] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    const confirmationToken = generateToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');
    //const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

    if (existingUser.length > 0) {
      const user = existingUser[0];

      // ✅ Already confirmed
      if (user.is_confirmed) {
        return res.json({
          success: false,
          message: 'Email already confirmed. You can log in now.'
        });


      }

      // 🔄 Not confirmed yet — just update token and expiry
      await pool.query(
        `UPDATE users SET 
         confirmation_token = ?, 
         confirmation_token_expiry = ? 
         WHERE email = ?`,
        [confirmationToken, tokenExpiry, email]
      );
    } else {
      // 🆕 First-time registration
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        `INSERT INTO users 
         (username, email, password, address, city, state, pincode, confirmation_token, confirmation_token_expiry, mobile) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [username, email, hashedPassword, address, city, state, pincode, confirmationToken, tokenExpiry, mobile]
      );
    }

    // 📩 Send confirmation email
    await sendConfirmationEmail(email, confirmationToken);

    res.json({ success: true, message: 'Confirmation email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const confirmEmail = async (req, res) => {
  const { token } = req.query;
  console.log(`[DEBUG] Token received: ${token}`);

  try {
    // 1. Find user with matching token (case-sensitive exact match)
    const [users] = await pool.query(
      `SELECT * FROM users 
             WHERE BINARY confirmation_token = ?`, // BINARY for exact match
      [token]
    );

    console.log(`[DEBUG] Found ${users.length} matching users`);

    if (users.length === 0) {
      console.log('[DEBUG] No user found with this token');
      return res.status(400).json({
        success: false,
        error: 'Invalid confirmation link'
      });
    }

    const user = users[0];

    // 2. Check expiration (using database's local time)
    const [dbTime] = await pool.query('SELECT NOW() AS `current_time`');
    const currentDbTime = new Date(dbTime[0].current_time);
    const expiryTime = new Date(user.confirmation_token_expiry);

    console.log(`[DEBUG] Current DB time: ${currentDbTime}`);
    console.log(`[DEBUG] Token expires: ${expiryTime}`);

    if (expiryTime < currentDbTime) {
      console.log('[DEBUG] Token expired');
      return res.status(400).json({
        success: false,
        error: 'Confirmation link has expired'
      });
    }

    // 3. Update user (atomic operation)
    await pool.query(
      `UPDATE users SET 
             is_confirmed = 1,
             confirmation_token = NULL,
             confirmation_token_expiry = NULL
             WHERE id = ?`,
      [user.id]
    );

    console.log('[DEBUG] User confirmed successfully');
    return res.json({
      success: true,
      message: 'Email confirmed successfully'
    });

  } catch (err) {
    console.error('[ERROR] Confirmation failed:', err);
    return res.status(500).json({
      success: false,
      error: 'Server error during confirmation'
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [user] = await pool.query('SELECT * FROM users WHERE email = ?', [
      email,
    ]);

    if (!user[0]) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user[0].is_confirmed) {
      return res.status(403).json({ error: 'Please confirm your email first' });
    }

    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({
      token,
      name: user[0].username // Or whatever your column is in MySQL
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};
// Send reset email
const sendResetEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    to: email,
    subject: 'Reset Your Quizora Password',
    html: `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 40px; text-align: center;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h2 style="color: #4f46e5;">Password Reset Request 🔐</h2>
        <p style="font-size: 16px; color: #333;">Click the button below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetLink}" 
           style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
           🔁 Reset Password
        </a>
        <p style="margin-top: 30px; font-size: 13px; color: #888;">If you didn't request this, ignore this email.</p>
      </div>
    </div>
    `,
  });
};

// ✅ Request password reset
export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(400).json({ error: 'No account with that email found' });
    }

    const token = generateToken();
    // const expiry = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ');

    await pool.query(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?',
      [token, expiry, email]
    );

    await sendResetEmail(email, token);

    return res.json({ success: true, message: 'Reset link sent to your email' });
  } catch (err) {
    console.error('[ERROR] Password reset request failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

// ✅ Reset password
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
      `UPDATE users 
       SET password = ?, reset_token = NULL, reset_token_expiry = NULL 
       WHERE id = ?`,
      [hashedPassword, users[0].id]
    );

    return res.json({ success: true, message: 'Password reset successful' });
  } catch (err) {
    console.error('[ERROR] Reset failed:', err);
    return res.status(500).json({ error: 'Server error' });
  }
};

