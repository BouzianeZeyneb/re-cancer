const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cancer_registry'
});

async function seed() {
  console.log('--- DÉBUT DE L\'INJECTION (Version Corrigée) ---');
  try {
    const wilayas = ['Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Sétif', 'Batna', 'Tizi Ouzou'];
    const stades = ['Stade I', 'Stade II', 'Stade III', 'Stade IV'];
    const statuts = ['En traitement', 'Guéri', 'Décédé'];

    for (let i = 1; i <= 50; i++) {
      const pId = uuidv4();
      const cId = uuidv4();
      const sexe = Math.random() > 0.5 ? 'M' : 'F';
      const wilaya = wilayas[Math.floor(Math.random() * wilayas.length)];
      const stade = stades[Math.floor(Math.random() * stades.length)];
      const statut = statuts[Math.floor(Math.random() * statuts.length)];
      const dateDiag = `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
      const birth = `${Math.floor(Math.random() * 50) + 1950}-01-01`;

      // 1. Insert Patient
      await pool.execute(
        `INSERT INTO patients (id, nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, wilaya, commune, fumeur, alcool) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [pId, `TEST_NOM_${i}`, `TEST_PRENOM_${i}`, birth, sexe, `05550000${i}`, `999000${i}`, wilaya, 'Commune_X', Math.random()>0.7, Math.random()>0.8]
      );

      // 2. Insert Cancer Case
      await pool.execute(
        `INSERT INTO cancer_cases (id, patient_id, type_cancer, date_diagnostic, stade, statut_patient, etat, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [cId, pId, 'Solide', dateDiag, stade, statut, 'Localisé', dateDiag]
      );
    }

    console.log('--- RÉUSSITE : 50 DOSSIERS RÉELS INJECTÉS ---');
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

seed();
