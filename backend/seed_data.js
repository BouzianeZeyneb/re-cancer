const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cancer_registry',
  port: process.env.DB_PORT || 3306
});

const NOMS = ["Hadj-Ali", "Benbouali", "Mansouri", "Belkacem", "Meziane", "Brahimi", "Ait-Ahmed", "Ziane", "Merbah", "Hamdad", "Oussalah", "Ferhat", "Guermazi", "Boudiaf", "Krim", "Abane", "Ben M'hidi", "Lotfi", "Amrouche", "Feraoun"];
const PRENOMS_H = ["Mohamed", "Amine", "Mustapha", "Lyes", "Sami", "Karim", "Yacine", "Nabil", "Redouane", "Walid", "Fayçal", "Abdelkrim"];
const PRENOMS_F = ["Nadia", "Sonia", "Lynda", "Meriem", "Yasmine", "Imane", "Leila", "Kahina", "Assia", "Amel", "Zohra", "Fatma-Zohra"];
const WILAYAS = ["16 Alger", "31 Oran", "25 Constantine", "09 Blida", "23 Annaba", "19 Sétif", "13 Tlemcen", "35 Boumerdès", "06 Béjaïa", "15 Tizi Ouzou"];
const CANCERS = ["Sein", "Poumon", "Colorectal", "Prostate", "Estomac", "Vessie"];

async function seed() {
  const conn = await pool.getConnection();
  console.log("🚀 Début de l'injection des données...");

  try {
    const [users] = await conn.execute('SELECT id FROM users LIMIT 1');
    const adminId = users[0]?.id;

    if (!adminId) {
       console.error("❌ Aucun utilisateur trouvé. Veuillez d'abord créer un compte admin.");
       return;
    }

    // Supprimer les anciennes données de test (optionnel mais recommandé pour les tests)
    // await conn.execute('DELETE FROM cancer_cases');
    // await conn.execute('DELETE FROM patients');

    for (let i = 0; i < 30; i++) {
      const pId = uuidv4();
      const sexe = Math.random() > 0.5 ? 'M' : 'F';
      const nom = NOMS[Math.floor(Math.random() * NOMS.length)];
      const prenom = sexe === 'M' ? PRENOMS_H[Math.floor(Math.random() * PRENOMS_H.length)] : PRENOMS_F[Math.floor(Math.random() * PRENOMS_F.length)];
      const wilaya = WILAYAS[Math.floor(Math.random() * WILAYAS.length)];
      const dateNais = `${1950 + Math.floor(Math.random() * 40)}-${String(1 + Math.floor(Math.random() * 11)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 27)).padStart(2, '0')}`;

      // Insert Patient
      await conn.execute(
        'INSERT INTO patients (id, nom, prenom, date_naissance, sexe, wilaya, adresse, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [pId, nom, prenom, dateNais, sexe, wilaya, `Adresse ${i+1}, ${wilaya}`, adminId]
      );

      // Insert Cancer Case
      const cId = uuidv4();
      const typeC = Math.random() > 0.2 ? 'Solide' : 'Liquide';
      const sousType = CANCERS[Math.floor(Math.random() * CANCERS.length)];
      const stade = ['Stade I', 'Stade II', 'Stade III', 'Stade IV'][Math.floor(Math.random() * 4)];
      const statut = ['En traitement', 'Guéri', 'Décédé'][Math.floor(Math.random() * 3)];
      const dateDiag = `202${Math.floor(Math.random() * 5)}-${String(1 + Math.floor(Math.random() * 11)).padStart(2, '0')}-01`;

      await conn.execute(
        'INSERT INTO cancer_cases (id, patient_id, type_cancer, sous_type, stade, statut_patient, date_diagnostic, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [cId, pId, typeC, sousType, stade, statut, dateDiag, adminId]
      );
    }

    console.log("✅ 30 dossiers patients injectés avec succès !");
  } catch (err) {
    console.error("❌ Erreur lors de l'injection :", err);
  } finally {
    conn.release();
    process.exit();
  }
}

seed();
