const { pool } = require('./config/database');

async function run() {
  try {
    // Check if cases table exists and get its structure
    const [tables] = await pool.execute("SHOW TABLES LIKE 'cases'");
    if (tables.length === 0) {
      console.log('❌ Table cases ABSENTE — essai avec cancer_cases...');
      const [tables2] = await pool.execute("SHOW TABLES");
      console.log('Tables disponibles:', tables2.map(t => Object.values(t)[0]).join(', '));
      process.exit(1);
    }
    console.log('✅ Table cases existe');

    // Create validations table without FK to be safe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS validations_epidemio (
        id INT AUTO_INCREMENT PRIMARY KEY,
        case_id INT NOT NULL UNIQUE,
        statut ENUM('en_attente','approuve','rejete') DEFAULT 'en_attente',
        commentaire TEXT,
        validated_by INT,
        validated_at DATETIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Table validations_epidemio créée.');
  } catch (e) {
    console.error('❌ Erreur:', e.message);
  }
  process.exit(0);
}
run();
