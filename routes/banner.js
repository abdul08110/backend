import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/hero-banner', async (req, res) => {
  try {
    // Get latest active contest (with contest_flag = 1)
    const [[contest]] = await pool.query(
      `SELECT 
         id AS contest_id,
         contest_name,
         contest_date,
         result_date,
         registration_opens_at,
         reward,
         reward_worth,
         no_of_questions,
         time_for_answer,
         entry_fee,
         total_slots,
         DAYNAME(registration_opens_at) AS day_name
       FROM contest_info
       WHERE contest_flag = 1
       ORDER BY created_at DESC
       LIMIT 1`
    );

    if (!contest) {
      return res.status(404).json({ error: 'No contest found' });
    }

    // Get live registration count from contest_registrations table
    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM contest_registrations WHERE contest_id = ?`,
      [contest.contest_id]
    );

    // Add registration count to contest data
    contest.registration_count = count;

    res.json(contest);
  } catch (err) {
    console.error('[HERO BANNER API ERROR]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
