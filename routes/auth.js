import express from 'express';
import {
  register,
  login,
  confirmEmail,
  requestPasswordReset,
  resetPassword,
  checkEmailExists,
  getCurrentUser,
  checkContestRegistration
} from '../controllers/auth.js';
import authenticate from '../middleware/authenticate.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/confirm-email', confirmEmail);
authRouter.post('/request-password-reset', requestPasswordReset);
authRouter.post('/reset-password', resetPassword);
authRouter.post('/check-email', checkEmailExists);
authRouter.get('/me', authenticate, getCurrentUser);
authRouter.post('/check', authenticate, checkContestRegistration);

export default authRouter;
