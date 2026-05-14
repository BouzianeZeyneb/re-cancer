const { pool } = require('./config/database');
const { v4: uuidv4 } = require('uuid');

async function seedAmine() {
  const patientId = '01ed944c-6dc5-4dc8-9ba2-0b1b064047f6';
  
  try {
    console.log('--- Seeding Data for Amine Belkacem ---');
    
    // 1. Update existing Cancer Case
    const [cases] = await pool.execute('SELECT id FROM cancer_cases WHERE patient_id = ?', [patientId]);
    let caseId;
    
    if (cases.length > 0) {
      caseId = cases[0].id;
      await pool.execute(`
        UPDATE cancer_cases SET 
          topographie_icdo3 = 'C61.9',
          morphologie_icdo3 = 'M8140/3',
          tnm_t = 'T3a',
          tnm_n = 'N0',
          tnm_m = 'M0',
          stade = 'Stade III',
          type_cancer = 'Solide',
          sous_type = 'Adénocarcinome de la prostate',
          statut_patient = 'En traitement'
        WHERE id = ?
      `, [caseId]);
      console.log('✅ Cancer case updated.');
    } else {
      caseId = uuidv4();
      await pool.execute(`
        INSERT INTO cancer_cases (id, patient_id, type_cancer, sous_type, stade, topographie_icdo3, morphologie_icdo3, tnm_t, tnm_n, tnm_m, date_diagnostic, statut_patient)
        VALUES (?, ?, 'Solide', 'Adénocarcinome de la prostate', 'Stade III', 'C61.9', 'M8140/3', 'T3a', 'N0', 'M0', '2024-01-15', 'En traitement')
      `, [caseId, patientId]);
      console.log('✅ New cancer case created.');
    }

    // 2. Clear old data to avoid duplicates for this patient
    await pool.execute('DELETE FROM consultations WHERE case_id = ?', [caseId]);
    await pool.execute('DELETE FROM biologie WHERE patient_id = ?', [patientId]);
    await pool.execute('DELETE FROM traitements WHERE case_id = ?', [caseId]);

    // 3. Seed Consultations
    const consults = [
      { id: uuidv4(), date: '2024-02-10', motif: 'Suivi post-biopsie', obs: 'Patient stable, PSA élevé initial à 12.5. Discussion protocole.', plan: 'Initier hormonothérapie.' },
      { id: uuidv4(), date: '2024-04-05', motif: 'Contrôle T2', obs: 'Bonne tolérance clinique. Diminution des douleurs pelviennes.', plan: 'Poursuivre Hormono + Débuter Radio.' }
    ];
    for (const c of consults) {
      await pool.execute('INSERT INTO consultations (id, case_id, date_consultation, motif, examen_clinique, decision_medicale) VALUES (?, ?, ?, ?, ?, ?)', 
        [c.id, caseId, c.date, c.motif, c.obs, c.plan]);
    }
    console.log('✅ Consultations seeded.');

    // 4. Seed Biologie (PSA)
    const bio = [
      { id: uuidv4(), date: '2024-01-10', type: 'Marqueurs tumoraux', param: 'PSA Total', val: '12.5', unit: 'ng/mL', norm: '0-4', inter: 'Haut' },
      { id: uuidv4(), date: '2024-03-15', type: 'Marqueurs tumoraux', param: 'PSA Total', val: '7.8', unit: 'ng/mL', norm: '0-4', inter: 'Haut' },
      { id: uuidv4(), date: '2024-04-08', type: 'Marqueurs tumoraux', param: 'PSA Total', val: '4.2', unit: 'ng/mL', norm: '0-4', inter: 'Normal' }
    ];
    for (const b of bio) {
      await pool.execute('INSERT INTO biologie (id, patient_id, case_id, date_examen, type_examen, parametre, valeur, unite, valeur_normale, interpretation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [b.id, patientId, caseId, b.date, b.type, b.param, b.val, b.unit, b.norm, b.inter]);
    }
    console.log('✅ Biology results seeded.');

    // 5. Seed Traitements
    const treatId = uuidv4();
    await pool.execute(`
      INSERT INTO traitements (id, case_id, type_traitement, protocole, intention_therapeutique, date_debut, ligne_traitement, status) 
      VALUES (?, ?, 'Hormonothérapie', 'Enzalutamide 160mg', 'Curatif', '2024-02-15', 1, 'En cours')
    `, [treatId, caseId]);
    console.log('✅ Treatments seeded.');

    console.log('--- Seeding Completed successfully ---');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seedAmine();
