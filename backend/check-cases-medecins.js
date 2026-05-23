require('dotenv').config({ path: '../.env' });
const { pool } = require('./config/database');

async function check() {
  const conn = await pool.getConnection();
  try {
    const [cases] = await conn.execute("SELECT id, patient_id, medecin_traitant, created_by FROM cancer_cases LIMIT 5");
    console.log('--- CANCER CASES ---');
    console.log(cases);

    const [crs] = await conn.execute("SELECT * FROM comptes_rendus_anapath LIMIT 5");
    console.log('--- COMPTES RENDUS ANAPATH ---');
    console.log(crs);
  } catch (e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
}

check();
