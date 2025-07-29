import pool from '../config/db.js';

const UserModel = {
  /**
   * Create a new user
   * @param {Object} userData - User fields
   */
  async create(userData) {
    const {
      username,
      email,
      password,
      address,
      city,
      state,
      pincode,
      confirmationToken,
      tokenExpiry,
      mobile
    } = userData;

    const [result] = await pool.query(
      `INSERT INTO users 
        (username, email, password, address, city, state, pincode, confirmation_token, confirmation_token_expiry, mobile) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,
        email,
        password,
        address,
        city,
        state,
        pincode,
        confirmationToken,
        tokenExpiry,
        mobile
      ]
    );

    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows
    };
  },

  /**
   * Find user by email or username
   * @param {string} email 
   * @param {string} username 
   * @returns {Object|null} user record
   */
  async findByEmailOrUsername(email, username) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    return rows[0] || null;
  }
};

export default UserModel;
