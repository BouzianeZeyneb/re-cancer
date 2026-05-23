require('dotenv').config({ path: '../.env' });
const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function reset() {
  const conn = await pool.getConnection();
  try {
    const email = 'anapath@registre-cancer.dz';
    const password = 'Anapath@2024';
    const hashed = await bcrypt.hash(password, 10);
    
    await conn.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashed, email]
    );
    console.log(`✅ Password reset successfully for ${email} to "${password}"`);
  } catch (err) {
    console.error('❌ Error resetting password:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

reset();
