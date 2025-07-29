// routes/payment.js
import express from 'express';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create payment order
router.post('/create-order', async (req, res) => {
  const { amount } = req.body;

  if (!amount) return res.status(400).json({ error: "Amount is required" });

  const options = {
    amount: amount * 100, // Razorpay expects amount in paisa
    currency: 'INR',
    receipt: `rcpt_${Math.floor(Math.random() * 1000000)}`,
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('[RAZORPAY ORDER ERROR]', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
});

export default router;
