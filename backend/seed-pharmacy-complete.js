require('dotenv').config();
const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

const MEDICAMENTS = [
  // === CHIMIOTHÉRAPIE ===
  { nom: 'Cisplatine', dosage: '50mg/100ml', forme: 'Injectable', stock: 25, seuil: 10, seuil_r: 2, cat: 'Chimio', prix: 1200.50, exp: '2026-12-01', type: 'Cytotoxique' },
  { nom: 'Paclitaxel (Taxol)', dosage: '30mg/5ml', forme: 'Injectable', stock: 18, seuil: 10, seuil_r: 1, cat: 'Chimio', prix: 4500.00, exp: '2026-08-15', type: 'Cytotoxique' },
  { nom: 'Fluorouracil (5-FU)', dosage: '500mg/10ml', forme: 'Injectable', stock: 30, seuil: 15, seuil_r: 5, cat: 'Chimio', prix: 850.00, exp: '2026-11-20', type: 'Cytotoxique' },
  { nom: 'Docétaxel (Taxotère)', dosage: '80mg/4ml', forme: 'Injectable', stock: 12, seuil: 5, seuil_r: 2, cat: 'Chimio', prix: 6200.00, exp: '2026-09-10', type: 'Cytotoxique' },
  { nom: 'Carboplatine', dosage: '150mg/15ml', forme: 'Injectable', stock: 20, seuil: 5, seuil_r: 1, cat: 'Chimio', prix: 2100.00, exp: '2026-07-22', type: 'Cytotoxique' },
  { nom: 'Doxorubicine', dosage: '50mg', forme: 'Poudre injectable', stock: 14, seuil: 5, seuil_r: 2, cat: 'Chimio', prix: 3400.00, exp: '2026-05-15', type: 'Cytotoxique' },
  { nom: 'Oxaliplatine', dosage: '100mg/20ml', forme: 'Injectable', stock: 16, seuil: 5, seuil_r: 1, cat: 'Chimio', prix: 2800.00, exp: '2026-10-30', type: 'Cytotoxique' },
  { nom: 'Gemcitabine', dosage: '1000mg', forme: 'Poudre injectable', stock: 22, seuil: 8, seuil_r: 2, cat: 'Chimio', prix: 1900.00, exp: '2027-01-15', type: 'Cytotoxique' },
  { nom: 'Pemetrexed (Alimta)', dosage: '500mg', forme: 'Poudre injectable', stock: 8, seuil: 5, seuil_r: 1, cat: 'Chimio', prix: 15000.00, exp: '2026-06-30', type: 'Cytotoxique' },
  { nom: 'Cyclophosphamide', dosage: '500mg', forme: 'Poudre injectable', stock: 35, seuil: 10, seuil_r: 3, cat: 'Chimio', prix: 950.00, exp: '2027-03-20', type: 'Cytotoxique' },
  { nom: 'Epirubicine', dosage: '100mg/50ml', forme: 'Injectable', stock: 10, seuil: 5, seuil_r: 1, cat: 'Chimio', prix: 4200.00, exp: '2026-04-10', type: 'Cytotoxique' },
  { nom: 'Vincristine', dosage: '1mg/ml', forme: 'Injectable', stock: 18, seuil: 5, seuil_r: 1, cat: 'Chimio', prix: 1600.00, exp: '2026-08-01', type: 'Cytotoxique' },
  { nom: 'Méthotrexate', dosage: '50mg', forme: 'Injectable', stock: 28, seuil: 8, seuil_r: 2, cat: 'Chimio', prix: 780.00, exp: '2027-02-28', type: 'Cytotoxique' },
  { nom: 'Irinotecan', dosage: '300mg/15ml', forme: 'Injectable', stock: 12, seuil: 5, seuil_r: 1, cat: 'Chimio', prix: 3200.00, exp: '2026-09-15', type: 'Cytotoxique' },
  { nom: 'Capécitabine (Xeloda)', dosage: '500mg', forme: 'Comprimé', stock: 120, seuil: 30, seuil_r: 10, cat: 'Chimio', prix: 2500.00, exp: '2027-05-10', type: 'Cytotoxique' },

  // === THÉRAPIES CIBLÉES ===
  { nom: 'Trastuzumab (Herceptin)', dosage: '150mg', forme: 'Poudre injectable', stock: 6, seuil: 5, seuil_r: 1, cat: 'Therapie Ciblee', prix: 45000.00, exp: '2026-06-28', type: 'Thérapie ciblée' },
  { nom: 'Osimertinib (Tagrisso)', dosage: '80mg', forme: 'Comprimé', stock: 5, seuil: 5, seuil_r: 1, cat: 'Therapie Ciblee', prix: 185000.00, exp: '2026-07-30', type: 'Thérapie ciblée' },
  { nom: 'Pembrolizumab (Keytruda)', dosage: '100mg/4ml', forme: 'Injectable', stock: 4, seuil: 3, seuil_r: 1, cat: 'Therapie Ciblee', prix: 210000.00, exp: '2026-05-12', type: 'Immunothérapie' },
  { nom: 'Bevacizumab (Avastin)', dosage: '400mg/16ml', forme: 'Injectable', stock: 7, seuil: 4, seuil_r: 1, cat: 'Therapie Ciblee', prix: 65000.00, exp: '2026-10-01', type: 'Thérapie ciblée' },
  { nom: 'Imatinib (Glivec)', dosage: '400mg', forme: 'Comprimé', stock: 60, seuil: 15, seuil_r: 5, cat: 'Therapie Ciblee', prix: 32000.00, exp: '2027-04-15', type: 'Thérapie ciblée' },
  { nom: 'Erlotinib (Tarceva)', dosage: '150mg', forme: 'Comprimé', stock: 30, seuil: 10, seuil_r: 3, cat: 'Therapie Ciblee', prix: 78000.00, exp: '2026-12-20', type: 'Thérapie ciblée' },
  { nom: 'Nivolumab (Opdivo)', dosage: '100mg/10ml', forme: 'Injectable', stock: 5, seuil: 3, seuil_r: 1, cat: 'Therapie Ciblee', prix: 195000.00, exp: '2026-08-30', type: 'Immunothérapie' },
  { nom: 'Rituximab (MabThera)', dosage: '500mg/50ml', forme: 'Injectable', stock: 8, seuil: 4, seuil_r: 1, cat: 'Therapie Ciblee', prix: 55000.00, exp: '2026-11-10', type: 'Thérapie ciblée' },
  { nom: 'Abiratérone (Zytiga)', dosage: '250mg', forme: 'Comprimé', stock: 45, seuil: 10, seuil_r: 3, cat: 'Therapie Ciblee', prix: 48000.00, exp: '2027-02-15', type: 'Hormonothérapie' },

  // === SUPPORT / ANTIÉMÉTIQUES ===
  { nom: 'Ondansétron', dosage: '8mg', forme: 'Injectable', stock: 150, seuil: 30, seuil_r: 10, cat: 'Support', prix: 450.00, exp: '2027-06-01', type: 'Antiémétique' },
  { nom: 'Granisétron', dosage: '3mg/3ml', forme: 'Injectable', stock: 80, seuil: 20, seuil_r: 5, cat: 'Support', prix: 620.00, exp: '2027-03-15', type: 'Antiémétique' },
  { nom: 'Dexaméthasone', dosage: '4mg', forme: 'Injectable', stock: 200, seuil: 40, seuil_r: 10, cat: 'Support', prix: 120.00, exp: '2027-08-15', type: 'Corticoïde' },
  { nom: 'Filgrastim G-CSF (Neupogen)', dosage: '30 MU', forme: 'Seringue pré-remplie', stock: 50, seuil: 15, seuil_r: 5, cat: 'Support', prix: 8900.00, exp: '2026-10-01', type: 'Facteur de croissance' },
  { nom: 'Méthylprednisolone', dosage: '1000mg', forme: 'Poudre injectable', stock: 40, seuil: 10, seuil_r: 3, cat: 'Support', prix: 890.00, exp: '2027-01-20', type: 'Corticoïde' },
  { nom: 'Allopurinol', dosage: '300mg', forme: 'Comprimé', stock: 300, seuil: 50, seuil_r: 20, cat: 'Support', prix: 85.00, exp: '2027-09-10', type: 'Antiuricémique' },
  { nom: 'Mesna (Uromitexan)', dosage: '400mg/4ml', forme: 'Injectable', stock: 60, seuil: 15, seuil_r: 5, cat: 'Support', prix: 560.00, exp: '2027-04-20', type: 'Uroprotecteur' },
  { nom: 'Acide folique (Leukovorine)', dosage: '50mg', forme: 'Injectable', stock: 90, seuil: 20, seuil_r: 5, cat: 'Support', prix: 380.00, exp: '2027-07-01', type: 'Vitamine' },
  { nom: 'Zolédronique (Zometa)', dosage: '4mg/5ml', forme: 'Injectable', stock: 25, seuil: 8, seuil_r: 2, cat: 'Support', prix: 4800.00, exp: '2026-09-25', type: 'Bisphosphonate' },

  // === ADJUVANTS / HORMONOTHÉRAPIE ===
  { nom: 'Tamoxifène', dosage: '20mg', forme: 'Comprimé', stock: 250, seuil: 40, seuil_r: 15, cat: 'Adjuvant', prix: 1500.00, exp: '2027-12-01', type: 'Hormonothérapie' },
  { nom: 'Létrozole (Femara)', dosage: '2.5mg', forme: 'Comprimé', stock: 180, seuil: 30, seuil_r: 10, cat: 'Adjuvant', prix: 2200.00, exp: '2027-10-15', type: 'Hormonothérapie' },
  { nom: 'Anastrozole (Arimidex)', dosage: '1mg', forme: 'Comprimé', stock: 160, seuil: 30, seuil_r: 10, cat: 'Adjuvant', prix: 1800.00, exp: '2027-08-20', type: 'Hormonothérapie' },
  { nom: 'Leuproréline (Enantone)', dosage: '22.5mg', forme: 'Injectable retard', stock: 20, seuil: 5, seuil_r: 1, cat: 'Adjuvant', prix: 12000.00, exp: '2026-11-30', type: 'Hormonothérapie' },
  { nom: 'Goséréline (Zoladex)', dosage: '10.8mg', forme: 'Implant SC', stock: 15, seuil: 5, seuil_r: 1, cat: 'Adjuvant', prix: 9500.00, exp: '2026-10-10', type: 'Hormonothérapie' },
  { nom: 'Exemestane (Aromasin)', dosage: '25mg', forme: 'Comprimé', stock: 90, seuil: 20, seuil_r: 5, cat: 'Adjuvant', prix: 3200.00, exp: '2027-06-15', type: 'Hormonothérapie' },
  { nom: 'Bicalutamide', dosage: '50mg', forme: 'Comprimé', stock: 120, seuil: 25, seuil_r: 8, cat: 'Adjuvant', prix: 1100.00, exp: '2027-09-30', type: 'Antiandrogène' },
];

const ALTERNATIVES = [
  { drug: 'Cisplatine', alt: 'Carboplatine', just: 'Moins néphrotoxique, substitution validée si clairance créatinine < 60ml/min.' },
  { drug: 'Paclitaxel (Taxol)', alt: 'Docétaxel (Taxotère)', just: 'Même classe (Taxanes), utilisé en cas de pénurie ou hypersensibilité.' },
  { drug: 'Fluorouracil (5-FU)', alt: 'Capécitabine (Xeloda)', just: 'Alternative orale, évite l\'infuseur continu.' },
  { drug: 'Pembrolizumab (Keytruda)', alt: 'Nivolumab (Opdivo)', just: 'Immunothérapie Anti-PD1 alternative selon indication spécifique.' },
  { drug: 'Ondansétron', alt: 'Granisétron', just: 'Même classe sétron, interchangeable en cas de rupture.' },
  { drug: 'Doxorubicine', alt: 'Epirubicine', just: 'Anthracycline alternative, cardiotoxicité légèrement moindre.' },
  { drug: 'Methotrexate', alt: 'Pemetrexed (Alimta)', just: 'Antifolate de nouvelle génération, meilleur profil de tolérance.' },
];

async function seedPharmacyComplete() {
  console.log('\n🏥 ═══════════════════════════════════════════════════════');
  console.log('   DÉMARRAGE SEEDING COMPLET PHARMACIE ONCOLOGIQUE');
  console.log('═══════════════════════════════════════════════════════\n');
  const conn = await pool.getConnection();

  try {
    // 1. Ajouter colonne type si elle n'existe pas
    try {
      await conn.execute(`ALTER TABLE medicaments_stock ADD COLUMN type_medicament VARCHAR(100) DEFAULT 'Non classifié'`);
      console.log('✅ Colonne type_medicament ajoutée');
    } catch(e) { console.log('ℹ️  Colonne type_medicament existe déjà'); }

    // 2. Nettoyage
    console.log('\n🗑️  Nettoyage des anciennes données...');
    await conn.execute('SET FOREIGN_KEY_CHECKS=0');
    await conn.execute('DELETE FROM alternatives_medicaments');
    await conn.execute('DELETE FROM medicaments_stock');
    await conn.execute('SET FOREIGN_KEY_CHECKS=1');
    console.log('✅ Tables vidées\n');

    // 3. Insertion médicaments
    console.log('💊 Insertion des médicaments...\n');
    const drugToId = {};

    for (const m of MEDICAMENTS) {
      const id = uuidv4();
      await conn.execute(
        `INSERT INTO medicaments_stock 
        (id, nom_dci, dosage, forme, stock_actuel, seuil_alerte, seuil_rupture, categorie, prix, date_expiration, type_medicament) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
        [id, m.nom, m.dosage, m.forme, m.stock, m.seuil, m.seuil_r, m.cat, m.prix, m.exp, m.type]
      );
      drugToId[m.nom] = id;

      const stockStatus = m.stock <= m.seuil_r ? '🔴 RUPTURE' : m.stock <= m.seuil ? '🟡 ALERTE' : '🟢 OK';
      console.log(`  ${stockStatus} ${m.nom.padEnd(35)} | Stock: ${String(m.stock).padStart(3)} | ${m.prix.toLocaleString().padStart(10)} DA | Exp: ${m.exp}`);
    }

    // 4. Insertion alternatives
    console.log('\n🔗 Liaison des alternatives cliniques...');
    for (const a of ALTERNATIVES) {
      const drugId = drugToId[a.drug];
      if (drugId) {
        await conn.execute(
          'INSERT INTO alternatives_medicaments (id, drug_id, alternative_nom, justification) VALUES (?,?,?,?)',
          [uuidv4(), drugId, a.alt, a.just]
        );
        console.log(`  ✅ ${a.drug} → ${a.alt}`);
      }
    }

    // 5. Affichage résultats finaux
    const [total] = await conn.execute('SELECT COUNT(*) as n FROM medicaments_stock');
    const [alerte] = await conn.execute('SELECT COUNT(*) as n FROM medicaments_stock WHERE stock_actuel <= seuil_alerte AND stock_actuel > seuil_rupture');
    const [rupture] = await conn.execute('SELECT COUNT(*) as n FROM medicaments_stock WHERE stock_actuel <= seuil_rupture');
    const [alts] = await conn.execute('SELECT COUNT(*) as n FROM alternatives_medicaments');
    const [valeurTotal] = await conn.execute('SELECT ROUND(SUM(stock_actuel * prix), 2) as val FROM medicaments_stock');

    const [byCategorie] = await conn.execute('SELECT categorie, COUNT(*) as n, SUM(stock_actuel) as stock FROM medicaments_stock GROUP BY categorie');
    const [byType] = await conn.execute('SELECT type_medicament, COUNT(*) as n FROM medicaments_stock GROUP BY type_medicament ORDER BY n DESC');

    console.log('\n╔══════════════════════════════════════════════════════╗');
    console.log('║         RÉSULTATS - BASE PHARMACIE ONCOLOGIQUE       ║');
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log(`║  💊 Total médicaments    : ${String(total[0].n).padStart(3)}                         ║`);
    console.log(`║  🟡 En alerte stock      : ${String(alerte[0].n).padStart(3)}                         ║`);
    console.log(`║  🔴 En rupture           : ${String(rupture[0].n).padStart(3)}                         ║`);
    console.log(`║  🔗 Alternatives liées   : ${String(alts[0].n).padStart(3)}                         ║`);
    console.log(`║  💰 Valeur totale stock  : ${String(valeurTotal[0].val?.toLocaleString() + ' DA').padStart(18)}               ║`);
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  PAR CATÉGORIE :                                     ║');
    byCategorie.forEach(r => console.log(`║    - ${r.categorie.padEnd(20)} : ${String(r.n).padStart(2)} médicaments, stock=${r.stock}    ║`.substring(0,56)+'║'));
    console.log('╠══════════════════════════════════════════════════════╣');
    console.log('║  PAR TYPE :                                          ║');
    byType.forEach(r => console.log(`║    - ${r.type_medicament.padEnd(25)} : ${String(r.n).padStart(2)}             ║`.substring(0,56)+'║'));
    console.log('╚══════════════════════════════════════════════════════╝');
    console.log('\n✅ BASE DE DONNÉES PHARMACIE COMPLÈTE ET OPÉRATIONNELLE !\n');

  } catch (err) {
    console.error('❌ ERREUR:', err.message);
    console.error(err);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedPharmacyComplete();
