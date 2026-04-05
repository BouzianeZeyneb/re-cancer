require('dotenv').config();
const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
  'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
  'Skikda', 'Sidi Bel Abbès', 'Annabba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara',
  'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arreridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt',
  'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane'
];

const CANCER_TYPES = [
  { type: 'Solide', sous: 'Cancer du Sein', loc: 'Sein' },
  { type: 'Solide', sous: 'Cancer du Poumon', loc: 'Poumon' },
  { type: 'Solide', sous: 'Cancer du Colon', loc: 'Colon' },
  { type: 'Solide', sous: 'Cancer de la Prostate', loc: 'Prostate' },
  { type: 'Solide', sous: 'Cancer de la Vessie', loc: 'Vessie' },
  { type: 'Solide', sous: 'Cancer de l\'Estomac', loc: 'Estomac' },
  { type: 'Hématologique', sous: 'Lymphome', loc: 'Ganglions' },
  { type: 'Hématologique', sous: 'Leucémie', loc: 'Moelle osseuse' }
];

const STAGES = ['Stade I', 'Stade II', 'Stade III', 'Stade IV'];
const STATUSES = ['En suivi', 'En traitement', 'Guéri', 'Décédé'];
const SEXES = ['M', 'F'];

async function seedMassive() {
  console.log('🚀 Démarrage du peuplement massif (200 patients)...');
  const conn = await pool.getConnection();

  try {
    const [admins] = await conn.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!admins.length) throw new Error("Aucun admin trouvé");
    const adminId = admins[0].id;

    // Clear old data
    console.log('🧹 Nettoyage des anciennes données...');
    await conn.execute('SET FOREIGN_KEY_CHECKS=0');
    await conn.execute('DELETE FROM cancer_cases');
    await conn.execute('DELETE FROM patients');
    await conn.execute('SET FOREIGN_KEY_CHECKS=1');

    for (let i = 0; i < 200; i++) {
      const pid = uuidv4();
      const nom = `Nom${i}`;
      const prenom = `Prenom${i}`;
      const sexe = SEXES[Math.floor(Math.random() * 2)];
      const wilaya = WILAYAS[Math.floor(Math.random() * WILAYAS.length)];
      // Random date between 1940 and 2000
      const dobYear = 1940 + Math.floor(Math.random() * 60);
      const dob = `${dobYear}-01-01`;
      
      await conn.execute(
        `INSERT INTO patients (id, nom, prenom, date_naissance, sexe, wilaya, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [pid, nom, prenom, dob, sexe, wilaya, adminId]
      );

      // Add a cancer case for most
      if (Math.random() > 0.1) {
        const cid = uuidv4();
        const ct = CANCER_TYPES[Math.floor(Math.random() * CANCER_TYPES.length)];
        const stade = STAGES[Math.floor(Math.random() * STAGES.length)];
        const statut = STATUSES[Math.floor(Math.random() * STATUSES.length)];
        // Random diagnostic date between 2023 and 2025
        const diagYear = 2023 + Math.floor(Math.random() * 3);
        const diagMonth = 1 + Math.floor(Math.random() * 12);
        const diagDate = `${diagYear}-${diagMonth.toString().padStart(2, '0')}-01`;

        await conn.execute(
          `INSERT INTO cancer_cases (id, patient_id, type_cancer, sous_type, localisation, stade, statut_patient, date_diagnostic, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cid, pid, ct.type, ct.sous, ct.loc, stade, statut, diagDate, adminId]
        );
      }

      if (i % 50 === 0) console.log(`... ${i} patients insérés`);
    }

    console.log('✅ Peuplement terminé : 200 patients ajoutés.');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedMassive();
