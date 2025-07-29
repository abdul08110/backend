// controllers/payment.js
import { razorpayInstance } from '../utils/razorpay.js';

export const createOrder = async (req, res) => {
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  const options = {
    amount: amount * 100, // Convert to paisa
    currency: 'INR',
    receipt: `rcpt_${Math.floor(Math.random() * 1000000)}`,
  };

  try {
    const order = await razorpayInstance.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error('[RAZORPAY ORDER ERROR]', err);
    res.status(500).json({ error: 'Failed to create Razorpay order' });
  }
};
