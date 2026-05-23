require('dotenv').config({ path: '../.env' });
const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function seedPrelevements() {
  console.log('\n🌱 Ajout de prélèvements de test pour ANAPATH...\n');
  const conn = await pool.getConnection();

  try {
    // Récupérer les cas cancer existants pour y attacher les nouveaux prélèvements
    const [cases] = await conn.execute(`
      SELECT cc.id AS case_id, p.nom, p.prenom
      FROM cancer_cases cc
      JOIN patients p ON cc.patient_id = p.id
      LIMIT 8
    `);

    if (cases.length === 0) {
      console.error('❌ Aucun dossier cancer trouvé. Lancez seed-real-data.js d\'abord.');
      return;
    }

    const adminId = (await conn.execute("SELECT id FROM users WHERE role='admin' LIMIT 1"))[0][0].id;

    const prelevements = [
      {
        type_prelevement: 'Biopsie',
        type_histologique: 'Carcinome épidermoïde',
        her2: 'Non testé', er: 'Non testé', pr: 'Non testé',
        grade_sbr: 'G2', ki67: '30%',
        pathologiste: 'Dr. Amrani Rachid - CHU Alger',
        compte_rendu: 'Carcinome épidermoïde bien différencié. Marges saines. Aucun envahissement vasculaire.',
        date_prelevement: '2025-01-15',
        pd_l1: 'TPS 20%', mmr_msi: 'pMMR',
      },
      {
        type_prelevement: 'Pièce opératoire',
        type_histologique: 'Adénocarcinome mucineux',
        her2: 'Négatif', er: 'Positif', pr: 'Négatif',
        grade_sbr: 'SBR III', ki67: '55%',
        pathologiste: 'Dr. Boudiaf Karima - CHU Oran',
        compte_rendu: 'Pièce de mastectomie totale. Adénocarcinome mucineux pur. Récepteurs ER positifs (60%). HER2 négatif.',
        date_prelevement: '2025-02-08',
        pd_l1: 'Non exprimé', mmr_msi: 'MSS',
      },
      {
        type_prelevement: 'Cytoponction',
        type_histologique: 'Lymphome B diffus à grandes cellules',
        her2: 'Non testé', er: 'Non testé', pr: 'Non testé',
        grade_sbr: 'G3', ki67: '80%',
        pathologiste: 'Dr. Kaci Lyes - CHU Tizi-Ouzou',
        compte_rendu: 'LBDGC type GCB selon Hans. MYC réarrangé. BCL2 surexprimé. Index prolifératif très élevé (Ki-67 80%).',
        date_prelevement: '2025-02-20',
        pd_l1: 'CPS 5', mmr_msi: 'Non testé',
      },
      {
        type_prelevement: 'Biopsie à l\'aiguille',
        type_histologique: 'Hépatocarcinome',
        her2: 'Non testé', er: 'Non testé', pr: 'Non testé',
        grade_sbr: 'G2', ki67: '40%',
        pathologiste: 'Dr. Mansouri Said - CHU Constantine',
        compte_rendu: 'Carcinome hépatocellulaire bien différencié sur cirrhose. Absence de nécrose tumorale. AFP corrélée élevée.',
        date_prelevement: '2025-03-05',
        pd_l1: 'Non testé', mmr_msi: 'Non testé',
      },
      {
        type_prelevement: 'Biopsie chirurgicale',
        type_histologique: 'Sarcome des parties molles',
        her2: 'Non testé', er: 'Non testé', pr: 'Non testé',
        grade_sbr: 'G3', ki67: '65%',
        pathologiste: 'Dr. Hadj-Ali Fatima - CHU Blida',
        compte_rendu: 'Liposarcome dédifférencié de haut grade. Marges chirurgicales envahies. Nécrose tumorale présente (35%).',
        date_prelevement: '2025-03-18',
        pd_l1: 'TPS 5%', mmr_msi: 'pMMR',
      },
      {
        type_prelevement: 'Biopsie endoscopique',
        type_histologique: 'Adénocarcinome gastrique',
        her2: 'Positif', er: 'Non testé', pr: 'Non testé',
        grade_sbr: 'G2', ki67: '45%',
        pathologiste: 'Dr. Zerrouki Nabil - CHU Annaba',
        compte_rendu: 'Adénocarcinome gastrique modérément différencié. HER2 surexprimé (IHC 3+). EBV-négatif. MSS. Invasion vasculaire présente.',
        date_prelevement: '2025-04-02',
        pd_l1: 'CPS 3', mmr_msi: 'MSS',
      },
      {
        type_prelevement: 'Biopsie',
        type_histologique: 'Mélanome malin',
        her2: 'Non testé', er: 'Non testé', pr: 'Non testé',
        grade_sbr: null, ki67: '70%',
        pathologiste: 'Dr. Benali Omar - CHU Sétif',
        compte_rendu: 'Mélanome nodulaire en phase verticale. Indice de Breslow : 4.2mm. Clark IV. Ulcération présente. BRAF V600E muté.',
        date_prelevement: '2025-04-20',
        pd_l1: 'TPS 35%', mmr_msi: 'Non testé',
      },
    ];

    let added = 0;
    for (let i = 0; i < prelevements.length; i++) {
      const p = prelevements[i];
      const caseId = cases[i % cases.length].case_id;
      const patient = cases[i % cases.length];

      await conn.execute(
        `INSERT INTO anapath (id, case_id, date_prelevement, type_prelevement, type_histologique, 
         her2, er, pr, grade_sbr, ki67, pathologiste, compte_rendu, pd_l1, mmr_msi, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(), caseId, p.date_prelevement, p.type_prelevement, p.type_histologique,
          p.her2, p.er, p.pr, p.grade_sbr, p.ki67, p.pathologiste, p.compte_rendu,
          p.pd_l1, p.mmr_msi, adminId
        ]
      );

      console.log(`  ✅ [${p.type_prelevement}] ${p.type_histologique} — Patient: ${patient.prenom} ${patient.nom}`);
      added++;
    }

    console.log(`\n✅ ${added} prélèvements de test ajoutés avec succès !`);
    console.log('\n📋 Types disponibles pour les filtres :');
    console.log('  • Biopsie (x2)');
    console.log('  • Pièce opératoire (x1)');
    console.log('  • Cytoponction (x1)');
    console.log('  • Biopsie à l\'aiguille (x1)');
    console.log('  • Biopsie chirurgicale (x1)');
    console.log('  • Biopsie endoscopique (x1)');

  } catch (err) {
    console.error('❌ Erreur:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

seedPrelevements();
