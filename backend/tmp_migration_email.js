const { pool } = require('./config/database');

async function migrate() {
  try {
    const [cols] = await pool.execute("SHOW COLUMNS FROM patients");
    const colNames = cols.map(c => c.Field);
    
    if (!colNames.includes('email')) {
      await pool.execute("ALTER TABLE patients ADD COLUMN email VARCHAR(150) AFTER telephone");
      console.log('✅ Colonne email ajoutée');
    }
    console.log('--- Migration Email terminée ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}
migrate();
