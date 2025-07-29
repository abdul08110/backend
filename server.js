import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Import routes
import authRouter from './routes/auth.js';
import bannerRouter from './routes/banner.js';
import contestRouter from './routes/contest.js';
import contestRegistrationRouter from './routes/contest_registration.js';
import paymentRouter from './routes/payment.js';

// Initialize app
const app = express();

// ───── Middleware ─────
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json({ limit: '10kb' }));

// Rate Limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// ───── Routes ─────
app.use('/api/auth', authRouter);
app.use('/api', bannerRouter);
app.use('/api/contest', contestRouter);
app.use('/api/contestRegistration', contestRegistrationRouter);
app.use('/api/payment', paymentRouter);

// ───── Global Error Handler ─────
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ───── Start Server ─────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
