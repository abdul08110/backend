import express from 'express';
import {
  register,
  login,
  confirmEmail,
  requestPasswordReset,
  resetPassword
} from '../controllers/auth.js';

import pool from '../config/db.js';
import authenticate from '../middleware/authenticate.js'; // ✅ Don't forget this

const router = express.Router();

// Existing routes
router.post('/register', register);
router.post('/login', login);
router.get('/confirm-email', confirmEmail);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

// ✅ Email availability check
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  try {
    const [user] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    res.json({ exists: user.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ✅ ✅ ✅ Add this route to support ContestRegistration.tsx
router.get('/me', authenticate, async (req, res) => {
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
});
router.post('/check', authenticate, async (req, res) => {
  const userId = req.user.id;
  const { contest_id } = req.body;

  try {
    const [existing] = await pool.query(
      'SELECT id FROM contest_registrations WHERE user_id = ? AND contest_id = ?',
      [userId, contest_id]
    );

    if (existing.length > 0) {
      return res.json({ alreadyRegistered: true });
    } else {
      return res.json({ alreadyRegistered: false });
    }
  } catch (err) {
    console.error('[CHECK ERROR]', err);
    return res.status(500).json({ error: 'Error checking registration' });
  }
});

export default router;
