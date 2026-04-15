require('dotenv').config();
const { pool } = require('./config/database');

async function check() {
  try {
    const [cols] = await pool.execute('DESCRIBE patients');
    for (const c of cols) console.log(c.Field);
    console.log('Total:', cols.length);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
