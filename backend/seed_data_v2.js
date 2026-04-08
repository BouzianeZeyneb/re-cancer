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

const NOMS = ["Mansouri", "Benalla", "Hadj-Ali", "Belkacem", "Ziane", "Merbah", "Meziane", "Brahimi", "Abane", "Krim", "Boudiaf", "Hamdad", "Oussalah", "Guermazi", "Ait-Ahmed"];
const PRENOMS_H = ["Mohamed", "Smail", "Karim", "Mustapha", "Amine", "Lyes", "Yacine", "Nabil", "Sami", "Redouane"];
const PRENOMS_F = ["Nadia", "Kahina", "Sonia", "Lynda", "Meriem", "Yasmine", "Imane", "Leila", "Assia", "Amel"];
const WILAYAS = ["16 Alger", "31 Oran", "25 Constantine", "09 Blida", "23 Annaba", "19 Sétif", "13 Tlemcen", "06 Béjaïa", "15 Tizi Ouzou", "17 Djelfa"];
const CANCERS = ["Sein", "Poumon", "Colorectal", "Prostate", "Estomac", "Vessie"];

async function seed() {
  const conn = await pool.getConnection();
  console.log("🚀 Lancement de l'injection 2026 (Fix)...");
  try {
    const [users] = await conn.execute('SELECT id FROM users LIMIT 1');
    const adminId = users[0]?.id;
    if (!adminId) return console.error("❌ Pas d'admin.");

    for (let i = 0; i < 20; i++) {
       const pId = uuidv4();
       const sexe = Math.random() > 0.5 ? 'M' : 'F';
       const nom = NOMS[Math.floor(Math.random() * NOMS.length)].toUpperCase();
       const prenom = sexe === 'M' ? PRENOMS_H[Math.floor(Math.random() * PRENOMS_H.length)] : PRENOMS_F[Math.floor(Math.random() * PRENOMS_F.length)];
       const wilaya = WILAYAS[Math.floor(Math.random() * WILAYAS.length)];
       const dateNais = `${1960 + Math.floor(Math.random() * 30)}-05-10`;

       // Correction: adresse (pas address)
       await conn.execute(
         'INSERT INTO patients (id, nom, prenom, date_naissance, sexe, wilaya, adresse, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
         [pId, nom, prenom, dateNais, sexe, wilaya, `Quartier Résidentiel, ${wilaya}`, adminId]
       );

       const cId = uuidv4();
       const diag = CANCERS[Math.floor(Math.random() * CANCERS.length)];
       const stade = ['Stade I', 'Stade II', 'Stade III', 'Stade IV'][Math.floor(Math.random() * 4)];
       const statut = ['En traitement', 'Guéri', 'Décédé'][Math.floor(Math.random() * 3)];
       const dateDiag = `2026-${String(1 + Math.floor(Math.random() * 4)).padStart(2, '0')}-01`;

       await conn.execute(
         'INSERT INTO cancer_cases (id, patient_id, type_cancer, sous_type, stade, statut_patient, date_diagnostic, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
         [cId, pId, 'Solide', diag, stade, statut, dateDiag, adminId]
       );
    }
    console.log("✅ 20 nouveaux dossiers patients pour 2026 injectés avec succès !");
  } catch (err) {
    console.error("❌ Erreur SQL :", err.message);
  } finally {
    conn.release();
    process.exit();
  }
}
seed();
