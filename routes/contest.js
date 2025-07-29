// routes/contest.js
import express from 'express';
import { getContestDetails } from '../controllers/contest.js';

const contestRouter = express.Router();

contestRouter.get('/contest-details', getContestDetails);

export default contestRouter;
