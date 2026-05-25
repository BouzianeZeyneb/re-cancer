require('dotenv').config();
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// ---------------------------------------------------------------------------
const FIRST_NAMES_M = ['Ahmed','Karim','Mohamed','Omar','Rachid','Samir','Youssef','Nabil','Mourad','Hassan','Ali','Khaled','Farid','Djamel','Redouane','Sofiane','Bilal','Abdelkader'];
const FIRST_NAMES_F = ['Fatima','Aicha','Nadia','Sofia','Leila','Meryem','Khadija','Lamia','Amina','Samira','Houria','Yasmina','Djamila','Farida','Souad','Malika','Sihem','Sabrina'];
const LAST_NAMES = ['Boudiaf','Benali','Cherif','Meziane','Aissaoui','Belarbi','Khedim','Hadj','Boucherit','Tadjine','Mammeri','Benkhedda','Ferhat','Slimani','Ouali','Zidane','Haddad','Brahimi','Djelloul','Kaci'];

// Wilayas with real coordinates for proper SIG display
const WILAYAS = [
  { name: 'Alger',       lat: 36.737, lng: 3.086 },
  { name: 'Oran',        lat: 35.691, lng: -0.641 },
  { name: 'Constantine', lat: 36.365, lng: 6.614 },
  { name: 'Annaba',      lat: 36.900, lng: 7.767 },
  { name: 'Skikda',      lat: 36.876, lng: 6.908 },
  { name: 'Tizi Ouzou',  lat: 36.717, lng: 4.050 },
  { name: 'Sétif',       lat: 36.190, lng: 5.410 },
  { name: 'Batna',       lat: 35.556, lng: 6.174 },
  { name: 'Blida',       lat: 36.470, lng: 2.830 },
  { name: 'Béjaïa',      lat: 36.752, lng: 5.057 },
  { name: 'Biskra',      lat: 34.850, lng: 5.730 },
  { name: 'Ouargla',     lat: 31.950, lng: 5.330 },
  { name: 'Chlef',       lat: 36.160, lng: 1.330 },
  { name: 'Médéa',       lat: 36.260, lng: 2.750 },
  { name: 'Mostaganem',  lat: 35.930, lng: 0.090 },
  { name: 'Tébessa',     lat: 35.400, lng: 8.120 },
  { name: 'Tlemcen',     lat: 34.880, lng: -1.316 },
  { name: 'Jijel',       lat: 36.820, lng: 5.770 },
  { name: 'Boumerdès',   lat: 36.760, lng: 3.480 },
  { name: 'Tipaza',      lat: 36.590, lng: 2.450 },
];

const CANCER_TYPES = [
  { type: 'Solide', sous_type: 'Cancer du Sein' },
  { type: 'Solide', sous_type: 'Cancer du Poumon non à petites cellules' },
  { type: 'Solide', sous_type: 'Cancer du Côlon' },
  { type: 'Solide', sous_type: 'Cancer de la Prostate' },
  { type: 'Solide', sous_type: 'Cancer de la Vessie' },
  { type: 'Solide', sous_type: 'Cancer de l\'Endomètre' },
  { type: 'Solide', sous_type: 'Mésothéliome Pleural' },
  { type: 'Solide', sous_type: 'Cancer de l\'Estomac' },
  { type: 'Solide', sous_type: 'Cancer du Rein' },
  { type: 'Solide', sous_type: 'Cancer du Foie' },
  { type: 'Liquide', sous_type: 'Leucémie Lymphoïde Chronique' },
  { type: 'Liquide', sous_type: 'Lymphome de Hodgkin' },
];

// Professions with industrial exposure info
const PROFESSIONS = [
  { name: 'Ouvrier Chimique',       industrial: true,  detail: 'Exposition aux solvants et produits chimiques industriels' },
  { name: 'Soudeur',                industrial: true,  detail: 'Exposition aux fumées de soudure et métaux lourds' },
  { name: 'Technicien Électronique', industrial: true,  detail: 'Exposition aux composants électroniques et flux de soudure' },
  { name: 'Ouvrier Pétrochimie',    industrial: true,  detail: 'Exposition aux hydrocarbures et dérivés pétroliers' },
  { name: 'Mineur',                 industrial: true,  detail: 'Exposition aux poussières minérales et silice' },
  { name: 'Ouvrier Cimenterie',     industrial: true,  detail: 'Exposition aux poussières de ciment et calcite' },
  { name: 'Agriculteur',            industrial: false, detail: null },
  { name: 'Professeur',             industrial: false, detail: null },
  { name: 'Médecin',                industrial: false, detail: null },
  { name: 'Conducteur de Bus',      industrial: false, detail: null },
  { name: 'Employé Administratif',  industrial: false, detail: null },
  { name: 'Commerçant',             industrial: false, detail: null },
  { name: 'Retraité',               industrial: false, detail: null },
];

const STATUTS = ['En traitement', 'En traitement', 'En traitement', 'Guéri', 'Décédé'];
const ETATS = ['Localisé', 'Localisé', 'Localisé', 'Métastase'];
const STADES = ['Stade I', 'Stade IA', 'Stade IB', 'Stade IIA', 'Stade IIB', 'Stade IIIA', 'Stade IIIB', 'Stade IV'];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}
function formatDate(d) { return d.toISOString().split('T')[0]; }

async function main() {
  console.log('🚀 Bulk seeding: 40 additional patients with professions & cancer cases...\n');
  const conn = await pool.getConnection();
  try {
    const [admins] = await conn.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (admins.length === 0) { console.error('❌ No admin user found'); return; }
    const adminId = admins[0].id;

    const total = 40;
    let industrialCount = 0;
    for (let i = 0; i < total; i++) {
      const gender = Math.random() < 0.5 ? 'M' : 'F';
      const prenom = gender === 'M' ? randomItem(FIRST_NAMES_M) : randomItem(FIRST_NAMES_F);
      const nom = randomItem(LAST_NAMES);
      const dob = formatDate(randomDate(1945, 1998));
      const w = randomItem(WILAYAS);
      const lat = (w.lat + (Math.random() - 0.5) * 0.15).toFixed(6);
      const lng = (w.lng + (Math.random() - 0.5) * 0.15).toFixed(6);
      const telephone = '05' + Math.floor(10000000 + Math.random() * 90000000);
      const prof = randomItem(PROFESSIONS);
      if (prof.industrial) industrialCount++;

      const patientId = uuidv4();
      await conn.execute(
        `INSERT INTO patients (id, nom, prenom, date_naissance, sexe, telephone, wilaya, commune, latitude, longitude, profession, exposition_pro, exposition_pro_detail, fumeur, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [patientId, nom, prenom, dob, gender, telephone, w.name, w.name + ' Centre',
         lat, lng, prof.name, prof.industrial ? 1 : 0, prof.detail,
         Math.random() < 0.3 ? 1 : 0, adminId]
      );

      // Cancer case
      const cancer = randomItem(CANCER_TYPES);
      const caseId = uuidv4();
      const diagDate = formatDate(randomDate(2022, 2025));
      const stade = randomItem(STADES);
      const etat = randomItem(ETATS);
      const statut = randomItem(STATUTS);
      await conn.execute(
        `INSERT INTO cancer_cases (id, patient_id, type_cancer, sous_type, etat, stade, date_diagnostic, statut_patient, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [caseId, patientId, cancer.type, cancer.sous_type, etat, stade, diagDate, statut, adminId]
      );

      const tag = prof.industrial ? '🔴' : '🟢';
      console.log(`  ${tag} ${prenom} ${nom} | ${w.name} | ${prof.name} | ${cancer.sous_type}`);
    }

    console.log(`\n✅ ${total} patients créés (dont ${industrialCount} exposés industriellement)`);
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

main();
