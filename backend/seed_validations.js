require('dotenv').config();
const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function seedValidations() {
  const conn = await pool.getConnection();
  try {
    const [cases] = await conn.execute('SELECT id FROM cancer_cases');
    console.log(`Found ${cases.length} cancer cases. Seeding validations...`);
    
    for (let i = 0; i < cases.length; i++) {
      const c = cases[i];
      let statut = 'en_attente';
      if (i % 3 === 1) statut = 'approuve';
      if (i % 3 === 2) statut = 'rejete';
      
      const validatedAt = statut !== 'en_attente' ? new Date() : null;
      
      await conn.execute(
        `INSERT IGNORE INTO validations_epidemio (id, case_id, statut, commentaire, validated_at)
         VALUES (?, ?, ?, ?, ?)`,
        [uuidv4(), c.id, statut, statut === 'rejete' ? 'Dossier incomplet, manque bilan d extension.' : '', validatedAt]
      );
    }
    console.log('✅ Validations seeded successfully!');
  } catch (e) {
    console.error(e);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedValidations();
