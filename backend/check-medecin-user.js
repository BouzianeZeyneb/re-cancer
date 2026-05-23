require('dotenv').config({ path: '../.env' });
const { pool } = require('./config/database');

async function check() {
  const conn = await pool.getConnection();
  try {
    const [u] = await conn.execute("SELECT id, nom, prenom, email, role FROM users WHERE id = 'b7cee8ea-e9c0-47b3-8dad-40d3392c5f46'");
    console.log('--- USER FOR CASE CREATOR ---');
    console.log(u);

    const [medecins] = await conn.execute("SELECT id, nom, prenom, email, role FROM users WHERE role = 'medecin'");
    console.log('--- ALL MEDECINS ---');
    console.log(medecins);

    const [anapaths] = await conn.execute("SELECT id, nom, prenom, email, role FROM users WHERE role = 'anapath'");
    console.log('--- ALL ANAPATHS ---');
    console.log(anapaths);
  } catch (e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
}

check();
