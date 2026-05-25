const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cancer_registry',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Sample professions (some linked to industrial zones)
const PROFESSIONS = [
  { name: 'Ouvrier Chimique', sector: 'chimie' },
  { name: 'Soudeur', sector: 'métallurgie' },
  { name: 'Technicien Électronique', sector: 'électronique' },
  { name: 'Agriculteur', sector: 'agriculture' },
  { name: 'Professeur', sector: 'éducation' },
  { name: 'Médecin', sector: 'santé' },
  { name: 'Conducteur de Bus', sector: 'transport' },
  { name: 'Employé Administratif', sector: 'services' }
];

// Map sector to exposure flag & detail
function getExposure(prof) {
  const industrialSectors = ['chimie', 'métallurgie', 'électronique'];
  if (industrialSectors.includes(prof.sector)) {
    return { exposition: true, detail: `Exposé au secteur ${prof.sector}` };
  }
  return { exposition: false, detail: null };
}

async function main() {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT id FROM patients');
    console.log(`Found ${rows.length} patients`);
    for (let i = 0; i < rows.length; i++) {
      const patientId = rows[i].id;
      const prof = PROFESSIONS[i % PROFESSIONS.length];
      const { exposition, detail } = getExposure(prof);
      await conn.execute(
        `UPDATE patients SET profession = ?, exposition_pro = ?, exposition_pro_detail = ? WHERE id = ?`,
        [prof.name, exposition ? 1 : 0, detail, patientId]
      );
      console.log(`Updated patient ${patientId} with profession '${prof.name}'`);
    }
    console.log('✅ All patients updated with professions and exposure flags');
  } catch (e) {
    console.error('Error updating patients:', e);
  } finally {
    conn.release();
    process.exit(0);
  }
}

main();
