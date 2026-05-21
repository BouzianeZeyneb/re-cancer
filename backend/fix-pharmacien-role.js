require('dotenv').config();
const { pool } = require('./config/database');

async function fix() {
  try {
    // Modify the ENUM to include 'pharmacien'
    await pool.execute(
      "ALTER TABLE users MODIFY COLUMN role ENUM('admin','medecin','laboratoire','anapath','pharmacien') NOT NULL DEFAULT 'medecin'"
    );
    console.log('✅ ENUM role updated to include pharmacien');

    // Verify the pharmacien user
    const [rows] = await pool.execute(
      "SELECT id, nom, prenom, email, role FROM users WHERE email = ?",
      ['pharmacien@registre-cancer.dz']
    );
    
    if (rows.length > 0) {
      console.log('Current pharmacien user:', rows[0]);
      
      // If role is not pharmacien (e.g. it was truncated to empty/default), fix it
      if (rows[0].role !== 'pharmacien') {
        await pool.execute("UPDATE users SET role = 'pharmacien' WHERE email = ?", ['pharmacien@registre-cancer.dz']);
        console.log('✅ Role updated to pharmacien');
      }
    } else {
      console.log('⚠️ No pharmacien user found');
    }

    process.exit(0);
  } catch(e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

fix();
