const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { createNotification } = require('./notificationsController');

const getRequestsByCase = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT lr.*, u.nom as labo_nom, u.prenom as labo_prenom, m.nom as medecin_nom, m.prenom as medecin_prenom
      FROM lab_requests lr
      LEFT JOIN users u ON lr.labo_id = u.id
      LEFT JOIN users m ON lr.medecin_id = m.id
      WHERE lr.case_id = ?
      ORDER BY lr.created_at DESC
    `, [req.params.caseId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLabRequestsByPatient = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT lr.*, u.nom as labo_nom, u.prenom as labo_prenom, m.nom as medecin_nom, m.prenom as medecin_prenom
      FROM lab_requests lr
      LEFT JOIN users u ON lr.labo_id = u.id
      LEFT JOIN users m ON lr.medecin_id = m.id
      WHERE lr.patient_id = ? OR lr.case_id IN (SELECT id FROM cancer_cases WHERE patient_id = ?)
      ORDER BY lr.created_at DESC
    `, [req.params.patientId, req.params.patientId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRequestsForLabo = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT lr.*, p.nom as patient_nom, p.prenom as patient_prenom, m.nom as medecin_nom, m.prenom as medecin_prenom
      FROM lab_requests lr
      LEFT JOIN patients p ON lr.patient_id = p.id
      LEFT JOIN users m ON lr.medecin_id = m.id
      WHERE lr.labo_id = ?
      ORDER BY lr.created_at DESC
    `, [req.user.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRequest = async (req, res) => {
  try {
    const { patient_id, case_id, labo_id, analyses_demandees, notes_labo } = req.body;
    const medecin_id = req.user.id;
    const id = uuidv4();
    
    await pool.execute(
      'INSERT INTO lab_requests (id, patient_id, case_id, medecin_id, labo_id, analyses_demandees, notes_labo, statut) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, patient_id || null, case_id || null, medecin_id, labo_id, JSON.stringify(analyses_demandees), notes_labo || '', 'En attente']
    );

    // Notification to labo
    let patientNom = "Patient";
    if (patient_id) {
       const [pats] = await pool.execute('SELECT nom, prenom FROM patients WHERE id = ?', [patient_id]);
       if(pats.length > 0) patientNom = pats[0].nom + " " + pats[0].prenom;
    }
    
    await createNotification(
      labo_id, 
      "Nouvelle demande d'analyse", 
      `Une demande d'analyse a été envoyée pour le patient ${patientNom}`,
      "/laboratoire",
      req.app.get('io')
    );

    res.status(201).json({ id, message: 'Demande créée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const filePath = req.file ? '/uploads/' + req.file.filename : null;
    
    if (!filePath) {
      return res.status(400).json({ message: 'Fichier PDF requis' });
    }

    const [reqs] = await pool.execute('SELECT medecin_id, patient_id, case_id FROM lab_requests WHERE id = ?', [id]);
    if (reqs.length === 0) return res.status(404).json({ message: 'Demande non trouvée' });

    await pool.execute('UPDATE lab_requests SET statut = ?, fichier_pdf = ? WHERE id = ?', ['Terminée', filePath, id]);

    // Notification to medecin
    let patientNom = "Patient";
    const p_id = reqs[0].patient_id;
    if (p_id) {
       const [pats] = await pool.execute('SELECT id, nom, prenom FROM patients WHERE id = ?', [p_id]);
       if(pats.length > 0) patientNom = pats[0].nom + " " + pats[0].prenom;
    }

    await createNotification(
      reqs[0].medecin_id, 
      "Résultats d'analyse disponibles", 
      `Les résultats du laboratoire pour ${patientNom} sont prêts`,
      p_id ? `/patients/${p_id}` : (reqs[0].case_id ? `/cas-cancer/${reqs[0].case_id}` : '/'),
      req.app.get('io')
    );

    res.json({ message: 'Résultats envoyés' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRequestsByCase, getLabRequestsByPatient, getRequestsForLabo, createRequest, uploadPdf };
