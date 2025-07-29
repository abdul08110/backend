// utils/razorpay.js
import crypto from 'crypto';
import Razorpay from 'razorpay';

/**
 * Verifies Razorpay signature using HMAC SHA256
 */
export const verifySignature = (orderId, paymentId, signature, secret) => {
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

/**
 * Singleton Razorpay instance (reused across app)
 */
export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
