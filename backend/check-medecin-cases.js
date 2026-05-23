require('dotenv').config({ path: '../.env' });
const { pool } = require('./config/database');

async function check() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.execute("SELECT COUNT(*) as total, SUM(CASE WHEN medecin_traitant IS NOT NULL THEN 1 ELSE 0 END) as non_null FROM cancer_cases");
    console.log(rows[0]);
  } catch (e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
}

check();
