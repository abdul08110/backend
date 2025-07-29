// routes/payment.js
import express from 'express';
import { createOrder } from '../controllers/payment.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-order', createOrder);

export default paymentRouter;
