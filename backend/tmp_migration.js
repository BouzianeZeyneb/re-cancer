const { pool } = require('./config/database');

async function migrate() {
  try {
    console.log('--- Migration patients: assurance + groupe_sanguin ---');
    
    // Check if columns exist
    const [cols] = await pool.execute("SHOW COLUMNS FROM patients");
    const colNames = cols.map(c => c.Field);
    
    if (!colNames.includes('assurance')) {
      await pool.execute("ALTER TABLE patients ADD COLUMN assurance VARCHAR(100) AFTER wilaya");
      console.log('✅ Colonne assurance ajoutée');
    }
    
    if (!colNames.includes('groupe_sanguin')) {
      await pool.execute("ALTER TABLE patients ADD COLUMN groupe_sanguin VARCHAR(10) AFTER assurance");
      console.log('✅ Colonne groupe_sanguin ajoutée');
    }
    
    console.log('--- Migration terminée avec succès ---');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur migration:', error);
    process.exit(1);
  }
}

migrate();
