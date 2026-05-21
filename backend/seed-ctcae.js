const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

const CTCAE_V4_COMMON = [
  // Gastrointestinal
  { v: 'Nausée', c: '10028813' },
  { v: 'Vomissement', c: '10047700' },
  { v: 'Diarrhée', c: '10012735' },
  { v: 'Constipation', c: '10010774' },
  { v: 'Mucite buccale', c: '10030124' },
  
  // Hématologique
  { v: 'Anémie', c: '10002034' },
  { v: 'Neutropénie', c: '10029354' },
  { v: 'Thrombopénie', c: '10043554' },
  { v: 'Leucopénie', c: '10024384' },
  
  // Général
  { v: 'Fatigue', c: '10016256' },
  { v: 'Fièvre', c: '10016558' },
  { v: 'Anorexie', c: '10002646' },
  { v: 'Douleur', c: '10033371' },
  
  // Peau / Phanères
  { v: 'Alopécie', c: '10001760' },
  { v: 'Éruption cutanée (Rash)', c: '10037844' },
  { v: 'Syndrome Main-Pied', c: '10029185' },
  
  // Neurologique
  { v: 'Neuropathie périphérique sensorielle', c: '10034620' },
  { v: 'Céphalée', c: '10019211' }
];

async function seed() {
  console.log('--- Seeding CTCAE v4.0 Adverse Effects ---');
  try {
    for (const item of CTCAE_V4_COMMON) {
      const id = uuidv4();
      await pool.query(
        'INSERT IGNORE INTO parametres_globaux (id, categorie, valeur, code, obligatoire, actif) VALUES (?, ?, ?, ?, ?, ?)',
        [id, 'effet_indesirable', item.v, item.c, false, true]
      );
      console.log(`Seeded: ${item.v} (${item.c})`);
    }
    console.log('--- CTCAE Seeding Complete ---');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    process.exit();
  }
}

seed();
