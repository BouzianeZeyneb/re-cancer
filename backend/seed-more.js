require('dotenv').config();
const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

const WILAYAS = [
  'Adrar', 'Chlef', 'Laghouat', 'Oum El Bouaghi', 'Batna', 'Béjaïa', 'Biskra', 'Béchar', 'Blida', 'Bouira',
  'Tamanrasset', 'Tébessa', 'Tlemcen', 'Tiaret', 'Tizi Ouzou', 'Alger', 'Djelfa', 'Jijel', 'Sétif', 'Saïda',
  'Skikda', 'Sidi Bel Abbès', 'Annaba', 'Guelma', 'Constantine', 'Médéa', 'Mostaganem', 'M\'Sila', 'Mascara',
  'Ouargla', 'Oran', 'El Bayadh', 'Illizi', 'Bordj Bou Arreridj', 'Boumerdès', 'El Tarf', 'Tindouf', 'Tissemsilt',
  'El Oued', 'Khenchela', 'Souk Ahras', 'Tipaza', 'Mila', 'Aïn Defla', 'Naâma', 'Aïn Témouchent', 'Ghardaïa', 'Relizane',
  'Timimoun', 'Bordj Badji Mokhtar', 'Ouled Djellal', 'Béni Abbès', 'In Salah', 'In Guezzam', 'Touggourt', 'Djanet', 'El M\'Ghair', 'El Meniaa'
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

const PROFESSIONS = [
  'Agriculteur / Ouvrier agricole', 'Ouvrier industriel / Usine', 'Mineur / Extraction',
  'Pêcheur / Maritime', 'Enseignant / Éducation', 'Personnel de santé',
  'Informatique / Bureautique', 'Commerce / Vente', 'Artisan / Menuisier / Forgeron',
  'Chauffeur / Transport', 'Fonctionnaire / Administration', 'Militaire / Police',
  'Retraité', 'Sans emploi / Chômeur'
];

const STAGES = ['Stade I', 'Stade II', 'Stade III', 'Stade IV'];
const STATUSES = ['En suivi', 'En traitement', 'Guéri', 'Décédé'];
const SEXES = ['M', 'F'];

const NOMS = ["Hadj-Ali", "Benbouali", "Mansouri", "Belkacem", "Meziane", "Brahimi", "Ait-Ahmed", "Ziane", "Merbah", "Hamdad", "Oussalah", "Ferhat", "Guermazi", "Boudiaf", "Krim", "Abane", "Ben M'hidi", "Lotfi", "Amrouche", "Feraoun", "Bouhired", "Zabana", "Bitat", "Kafi", "Bouteflika", "Tebboune", "Boumediene"];
const PRENOMS_H = ["Mohamed", "Amine", "Mustapha", "Lyes", "Sami", "Karim", "Yacine", "Nabil", "Redouane", "Walid", "Fayçal", "Abdelkrim", "Ahmed", "Ali", "Omar", "Brahim", "Djamel"];
const PRENOMS_F = ["Nadia", "Sonia", "Lynda", "Meriem", "Yasmine", "Imane", "Leila", "Kahina", "Assia", "Amel", "Zohra", "Fatma-Zohra", "Houria", "Malika", "Zineb"];

async function seedMore() {
  console.log('🚀 Démarrage de l\'ajout de 200 patients supplémentaires...');
  const conn = await pool.getConnection();

  try {
    const [admins] = await conn.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (!admins.length) throw new Error("Aucun admin trouvé");
    const adminId = admins[0].id;

    for (let i = 0; i < 200; i++) {
      const pid = uuidv4();
      const sexe = SEXES[Math.floor(Math.random() * 2)];
      const nom = NOMS[Math.floor(Math.random() * NOMS.length)];
      const prenom = sexe === 'M' ? PRENOMS_H[Math.floor(Math.random() * PRENOMS_H.length)] : PRENOMS_F[Math.floor(Math.random() * PRENOMS_F.length)];
      
      const wilaya = WILAYAS[Math.floor(Math.random() * WILAYAS.length)];
      const profession = PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)];
      
      // Random date between 1940 and 2005
      const dobYear = 1940 + Math.floor(Math.random() * 65);
      const dobMonth = 1 + Math.floor(Math.random() * 12);
      const dobDay = 1 + Math.floor(Math.random() * 28);
      const dob = `${dobYear}-${dobMonth.toString().padStart(2,'0')}-${dobDay.toString().padStart(2,'0')}`;
      
      await conn.execute(
        `INSERT INTO patients (id, nom, prenom, date_naissance, sexe, wilaya, profession, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [pid, nom, prenom, dob, sexe, wilaya, profession, adminId]
      );

      // Add a cancer case for 90% of patients
      if (Math.random() > 0.1) {
        const cid = uuidv4();
        const ct = CANCER_TYPES[Math.floor(Math.random() * CANCER_TYPES.length)];
        const stade = STAGES[Math.floor(Math.random() * STAGES.length)];
        const statut = STATUSES[Math.floor(Math.random() * STATUSES.length)];
        
        // Random diagnostic date between 2020 and 2025
        const diagYear = 2020 + Math.floor(Math.random() * 6);
        const diagMonth = 1 + Math.floor(Math.random() * 12);
        const diagDate = `${diagYear}-${diagMonth.toString().padStart(2, '0')}-01`;

        await conn.execute(
          `INSERT INTO cancer_cases (id, patient_id, type_cancer, sous_type, localisation, stade, statut_patient, date_diagnostic, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cid, pid, ct.type, ct.sous, ct.loc, stade, statut, diagDate, adminId]
        );
      }

      if ((i + 1) % 50 === 0) console.log(`... ${i + 1} patients ajoutés`);
    }

    console.log('✅ Ajout terminé : 200 patients supplémentaires avec dossiers.');
  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedMore();
