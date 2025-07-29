import express from 'express';
import crypto from 'crypto';
import pool from '../config/db.js';
import authenticate from '../middleware/authenticate.js';
import nodemailer from 'nodemailer';

const router = express.Router();

function verifySignature(orderId, paymentId, signature, secret) {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(orderId + '|' + paymentId)
    .digest('hex');

  return generatedSignature === signature;
}

const sendHallTicketEmail = async (email, name, contestName, hallTicketNo) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    to: email,
    subject: `Your Hall Ticket for ${contestName}`,
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Hello ${name},</h2>
        <p>Thank you for registering for <strong>${contestName}</strong>.</p>
        <p>Your hall ticket number is:</p>
        <h3 style="color: #4f46e5;">${hallTicketNo}</h3>
        <p>Good luck with the contest!</p>
        <p>Regards,<br>Quizora Team</p>
      </div>
    `
  });
};

router.post('/contest/register', authenticate, async (req, res) => {
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
    // Prevent duplicates
    const [existing] = await pool.query(
      'SELECT id FROM contest_registrations WHERE user_id = ? AND contest_id = ?',
      [userId, contest_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'You have already registered for this contest.' });
    }

    // Generate hall ticket number
    const hallTicketNo = `QT-${Date.now().toString().slice(-6)}-${userId}`;

    // Insert
    await pool.query(
      `INSERT INTO contest_registrations (
        user_id, contest_id, hall_ticket_no,
        razorpay_payment_id, razorpay_order_id, razorpay_signature
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, contest_id, hallTicketNo, razorpay_payment_id, razorpay_order_id, razorpay_signature]
    );

    // Fetch user and contest details for email
    const [[user]] = await pool.query('SELECT username, email FROM users WHERE id = ?', [userId]);
    const [[contest]] = await pool.query('SELECT contest_name FROM contest_info WHERE id = ?', [contest_id]);

    await sendHallTicketEmail(user.email, user.username, contest.contest_name, hallTicketNo);

    res.json({ success: true, message: 'Registered and email sent!' });
  } catch (err) {
    console.error('[REGISTER ERROR]', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

export default router;
