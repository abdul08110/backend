// controllers/contest.js
import pool from '../config/db.js';

export const getContestDetails = async (req, res) => {
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

    if (!rows.length) {
      return res.status(404).json({ error: 'No contest found' });
    }

    const contest = rows[0];

    // Format date fields to ISO string
    contest.contest_date = new Date(contest.contest_date).toISOString();
    contest.result_date = contest.result_date ? new Date(contest.result_date).toISOString() : null;
    contest.registration_opens_at = new Date(contest.registration_opens_at).toISOString();

    res.json(contest);
  } catch (err) {
    console.error('[CONTEST DETAILS ERROR]', err);
    res.status(500).json({ error: 'Server error' });
  }
};
