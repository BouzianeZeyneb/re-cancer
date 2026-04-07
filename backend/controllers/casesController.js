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
    const { patient_id, type_cancer, sous_type, anomalies_genetiques, etat, stade, taille_cancer, rapport_anatomopathologique, medecin_traitant, medecin_inapte, numero_lecteur, date_diagnostic, decision_rcp, localisation, lateralite, code_cim10, type_histologique, grade_histologique, numero_bloc, tnm_t, tnm_n, tnm_m, recepteur_er, recepteur_pr, her2, nb_ganglions_envahis, sites_metastatiques, date_premiers_symptomes, etablissement_diagnostiqueur, medecin_diagnostiqueur, base_diagnostic } = req.body;
    const n = v => (v === undefined || v === '' ? null : v);
    await pool.execute(
      `INSERT INTO cancer_cases (
        id, patient_id, type_cancer, sous_type, anomalies_genetiques, etat, stade, taille_cancer, rapport_anatomopathologique, 
        medecin_traitant, medecin_inapte, numero_lecteur, date_diagnostic, decision_rcp, created_by,
        localisation, lateralite, code_cim10, type_histologique, grade_histologique, numero_bloc,
        tnm_t, tnm_n, tnm_m, recepteur_er, recepteur_pr, her2,
        nb_ganglions_envahis, sites_metastatiques, date_premiers_symptomes,
        etablissement_diagnostiqueur, medecin_diagnostiqueur, base_diagnostic
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, patient_id, type_cancer, n(sous_type), n(anomalies_genetiques), etat, n(stade), n(taille_cancer)||null, n(rapport_anatomopathologique),
        n(medecin_traitant)||null, n(medecin_inapte)||null, n(numero_lecteur), date_diagnostic, n(decision_rcp), req.user.id,
        n(localisation), n(lateralite), n(code_cim10), n(type_histologique), n(grade_histologique), n(numero_bloc),
        n(tnm_t), n(tnm_n), n(tnm_m), n(recepteur_er)||'Inconnu', n(recepteur_pr)||'Inconnu', n(her2)||'Inconnu',
        n(nb_ganglions_envahis), n(sites_metastatiques), n(date_premiers_symptomes),
        n(etablissement_diagnostiqueur), n(medecin_diagnostiqueur), n(base_diagnostic)
      ]
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
    const { type_cancer, sous_type, anomalies_genetiques, etat, stade, taille_cancer, rapport_anatomopathologique, medecin_traitant, numero_lecteur, date_diagnostic, statut_patient, date_deces, decision_rcp, localisation, lateralite, code_cim10, type_histologique, grade_histologique, numero_bloc, tnm_t, tnm_n, tnm_m, recepteur_er, recepteur_pr, her2, nb_ganglions_envahis, sites_metastatiques, date_premiers_symptomes, etablissement_diagnostiqueur, medecin_diagnostiqueur, base_diagnostic } = req.body;
    const n = v => (v === undefined || v === '' ? null : v);
    
    await pool.execute(
      `UPDATE cancer_cases SET 
        type_cancer=?, sous_type=?, anomalies_genetiques=?, etat=?, stade=?, taille_cancer=?, rapport_anatomopathologique=?, 
        medecin_traitant=?, numero_lecteur=?, date_diagnostic=?, statut_patient=?, date_deces=?, decision_rcp=?,
        localisation=?, lateralite=?, code_cim10=?, type_histologique=?, grade_histologique=?, numero_bloc=?,
        tnm_t=?, tnm_n=?, tnm_m=?, recepteur_er=?, recepteur_pr=?, her2=?,
        nb_ganglions_envahis=?, sites_metastatiques=?, date_premiers_symptomes=?,
        etablissement_diagnostiqueur=?, medecin_diagnostiqueur=?, base_diagnostic=?
      WHERE id=?`,
      [
        type_cancer, n(sous_type), n(anomalies_genetiques), etat, n(stade), n(taille_cancer)||null, n(rapport_anatomopathologique),
        n(medecin_traitant)||null, n(numero_lecteur), date_diagnostic, statut_patient, n(date_deces)||null, n(decision_rcp),
        n(localisation), n(lateralite), n(code_cim10), n(type_histologique), n(grade_histologique), n(numero_bloc),
        n(tnm_t), n(tnm_n), n(tnm_m), n(recepteur_er)||'Inconnu', n(recepteur_pr)||'Inconnu', n(her2)||'Inconnu',
        n(nb_ganglions_envahis), n(sites_metastatiques), n(date_premiers_symptomes),
        n(etablissement_diagnostiqueur), n(medecin_diagnostiqueur), n(base_diagnostic),
        id
      ]
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
    const { 
      case_id, type_traitement, date_debut, date_fin, description, resultat, statut,
      intention_therapeutique, ligne_traitement, voie_administration, jours_administration, cycles_realises,
      chirurgie_type, chirurgie_complications, chirurgie_compte_rendu,
      chimio_protocole, chimio_nombre_cycles, chimio_dose, chimio_date_fin_prevue,
      radio_dose_totale, radio_fractionnement, radio_nb_seances
    } = req.body;
    
    const n = v => (v === undefined || v === '' ? null : v);
    
    await pool.execute(
      `INSERT INTO traitements (
        id, case_id, type_traitement, date_debut, date_fin, description, resultat, statut,
        intention_therapeutique, ligne_traitement, voie_administration, jours_administration, cycles_realises,
        chirurgie_type, chirurgie_complications, chirurgie_compte_rendu,
        chimio_protocole, chimio_nombre_cycles, chimio_dose, chimio_date_fin_prevue,
        radio_dose_totale, radio_fractionnement, radio_nb_seances
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, case_id, type_traitement, n(date_debut), n(date_fin), n(description), n(resultat), n(statut)||'Planifié',
        n(intention_therapeutique), n(ligne_traitement), n(voie_administration), n(jours_administration), n(cycles_realises),
        n(chirurgie_type), n(chirurgie_complications), n(chirurgie_compte_rendu),
        n(chimio_protocole), n(chimio_nombre_cycles), n(chimio_dose), n(chimio_date_fin_prevue),
        n(radio_dose_totale), n(radio_fractionnement), n(radio_nb_seances)
      ]
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
