// routes/contest_registration.js
import express from 'express';
import authenticate from '../middleware/authenticate.js';
import { registerForContest } from '../controllers/contestRegistration.js';

const contestRegistrationRouter = express.Router();

contestRegistrationRouter.post('/contest/register', authenticate, registerForContest);

export default contestRegistrationRouter;
