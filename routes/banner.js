// routes/banner.js
import express from 'express';
import { getHeroBanner } from '../controllers/banner.js';

const bannerRouter = express.Router();

bannerRouter.get('/hero-banner', getHeroBanner);

export default bannerRouter;
