// routes/contest.js
import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

router.get('/contest-details', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
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
        registration_count
      FROM contest_info
      WHERE contest_flag = 1
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (!rows.length) return res.status(404).json({ error: 'No contest found' });

    // Optional: convert datetime fields to ISO format (if needed)
    const row = rows[0];
    row.contest_date = new Date(row.contest_date).toISOString();
    row.result_date = row.result_date ? new Date(row.result_date).toISOString() : null;
    row.registration_opens_at = new Date(row.registration_opens_at).toISOString();

    res.json(row);
  } catch (err) {
    console.error('[CONTEST DETAILS ERROR]', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
