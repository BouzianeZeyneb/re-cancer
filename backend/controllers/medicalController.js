const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

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
    const { case_id, protocole, numero_cycle, date_seance, dose_administree, effets_observes, tolerance, notes } = req.body;
    await pool.execute(
      `INSERT INTO chimio_seances (id, case_id, protocole, numero_cycle, date_seance, dose_administree, effets_observes, tolerance, notes) VALUES (?,?,?,?,?,?,?,?,?)`,
      [id, case_id, n(protocole), n(numero_cycle), date_seance, n(dose_administree), n(effets_observes), tolerance||'Bonne', n(notes)]
    );
    res.status(201).json({ id, message: 'Séance ajoutée' });
  } catch(e) { res.status(500).json({ message: e.message }); }
};

module.exports = {
  getAnapath, createAnapath, updateAnapath, deleteAnapath,
  getBiologie, getBiologieByPatient, createBiologie, deleteBiologie,
  getImagerie, createImagerie, deleteImagerie,
  getConsultations, createConsultation, deleteConsultation,
  getEffetsSecondaires, createEffetSecondaire, resolveEffet,
  getChimioSeances, createChimioSeance
};
