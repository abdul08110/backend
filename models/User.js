import pool from '../config/db.js';

export default {
  async create(userData) {
    const { username, email, password, address, city, state, pincode, confirmationToken, tokenExpiry, mobile } = userData;
    const [result] = await pool.query(
      `INSERT INTO users 
       (username, email, password, address, city, state, pincode, confirmation_token, confirmation_token_expiry, mobile) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ? ,?)`,
      [username, email, password, address, city, state, pincode, confirmationToken, tokenExpiry, mobile]
    );
    return result;
  },

  async findByEmailOrUsername(email, username) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    return rows[0];
  }
};