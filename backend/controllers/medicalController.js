const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { createNotification } = require('./notificationsController');

// ===== ANAPATH =====
const getAnapath = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM anapath WHERE case_id = ? ORDER BY date_prelevement DESC', [req.params.caseId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const createAnapath = async (req, res) => {
  try {
    const id = uuidv4();
    const n = v => (v === undefined || v === '' ? null : v);
    const { case_id, date_prelevement, type_prelevement, pathologiste, type_histologique, resultat_biopsie, her2, er, pr, grade_sbr, grade_tumoral, marges_chirurgicales, ki67, pd_l1, mmr_msi, autres_marqueurs, autres_marqueurs_custom, compte_rendu } = req.body;
    await pool.execute(
      `INSERT INTO anapath (id, case_id, date_prelevement, type_prelevement, pathologiste, type_histologique, resultat_biopsie, her2, er, pr, grade_sbr, grade_tumoral, marges_chirurgicales, ki67, pd_l1, mmr_msi, autres_marqueurs, autres_marqueurs_custom, compte_rendu, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, case_id, n(date_prelevement), n(type_prelevement), n(pathologiste), n(type_histologique), n(resultat_biopsie), her2||'Non testé', er||'Non testé', pr||'Non testé', n(grade_sbr), n(grade_tumoral), n(marges_chirurgicales), n(ki67), n(pd_l1), n(mmr_msi), n(autres_marqueurs), n(autres_marqueurs_custom), n(compte_rendu), req.user.id]
    );

    // Notifications pour le rôle ANAPATH
    try {
      const [anapaths] = await pool.execute('SELECT id FROM users WHERE role = "anapath"');
      const io = req.app.get('io');
      const msg = `Nouveau prélèvement (${type_prelevement || 'Non spécifié'}) ajouté pour analyse.`;
      for (const anapath of anapaths) {
        await createNotification(anapath.id, 'Nouveau Prélèvement ANAPATH', msg, `/anapath/prelevements`, io);
      }
    } catch(err) { console.error('Erreur notification anapath:', err); }

    res.status(201).json({ id, message: 'Anapath créé' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const updateAnapath = async (req, res) => {
  try {
    const { date_prelevement, type_histologique, resultat_biopsie, her2, er, pr, grade_sbr, ki67, autres_marqueurs, compte_rendu } = req.body;
    await pool.execute(
      `UPDATE anapath SET date_prelevement=?, type_histologique=?, resultat_biopsie=?, her2=?, er=?, pr=?, grade_sbr=?, ki67=?, autres_marqueurs=?, compte_rendu=? WHERE id=?`,
      [date_prelevement, type_histologique, resultat_biopsie, her2, er, pr, grade_sbr, ki67, autres_marqueurs, compte_rendu, req.params.id]
    );
    res.json({ message: 'Anapath modifié' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const deleteAnapath = async (req, res) => {
  try {
    await pool.execute('DELETE FROM anapath WHERE id = ?', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};

// ===== BIOLOGIE =====
const getBiologie = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM biologie WHERE case_id = ? ORDER BY date_examen DESC', [req.params.caseId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const getBiologieByPatient = async (req, res) => {
  try {
    // Combine both patient-level biology and case-level biology (if linked directly to case but belonging to this patient)
    // Or just patient_id. We'll select where patient_id = ? OR case_id IN (select id from cancer_cases where patient_id=?)
    const [rows] = await pool.execute(`
      SELECT b.* FROM biologie b 
      WHERE b.patient_id = ? OR b.case_id IN (SELECT id FROM cancer_cases WHERE patient_id = ?) 
      ORDER BY b.date_examen DESC
    `, [req.params.patientId, req.params.patientId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const createBiologie = async (req, res) => {
  try {
    const id = uuidv4();
    const n = v => (v === undefined || v === '' ? null : v);
    const { case_id, patient_id, date_examen, type_examen, parametre, valeur, unite, valeur_normale, interpretation, notes } = req.body;
    await pool.execute(
      `INSERT INTO biologie (id, case_id, patient_id, date_examen, type_examen, parametre, valeur, unite, valeur_normale, interpretation, notes, created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, n(case_id), n(patient_id), date_examen, type_examen, parametre, n(valeur), n(unite), n(valeur_normale), interpretation||'Normal', n(notes), req.user.id]
    );
    res.status(201).json({ id, message: 'Résultat ajouté' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const deleteBiologie = async (req, res) => {
  try {
    await pool.execute('DELETE FROM biologie WHERE id = ?', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};

// ===== IMAGERIE =====
const getImagerie = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM imagerie WHERE case_id = ? ORDER BY date_examen DESC', [req.params.caseId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const createImagerie = async (req, res) => {
  try {
    const id = uuidv4();
    const n = v => (v === undefined || v === '' ? null : v);
    const { case_id, date_examen, type_examen, region, resultat_resume, conclusion } = req.body;
    await pool.execute(
      `INSERT INTO imagerie (id, case_id, date_examen, type_examen, region, resultat_resume, conclusion, created_by) VALUES (?,?,?,?,?,?,?,?)`,
      [id, case_id, date_examen, type_examen, n(region), n(resultat_resume), n(conclusion), req.user.id]
    );
    res.status(201).json({ id, message: 'Imagerie ajoutée' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const deleteImagerie = async (req, res) => {
  try {
    await pool.execute('DELETE FROM imagerie WHERE id = ?', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};

// ===== CONSULTATIONS =====
const getConsultations = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT c.*, CONCAT(u.prenom, ' ', u.nom) as medecin_nom
      FROM consultations c
      LEFT JOIN users u ON c.medecin_id = u.id
      WHERE c.case_id = ? ORDER BY c.date_consultation DESC
    `, [req.params.caseId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const createConsultation = async (req, res) => {
  try {
    const id = uuidv4();
    const { case_id, date_consultation, poids, taille, tension_arterielle, temperature, symptomes, examen_clinique, decision_medicale, prochain_rdv } = req.body;
    const n = v => (v === undefined || v === '' ? null : v);
    await pool.execute(
      `INSERT INTO consultations (id, case_id, date_consultation, poids, taille, tension_arterielle, temperature, symptomes, examen_clinique, decision_medicale, prochain_rdv, medecin_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, case_id, date_consultation, n(poids), n(taille), n(tension_arterielle), n(temperature), n(symptomes), n(examen_clinique), n(decision_medicale), n(prochain_rdv), req.user.id]
    );
    res.status(201).json({ id, message: 'Consultation ajoutée' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const deleteConsultation = async (req, res) => {
  try {
    await pool.execute('DELETE FROM consultations WHERE id = ?', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};

// ===== EFFETS SECONDAIRES =====
const getEffetsSecondaires = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM effets_secondaires WHERE case_id = ? ORDER BY date_apparition DESC', [req.params.caseId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const createEffetSecondaire = async (req, res) => {
  try {
    const id = uuidv4();
    const n = v => (v === undefined || v === '' ? null : v);
    const { case_id, date_apparition, type_effet, grade, description, traitement_pris } = req.body;
    await pool.execute(
      `INSERT INTO effets_secondaires (id, case_id, date_apparition, type_effet, grade, description, traitement_pris) VALUES (?,?,?,?,?,?,?)`,
      [id, case_id, date_apparition, type_effet, grade||'Grade 1', n(description), n(traitement_pris)]
    );
    res.status(201).json({ id, message: 'Effet secondaire ajouté' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const resolveEffet = async (req, res) => {
  try {
    await pool.execute('UPDATE effets_secondaires SET resolu=true, date_resolution=? WHERE id=?', [req.body.date_resolution || new Date().toISOString().slice(0,10), req.params.id]);
    res.json({ message: 'Résolu' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};

const { reduceStockByTreatment } = require('./pharmacieController');

// ===== CHIMIO SEANCES =====
const getChimioSeances = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM chimio_seances WHERE case_id = ? ORDER BY date_seance DESC', [req.params.caseId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};
const createChimioSeance = async (req, res) => {
  try {
    const id = uuidv4();
    const n = v => (v === undefined || v === '' ? null : v);
    const { case_id, protocole, numero_cycle, date_seance, dose_administree, effets_observes, tolerance, notes, traitement_id } = req.body;
    await pool.execute(
      `INSERT INTO chimio_seances (id, case_id, protocole, numero_cycle, date_seance, dose_administree, effets_observes, tolerance, notes) VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, case_id, n(protocole), n(numero_cycle), date_seance, n(dose_administree), n(effets_observes), tolerance||'Bonne', n(notes)]
    );

    // Déclencher la décrémentation du stock si le traitement_id est fourni
    if (traitement_id) {
      await reduceStockByTreatment(traitement_id);
    } else {
      // Si pas de traitement_id, on essaie de deviner via le protocole
      // (Optionnel : on pourrait faire une recherche plus complexe)
    }

    res.status(201).json({ id, message: 'Séance ajoutée et stock mis à jour' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};

// ===== BIOLOGIE PATIENT STATS (for card list view) =====
const getBiologiePatientStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        p.id AS patient_id,
        (SELECT COUNT(*) FROM biologie WHERE patient_id = p.id) AS nb_analyses,
        (SELECT COUNT(*) FROM lab_requests WHERE patient_id = p.id) AS nb_demandes,
        (SELECT COUNT(*) FROM lab_requests WHERE patient_id = p.id AND statut = 'En attente') AS nb_en_attente,
        (SELECT MAX(date_examen) FROM biologie WHERE patient_id = p.id) AS derniere_analyse
      FROM patients p
    `);
    // Return as a map { patient_id: stats }
    const statsMap = {};
    rows.forEach(r => { statsMap[r.patient_id] = r; });
    res.json(statsMap);
  } catch(e) { res.status(500).json({ message: e.message }); }
};

const getAnapathByPatient = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT a.* FROM anapath a
      JOIN cancer_cases cc ON a.case_id = cc.id
      WHERE cc.patient_id = ? ORDER BY a.date_prelevement DESC
    `, [req.params.patientId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};

// ===== LISTE PRÉLÈVEMENTS POUR ANAPATH =====
const getPrelevementsList = async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const typeFilter = req.query.type_prelevement || null;
    const statutFilter = req.query.statut || null;
    const dateFilter = req.query.date || null;
    
    let query = `
      SELECT
        p.id           AS patient_id,
        p.matricule,
        p.nom,
        p.prenom,
        cc.id          AS case_id,
        cc.localisation,
        cc.sous_type,
        cc.type_cancer,
        a.id           AS anapath_id,
        a.date_prelevement,
        a.type_prelevement,
        a.type_histologique,
        a.compte_rendu,
        a.pathologiste,
        a.created_at   AS anapath_created_at,
        cr.id          AS cr_id,
        cr.statut      AS cr_statut,
        cr.validated_at AS cr_validated_at
      FROM anapath a
      JOIN cancer_cases cc ON a.case_id = cc.id
      JOIN patients p ON cc.patient_id = p.id
      LEFT JOIN comptes_rendus_anapath cr ON cr.anapath_id = a.id
      WHERE p.deleted = false
        AND (p.nom LIKE ? OR p.prenom LIKE ? OR p.matricule LIKE ?
             OR cc.type_cancer LIKE ? OR cc.sous_type LIKE ? OR a.type_histologique LIKE ?
             OR cc.localisation LIKE ? OR a.resultat_biopsie LIKE ? OR cr.diagnostic LIKE ?)
    `;
    const params = [search, search, search, search, search, search, search, search, search];

    if (typeFilter) {
      query += ' AND a.type_prelevement = ?';
      params.push(typeFilter);
    }

    if (statutFilter) {
      if (statutFilter === 'en_attente') {
        query += ' AND cr.statut IS NULL';
      } else {
        query += ' AND cr.statut = ?';
        params.push(statutFilter);
      }
    }

    if (dateFilter) {
      query += ' AND DATE(a.date_prelevement) = ?';
      params.push(dateFilter);
    }

    query += ' ORDER BY a.date_prelevement DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};

const getTraitementsByPatient = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT t.* FROM traitements t
      JOIN cancer_cases cc ON t.case_id = cc.id
      WHERE cc.patient_id = ? ORDER BY t.date_debut DESC
    `, [req.params.patientId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};

const getConsultationsByPatient = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT c.* FROM consultations c
      JOIN cancer_cases cc ON c.case_id = cc.id
      WHERE cc.patient_id = ? ORDER BY c.date_consultation DESC
    `, [req.params.patientId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};

const getImagerieByPatient = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT i.* FROM imagerie i
      JOIN cancer_cases cc ON i.case_id = cc.id
      WHERE cc.patient_id = ? ORDER BY i.date_examen DESC
    `, [req.params.patientId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};

const getEffetsByPatient = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT e.* FROM effets_secondaires e
      JOIN cancer_cases cc ON e.case_id = cc.id
      WHERE cc.patient_id = ? ORDER BY e.date_apparition DESC
    `, [req.params.patientId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};

// ===== DOCUMENTS =====
const getDocumentsByPatient = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM documents WHERE patient_id = ? ORDER BY date_doc DESC', [req.params.patientId]);
    res.json(rows);
  } catch(e) { res.status(500).json({ message: e.message }); }
};

const createDocument = async (req, res) => {
  try {
    const id = uuidv4();
    const { patient_id, titre, categorie, date_doc } = req.body;
    await pool.execute(
      'INSERT INTO documents (id, patient_id, titre, categorie, date_doc, created_by) VALUES (?,?,?,?,?,?)',
      [id, patient_id, titre, categorie, date_doc, req.user.id]
    );
    res.status(201).json({ id, message: 'Document ajouté' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};

// ===== LISTE COMPTES RENDUS ANAPATH (historique) =====
const getComptesRendusList = async (req, res) => {
  try {
    const search = req.query.search ? `%${req.query.search}%` : '%';
    const statutFilter = req.query.statut || null;

    let query = `
      SELECT
        cr.id           AS cr_id,
        cr.statut,
        cr.observation,
        cr.diagnostic,
        cr.conclusion,
        cr.created_at,
        cr.validated_at,
        cr.updated_at,
        p.nom, p.prenom, p.matricule,
        a.type_prelevement, a.date_prelevement,
        cc.localisation, cc.type_cancer,
        u_created.nom  AS created_by_nom,  u_created.prenom  AS created_by_prenom,
        u_valid.nom    AS validated_by_nom, u_valid.prenom    AS validated_by_prenom,
        a.id           AS anapath_id
      FROM comptes_rendus_anapath cr
      JOIN patients p   ON cr.patient_id  = p.id
      JOIN anapath  a   ON cr.anapath_id  = a.id
      JOIN cancer_cases cc ON cr.case_id  = cc.id
      LEFT JOIN users u_created   ON cr.created_by   = u_created.id
      LEFT JOIN users u_valid     ON cr.validated_by  = u_valid.id
      WHERE p.deleted = false
        AND (p.nom LIKE ? OR p.prenom LIKE ? OR p.matricule LIKE ? OR cr.diagnostic LIKE ?)
    `;
    const params = [search, search, search, search];

    if (statutFilter) {
      query += ' AND cr.statut = ?';
      params.push(statutFilter);
    }

    query += ' ORDER BY cr.updated_at DESC';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

// ===== ANAPATH DASHBOARD STATS =====
const getAnapathStats = async (req, res) => {
  try {
    const [[{ total_prelevements }]] = await pool.execute('SELECT COUNT(*) AS total_prelevements FROM anapath');
    const [[{ total_cr }]] = await pool.execute('SELECT COUNT(*) AS total_cr FROM comptes_rendus_anapath');
    const [[{ total_valides }]] = await pool.execute("SELECT COUNT(*) AS total_valides FROM comptes_rendus_anapath WHERE statut = 'validé'");
    const [[{ total_brouillons }]] = await pool.execute("SELECT COUNT(*) AS total_brouillons FROM comptes_rendus_anapath WHERE statut = 'brouillon'");

    // Prélèvements without any compte rendu = pending
    const [[{ en_attente }]] = await pool.execute(`
      SELECT COUNT(*) AS en_attente FROM anapath a
      LEFT JOIN comptes_rendus_anapath cr ON cr.anapath_id = a.id
      WHERE cr.id IS NULL
    `);

    // Last 5 recently validated
    const [recents] = await pool.execute(`
      SELECT cr.validated_at, p.nom, p.prenom, a.type_prelevement, cr.diagnostic
      FROM comptes_rendus_anapath cr
      JOIN patients p ON cr.patient_id = p.id
      JOIN anapath a ON cr.anapath_id = a.id
      WHERE cr.statut = 'validé'
      ORDER BY cr.validated_at DESC
      LIMIT 5
    `);

    res.json({
      total_prelevements: Number(total_prelevements),
      total_cr: Number(total_cr),
      total_valides: Number(total_valides),
      total_brouillons: Number(total_brouillons),
      en_attente: Number(en_attente),
      recents
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
};

module.exports = {
  getAnapath, createAnapath, updateAnapath, deleteAnapath,
  getBiologie, getBiologieByPatient, createBiologie, deleteBiologie,
  getImagerie, createImagerie, deleteImagerie,
  getConsultations, createConsultation, deleteConsultation,
  getEffetsSecondaires, createEffetSecondaire, resolveEffet,
  getChimioSeances, createChimioSeance,
  getBiologiePatientStats,
  // Documents
  getDocumentsByPatient, createDocument,
  // patient-specific medical loads
  getAnapathByPatient, getPrelevementsList, getTraitementsByPatient, getConsultationsByPatient, getImagerieByPatient, getEffetsByPatient,
  // Dashboard stats
  getAnapathStats,
  // Reports history
  getComptesRendusList
};
