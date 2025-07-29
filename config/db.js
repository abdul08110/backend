import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

// ───── Load Environment Variables ─────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ───── Debug: Show DB credentials in development only ─────
if (process.env.NODE_ENV === 'development') {
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
}

// ───── Create MySQL Connection Pool ─────
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;
