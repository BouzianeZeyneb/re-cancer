const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

const REAL_PATIENTS = [
  { nom: 'MEZIANE', prenom: 'Amine', sexe: 'M', wilaya: '16 Alger', profession: 'Enseignant', age: 45, topography: 'C61.9', morphology: '8140/3', stage: 'Stade II', type: 'Solide' },
  { nom: 'BENSAÏD', prenom: 'Fatima Zohra', sexe: 'F', wilaya: '31 Oran', profession: 'Infirmière', age: 52, topography: 'C50.9', morphology: '8500/3', stage: 'Stade III', type: 'Solide' },
  { nom: 'KHEDIDJI', prenom: 'Brahim', sexe: 'M', wilaya: '25 Constantine', profession: 'Retraité', age: 68, topography: 'C34.9', morphology: '8041/3', stage: 'Stade IV', type: 'Solide' },
  { nom: 'MANSOURI', prenom: 'Karim', sexe: 'M', wilaya: '06 Béjaïa', profession: 'Ingénieur', age: 39, topography: 'C18.9', morphology: '8144/3', stage: 'Stade I', type: 'Solide' },
  { nom: 'HAMIDI', prenom: 'Malika', sexe: 'F', wilaya: '15 Tizi Ouzou', profession: 'Sans profession', age: 61, topography: 'C50.1', morphology: '8520/3', stage: 'Stade II', type: 'Solide' },
  { nom: 'BELKACEM', prenom: 'Yacine', sexe: 'M', wilaya: '23 Annaba', profession: 'Commerçant', age: 55, topography: 'C61.9', morphology: '8140/3', stage: 'Stade III', type: 'Solide' },
  { nom: 'MOKHTARI', prenom: 'Samira', sexe: 'F', wilaya: '13 Tlemcen', profession: 'Avocate', age: 43, topography: 'C53.9', morphology: '8070/3', stage: 'Stade I', type: 'Solide' },
  { nom: 'REZZAG', prenom: 'Omar', sexe: 'M', wilaya: '30 Ouargla', profession: 'Technicien pétrolier', age: 48, topography: 'C34.1', morphology: '8012/3', stage: 'Stade IV', type: 'Solide' },
  { nom: 'CHENITI', prenom: 'Nabila', sexe: 'F', wilaya: '05 Batna', profession: 'Médecin', age: 37, topography: 'C82.9', morphology: '9690/3', stage: 'Stade II', type: 'Liquide' },
  { nom: 'BOUAZIZ', prenom: 'Sid Ahmed', sexe: 'M', wilaya: '29 Mascara', profession: 'Agriculteur', age: 72, topography: 'C61.9', morphology: '8140/3', stage: 'Stade IV', type: 'Solide' },
  { nom: 'ZOUAOUI', prenom: 'Linda', sexe: 'F', wilaya: '16 Alger', profession: 'Journaliste', age: 29, topography: 'C81.9', morphology: '9650/3', stage: 'Stade I', type: 'Liquide' },
  { nom: 'LAHMER', prenom: 'Mustapha', sexe: 'M', wilaya: '39 El Oued', profession: 'Chauffeur', age: 50, topography: 'C18.0', morphology: '8140/3', stage: 'Stade II', type: 'Solide' },
  { nom: 'CHABANE', prenom: 'Rachida', sexe: 'F', wilaya: '18 Jijel', profession: 'Cuisinière', age: 58, topography: 'C50.9', morphology: '8500/3', stage: 'Stade III', type: 'Solide' },
  { nom: 'AISSAT', prenom: 'Salim', sexe: 'M', wilaya: '09 Blida', profession: 'Comptable', age: 41, topography: 'C22.0', morphology: '8170/3', stage: 'Stade II', type: 'Solide' },
  { nom: 'LARIBI', prenom: 'Hiba', sexe: 'F', wilaya: '34 Bordj Bou Arréridj', profession: 'Étudiante', age: 22, topography: 'C91.0', morphology: '9820/3', stage: 'Stade I', type: 'Liquide' },
  { nom: 'FERHANI', prenom: 'Abdelkader', sexe: 'M', wilaya: '27 Mostaganem', profession: 'Pêcheur', age: 63, topography: 'C34.9', morphology: '8041/3', stage: 'Stade III', type: 'Solide' },
  { nom: 'OULD ALI', prenom: 'Djamel', sexe: 'M', wilaya: '15 Tizi Ouzou', profession: 'Menuisier', age: 56, topography: 'C67.9', morphology: '8120/3', stage: 'Stade II', type: 'Solide' },
  { nom: 'BOUCHAREB', prenom: 'Zahia', sexe: 'F', wilaya: '19 Sétif', profession: 'Pharmacienne', age: 47, topography: 'C50.4', morphology: '8500/3', stage: 'Stade II', type: 'Solide' },
  { nom: 'HADJADJ', prenom: 'Toufik', sexe: 'M', wilaya: '17 Djelfa', profession: 'Éleveur', age: 65, topography: 'C16.9', morphology: '8140/3', stage: 'Stade IV', type: 'Solide' },
  { nom: 'MOUHOUB', prenom: 'Lydia', sexe: 'F', wilaya: '16 Alger', profession: 'Architecte', age: 34, topography: 'C56.9', morphology: '8441/3', stage: 'Stade I', type: 'Solide' }
];

async function seed() {
  console.log('🚀 Démarrage du seeding clinique nominal spécial...');
  
  try {
    // 0. Get a valid user ID for created_by
    const [users] = await pool.execute('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      console.error('❌ Aucun utilisateur trouvé. Veuillez créer un compte admin avant de lancer ce script.');
      process.exit(1);
    }
    const creatorId = users[0].id;

    for (const p of REAL_PATIENTS) {
      const patientId = uuidv4();
      const birthYear = new Date().getFullYear() - p.age;
      const dateNaissance = `${birthYear}-06-15`;
      const numCarte = Math.floor(100000000 + Math.random() * 900000000).toString();
      const numChifa = Math.floor(100000000000 + Math.random() * 900000000000).toString();

      // 1. Insert Patient
      await pool.execute(
        `INSERT INTO patients (id, nom, prenom, date_naissance, sexe, wilaya, profession, num_carte_nationale, num_carte_chifa, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [patientId, p.nom, p.prenom, dateNaissance, p.sexe, p.wilaya, p.profession, numCarte, numChifa, creatorId]
      );

      // 2. Insert Cancer Case
      const caseId = uuidv4();
      await pool.execute(
        `INSERT INTO cancer_cases (id, patient_id, type_cancer, topographie_icdo3, morphologie_icdo3, stade, date_diagnostic) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [caseId, patientId, p.type, p.topography, p.morphology, p.stage, '2024-01-10']
      );

      console.log(`✅ Patient ajouté : ${p.prenom} ${p.nom} (${p.wilaya})`);
    }

    console.log('\n✨ Seeding terminé avec succès ! 20 profils réels créés.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur pendant le seeding :', err);
    process.exit(1);
  }
}

seed();
