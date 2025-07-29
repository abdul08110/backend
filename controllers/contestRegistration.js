// controllers/contestRegistration.js
import pool from '../config/db.js';
import { verifySignature } from '../utils/razorpay.js';
import { sendHallTicketEmail } from '../utils/email.js';

export const registerForContest = async (req, res) => {
  const userId = req.user.id;
  const { contest_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  if (!contest_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment details' });
  }

  const isValid = verifySignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    process.env.RAZORPAY_KEY_SECRET
  );

  if (!isValid) {
    return res.status(400).json({ error: 'Invalid payment signature' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id FROM contest_registrations WHERE user_id = ? AND contest_id = ?',
      [userId, contest_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already registered for this contest.' });
    }

    const hallTicketNo = `QT-${Date.now().toString().slice(-6)}-${userId}`;

    await pool.query(
      `INSERT INTO contest_registrations (
        user_id, contest_id, hall_ticket_no,
        razorpay_payment_id, razorpay_order_id, razorpay_signature
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, contest_id, hallTicketNo, razorpay_payment_id, razorpay_order_id, razorpay_signature]
    );

    const [[user]] = await pool.query('SELECT username, email FROM users WHERE id = ?', [userId]);
    const [[contest]] = await pool.query('SELECT contest_name FROM contest_info WHERE id = ?', [contest_id]);

    await sendHallTicketEmail(user.email, user.username, contest.contest_name, hallTicketNo);

    res.json({ success: true, message: 'Registered and email sent!' });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};
