const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { auditLog } = require('../middleware/auth');

const getCasesByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const [cases] = await pool.execute(`
      SELECT cc.*, u.nom as medecin_nom, u.prenom as medecin_prenom,
        (SELECT COUNT(*) FROM traitements WHERE case_id = cc.id) as nb_traitements
      FROM cancer_cases cc
      LEFT JOIN users u ON cc.medecin_traitant = u.id
      WHERE cc.patient_id = ? ORDER BY cc.date_diagnostic DESC
    `, [patientId]);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const [cases] = await pool.execute(`
      SELECT cc.*, u.nom as medecin_nom, u.prenom as medecin_prenom,
        p.nom as patient_nom, p.prenom as patient_prenom, p.date_naissance
      FROM cancer_cases cc
      LEFT JOIN users u ON cc.medecin_traitant = u.id
      LEFT JOIN patients p ON cc.patient_id = p.id
      WHERE cc.id = ?
    `, [id]);
    if (!cases.length) return res.status(404).json({ message: 'Cas non trouvé' });

    const [traitements] = await pool.execute('SELECT * FROM traitements WHERE case_id = ? ORDER BY date_debut DESC', [id]);
    const [rdv] = await pool.execute('SELECT * FROM rendez_vous WHERE case_id = ? ORDER BY date_rdv DESC', [id]);

    res.json({ ...cases[0], traitements, rendez_vous: rdv });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCase = async (req, res) => {
  try {
    const id = uuidv4();
    const { patient_id, type_cancer, sous_type, localisation, tnm_t, tnm_n, tnm_m, anomalies_genetiques, etat, stade, taille_cancer, rapport_anatomopathologique, medecin_traitant, medecin_inapte, numero_lecteur, date_diagnostic, decision_rcp } = req.body;
    const n = v => (v === undefined || v === '' ? null : v);
    await pool.execute(
      `INSERT INTO cancer_cases (id, patient_id, type_cancer, sous_type, localisation, tnm_t, tnm_n, tnm_m, anomalies_genetiques, etat, stade, taille_cancer, rapport_anatomopathologique, medecin_traitant, medecin_inapte, numero_lecteur, date_diagnostic, decision_rcp, created_by) 
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, patient_id, type_cancer, n(sous_type), n(localisation), n(tnm_t), n(tnm_n), n(tnm_m), n(anomalies_genetiques), etat, n(stade), n(taille_cancer)||null, n(rapport_anatomopathologique), n(medecin_traitant)||null, n(medecin_inapte)||null, n(numero_lecteur), date_diagnostic, n(decision_rcp), req.user.id]
    );
    await auditLog(req.user.id, 'CREATE_CASE', 'cancer_cases', id, { patient_id, type_cancer }, req.ip);
    res.status(201).json({ message: 'Cas de cancer enregistré', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { type_cancer, sous_type, anomalies_genetiques, etat, stade, taille_cancer, rapport_anatomopathologique, medecin_traitant, numero_lecteur, date_diagnostic, statut_patient, date_deces, decision_rcp } = req.body;
    
    await pool.execute(
      `UPDATE cancer_cases SET type_cancer=?, sous_type=?, anomalies_genetiques=?, etat=?, stade=?, taille_cancer=?, rapport_anatomopathologique=?, medecin_traitant=?, numero_lecteur=?, date_diagnostic=?, statut_patient=?, date_deces=?, decision_rcp=? WHERE id=?`,
      [type_cancer, sous_type, anomalies_genetiques, etat, stade, taille_cancer||null, rapport_anatomopathologique, medecin_traitant||null, numero_lecteur, date_diagnostic, statut_patient, date_deces||null, decision_rcp, id]
    );

    await auditLog(req.user.id, 'UPDATE_CASE', 'cancer_cases', id, req.body, req.ip);
    res.json({ message: 'Cas mis à jour avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addTraitement = async (req, res) => {
  try {
    const id = uuidv4();
    const { case_id, type_traitement, date_debut, date_fin, description, resultat } = req.body;
    await pool.execute(
      'INSERT INTO traitements (id, case_id, type_traitement, date_debut, date_fin, description, resultat) VALUES (?,?,?,?,?,?,?)',
      [id, case_id, type_traitement, date_debut||null, date_fin||null, description, resultat]
    );
    await auditLog(req.user.id, 'ADD_TRAITEMENT', 'traitements', id, { case_id, type_traitement }, req.ip);
    res.status(201).json({ message: 'Traitement ajouté', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addRendezVous = async (req, res) => {
  try {
    const id = uuidv4();
    const { case_id, patient_id, medecin_id, date_rdv, motif, notes } = req.body;
    await pool.execute(
      'INSERT INTO rendez_vous (id, case_id, patient_id, medecin_id, date_rdv, motif, notes) VALUES (?,?,?,?,?,?,?)',
      [id, case_id, patient_id, medecin_id||req.user.id, date_rdv, motif, notes]
    );
    res.status(201).json({ message: 'Rendez-vous planifié', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllCases = async (req, res) => {
  try {
    const { type_cancer, etat, statut, wilaya, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT cc.*, p.nom as patient_nom, p.prenom as patient_prenom, p.sexe, p.wilaya,
        TIMESTAMPDIFF(YEAR, p.date_naissance, CURDATE()) as age,
        u.nom as medecin_nom
      FROM cancer_cases cc
      JOIN patients p ON cc.patient_id = p.id
      LEFT JOIN users u ON cc.medecin_traitant = u.id
      WHERE 1=1
    `;
    const params = [];
    if (type_cancer) { query += ' AND cc.type_cancer = ?'; params.push(type_cancer); }
    if (etat) { query += ' AND cc.etat = ?'; params.push(etat); }
    if (statut) { query += ' AND cc.statut_patient = ?'; params.push(statut); }
    if (wilaya) { query += ' AND p.wilaya LIKE ?'; params.push(`%${wilaya}%`); }
    
    query += ' ORDER BY cc.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (page - 1) * parseInt(limit));
    
    const [cases] = await pool.execute(query, params);
    res.json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCasesByPatient, getCaseById, createCase, updateCase, addTraitement, addRendezVous, getAllCases };
