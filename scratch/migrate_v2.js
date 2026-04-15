const { pool } = require('../backend/config/database');

async function migrate() {
  try {
    console.log('Début de la migration...');
    
    // Update patients table
    await pool.execute(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS consommation_tabac VARCHAR(50) DEFAULT 'Inconnu',
      ADD COLUMN IF NOT EXISTS consommation_alcool VARCHAR(50) DEFAULT 'Inconnu'
    `);
    
    // Update cancer_cases table
    await pool.execute(`
      ALTER TABLE cancer_cases 
      ADD COLUMN IF NOT EXISTS icd_o_topography VARCHAR(50),
      ADD COLUMN IF NOT EXISTS icd_o_morphology VARCHAR(50),
      ADD COLUMN IF NOT EXISTS behavior_code VARCHAR(20),
      ADD COLUMN IF NOT EXISTS date_derniere_nouvelle DATE,
      ADD COLUMN IF NOT EXISTS cause_deces VARCHAR(255)
    `);

    console.log('✅ Migration des tables patients et cancer_cases réussie');

    // Also update traitements to ensure any missing clinical fields are there
    await pool.execute(`
      ALTER TABLE traitements
      ADD COLUMN IF NOT EXISTS nb_cycles_prevus INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS protocole VARCHAR(200)
    `).catch(e => console.log('Champs déjà présents ou erreur mineure dans traitements'));

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

migrate();
