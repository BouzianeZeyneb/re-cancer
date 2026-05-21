require('dotenv').config();
const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

// Professional Oncology Pharmacy Dataset
const MEDICAMENTS = [
  // Chimiothérapie
  { nom_dci: 'Cisplatine', dosage: '50mg/100ml', forme: 'Injectable', stock: 25, seuil: 10, seuil_r: 2, cat: 'Chimio', prix: 1200.50, exp: '2026-12-01' },
  { nom_dci: 'Paclitaxel', dosage: '30mg/5ml', forme: 'Injectable', stock: 8, seuil: 10, seuil_r: 1, cat: 'Chimio', prix: 4500.00, exp: '2026-05-15' },
  { nom_dci: 'Fluorouracil (5-FU)', dosage: '500mg/10ml', forme: 'Injectable', stock: 0, seuil: 15, seuil_r: 5, cat: 'Chimio', prix: 850.00, exp: '2025-11-20' },
  { nom_dci: 'Docétaxel', dosage: '80mg/4ml', forme: 'Injectable', stock: 12, seuil: 5, seuil_r: 2, cat: 'Chimio', prix: 6200.00, exp: '2026-08-10' },
  { nom_dci: 'Carboplatine', dosage: '150mg/15ml', forme: 'Injectable', stock: 18, seuil: 5, seuil_r: 1, cat: 'Chimio', prix: 2100.00, exp: '2026-03-22' },
  { nom_dci: 'Doxorubicine', dosage: '50mg', forme: 'Poudre', stock: 14, seuil: 5, seuil_r: 2, cat: 'Chimio', prix: 3400.00, exp: '2026-01-15' },
  
  // Thérapies Ciblées (High Cost)
  { nom_dci: 'Trastuzumab (Herceptin)', dosage: '150mg', forme: 'Injectable', stock: 5, seuil: 5, seuil_r: 1, cat: 'Therapie Ciblee', prix: 45000.00, exp: '2026-02-28' },
  { nom_dci: 'Osimertinib (Tagrisso)', dosage: '80mg', forme: 'Comprimé', stock: 3, seuil: 5, seuil_r: 1, cat: 'Therapie Ciblee', prix: 185000.00, exp: '2026-06-30' },
  { nom_dci: 'Pembrolizumab (Keytruda)', dosage: '100mg/4ml', forme: 'Injectable', stock: 2, seuil: 3, seuil_r: 1, cat: 'Therapie Ciblee', prix: 210000.00, exp: '2026-04-12' },
  
  // Support & Adjuvant
  { nom_dci: 'Ondansétron', dosage: '8mg', forme: 'Injection', stock: 85, seuil: 20, seuil_r: 5, cat: 'Support', prix: 450.00, exp: '2027-01-01' },
  { nom_dci: 'Dexaméthasone', dosage: '4mg', forme: 'Injectable', stock: 140, seuil: 20, seuil_r: 5, cat: 'Support', prix: 120.00, exp: '2027-06-15' },
  { nom_dci: 'Filgrastim (G-CSF)', dosage: '30 MU', forme: 'Seringue pré-remplie', stock: 45, seuil: 15, seuil_r: 5, cat: 'Support', prix: 8900.00, exp: '2026-09-01' },
  { nom_dci: 'Tamoxifène', dosage: '20mg', forme: 'Comprimé', stock: 200, seuil: 20, seuil_r: 10, cat: 'Adjuvant', prix: 1500.00, exp: '2027-10-10' },
];

const ALTERNATIVES = [
  { drug: 'Cisplatine', alt: 'Carboplatine', just: 'Moins néphrotoxique, substitution protocolaires validée si clairance créat < 60ml/min.' },
  { drug: 'Paclitaxel', alt: 'Docétaxel', just: 'Même classe (Taxanes), utilisé en cas de pénurie ou hypersensibilité spécifique.' },
  { drug: 'Fluorouracil (5-FU)', alt: 'Capécitabine', just: 'Alternative orale (Xeloda), permet d\'éviter l\'infuseur continu.' },
  { drug: 'Pembrolizumab', alt: 'Nivolumab', just: 'Immunothérapie alternative (Anti-PD1) selon indication spécifique.' },
];

async function seedPharmacy() {
  console.log('🚀 Démarrage du Seeding Hospital-Grade (Pharmacie)...');
  const conn = await pool.getConnection();

  try {
    // Nettoyage complet
    await conn.execute('SET FOREIGN_KEY_CHECKS=0');
    await conn.execute('DELETE FROM alternatives_medicaments');
    await conn.execute('DELETE FROM medicaments_stock');
    await conn.execute('SET FOREIGN_KEY_CHECKS=1');

    const drugToId = {};

    for (const m of MEDICAMENTS) {
      const id = uuidv4();
      await conn.execute(
        `INSERT INTO medicaments_stock 
        (id, nom_dci, dosage, forme, stock_actuel, seuil_alerte, seuil_rupture, categorie, prix, date_expiration) 
        VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [id, m.nom_dci, m.dosage, m.forme, m.stock, m.seuil, m.seuil_r, m.cat, m.prix, m.exp]
      );
      drugToId[m.nom_dci] = id;
      console.log(`✅ ${m.nom_dci.padEnd(25)} | Stock: ${m.stock.toString().padStart(3)} | Prix: ${m.prix.toLocaleString().padStart(8)} DA`);
    }

    console.log('\n🔗 Liaison des alternatives cliniques...');
    for (const a of ALTERNATIVES) {
      const drugId = drugToId[a.drug];
      if (drugId) {
        await conn.execute(
          'INSERT INTO alternatives_medicaments (id, drug_id, alternative_nom, justification) VALUES (?,?,?,?)',
          [uuidv4(), drugId, a.alt, a.just]
        );
      }
    }

    console.log('\n🌟 BASE DE DONNÉES PHARMACIE PRÊTE POUR LA PRODUCTION !');
  } catch (err) {
    console.error('❌ ERREUR CRITIQUE DURANT LE SEEDING:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedPharmacy();
