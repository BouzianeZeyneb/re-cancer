const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

// 1. Create a new lab request (Medecin)
const createRequest = async (req, res) => {
  try {
    const id = uuidv4();
    const { case_id, labo_id, analyses_demandees } = req.body;
    
    if (!case_id || !labo_id || !analyses_demandees) {
      return res.status(400).json({ message: "Paramètres manquants" });
    }

    await pool.execute(
      `INSERT INTO lab_requests (id, case_id, medecin_id, labo_id, analyses_demandees, statut) VALUES (?, ?, ?, ?, ?, 'En attente')`,
      [id, case_id, req.user.id, labo_id, analyses_demandees]
    );

    res.status(201).json({ id, message: "Demande envoyée au laboratoire avec succès" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Get all requests for a specific case (for the Doctor view)
const getRequestsByCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const [requests] = await pool.execute(`
      SELECT lr.*, 
             u1.nom as labo_nom, u1.prenom as labo_prenom,
             u2.nom as medecin_nom, u2.prenom as medecin_prenom
      FROM lab_requests lr
      JOIN users u1 ON lr.labo_id = u1.id
      JOIN users u2 ON lr.medecin_id = u2.id
      WHERE lr.case_id = ?
      ORDER BY lr.created_at DESC
    `, [caseId]);

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get all pending and completed requests assigned to the logged-in Lab
const getRequestsForLabo = async (req, res) => {
  try {
    const laboId = req.user.id;
    const [requests] = await pool.execute(`
      SELECT lr.*, 
             c.type_cancer, c.stade,
             p.id as patient_id, p.nom as patient_nom, p.prenom as patient_prenom, p.date_naissance, p.sexe,
             u.nom as medecin_nom, u.prenom as medecin_prenom
      FROM lab_requests lr
      JOIN cancer_cases c ON lr.case_id = c.id
      JOIN patients p ON c.patient_id = p.id
      JOIN users u ON lr.medecin_id = u.id
      WHERE lr.labo_id = ?
      ORDER BY lr.created_at DESC
    `, [laboId]);

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Upload PDF Result (Lab)
const uploadPdf = async (req, res) => {
  try {
    const requestId = req.params.id;
    // req.file comes from multer
    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier PDF fourni" });
    }

    // PDF relative path to store in DB
    const pdfPath = `/uploads/lab_results/${req.file.filename}`;

    // Verify request belongs to this lab (security)
    const [exists] = await pool.execute('SELECT id, fichier_pdf FROM lab_requests WHERE id = ? AND labo_id = ?', [requestId, req.user.id]);
    if (exists.length === 0) {
      return res.status(403).json({ message: "Non autorisé ou demande introuvable" });
    }

    // If an old file existed, we might want to delete it to save space (optional, skipping for safety)

    await pool.execute(
      `UPDATE lab_requests SET fichier_pdf = ?, statut = 'Terminée' WHERE id = ?`,
      [pdfPath, requestId]
    );

    res.json({ message: "Résultat téléchargé avec succès", pdfUrl: pdfPath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest, getRequestsByCase, getRequestsForLabo, uploadPdf
};
