const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

// GET /anapath/:anapathId/compte-rendu
const getByAnapath = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT cr.*, 
              u_created.nom AS created_by_nom, u_created.prenom AS created_by_prenom,
              u_validated.nom AS validated_by_nom, u_validated.prenom AS validated_by_prenom,
              p.nom AS patient_nom, p.prenom AS patient_prenom, p.matricule,
              a.date_prelevement, a.type_prelevement, a.type_histologique, a.pathologiste,
              cc.localisation, cc.sous_type, cc.type_cancer
       FROM comptes_rendus_anapath cr
       JOIN anapath a ON cr.anapath_id = a.id
       JOIN cancer_cases cc ON cr.case_id = cc.id
       JOIN patients p ON cr.patient_id = p.id
       LEFT JOIN users u_created ON cr.created_by = u_created.id
       LEFT JOIN users u_validated ON cr.validated_by = u_validated.id
       WHERE cr.anapath_id = ?`,
      [req.params.anapathId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Aucun compte rendu trouvé pour ce prélèvement' });
    }
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// GET /anapath/:anapathId/info — get prélèvement info for the form header
const getPrelevementInfo = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT a.id AS anapath_id, a.date_prelevement, a.type_prelevement,
              a.type_histologique, a.pathologiste, a.compte_rendu AS ancien_compte_rendu,
              a.her2, a.er, a.pr, a.grade_sbr, a.ki67, a.pd_l1, a.mmr_msi,
              cc.id AS case_id, cc.localisation, cc.sous_type, cc.type_cancer, cc.stade,
              p.id AS patient_id, p.nom, p.prenom, p.matricule, p.date_naissance, p.sexe
       FROM anapath a
       JOIN cancer_cases cc ON a.case_id = cc.id
       JOIN patients p ON cc.patient_id = p.id
       WHERE a.id = ?`,
      [req.params.anapathId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Prélèvement non trouvé' });
    }
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// POST /anapath/compte-rendu
const create = async (req, res) => {
  try {
    const id = uuidv4();
    const { anapath_id, patient_id, case_id, observation, diagnostic, conclusion, statut } = req.body;
    const n = v => (v === undefined || v === '' ? null : v);

    await pool.execute(
      `INSERT INTO comptes_rendus_anapath 
       (id, anapath_id, patient_id, case_id, observation, diagnostic, conclusion, statut, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, anapath_id, patient_id, case_id, n(observation), n(diagnostic), n(conclusion), statut || 'brouillon', req.user.id]
    );

    res.status(201).json({ id, message: 'Compte rendu créé' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /anapath/compte-rendu/:id
const update = async (req, res) => {
  try {
    const { observation, diagnostic, conclusion, statut } = req.body;
    const n = v => (v === undefined || v === '' ? null : v);

    await pool.execute(
      `UPDATE comptes_rendus_anapath 
       SET observation = ?, diagnostic = ?, conclusion = ?, statut = ?
       WHERE id = ?`,
      [n(observation), n(diagnostic), n(conclusion), statut || 'brouillon', req.params.id]
    );

    res.json({ message: 'Compte rendu mis à jour' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// PUT /anapath/compte-rendu/:id/valider — only anapath role
const valider = async (req, res) => {
  try {
    // Enforce anapath-only validation
    const role = req.user.role ? req.user.role.toLowerCase() : '';
    if (role !== 'anapath') {
      return res.status(403).json({ message: 'Seul le rôle ANAPATH peut valider un compte rendu.' });
    }

    const { observation, diagnostic, conclusion } = req.body;
    const n = v => (v === undefined || v === '' ? null : v);

    await pool.execute(
      `UPDATE comptes_rendus_anapath 
       SET observation = ?, diagnostic = ?, conclusion = ?,
           statut = 'validé', validated_at = NOW(), validated_by = ?
       WHERE id = ?`,
      [n(observation), n(diagnostic), n(conclusion), req.user.id, req.params.id]
    );

    res.json({ message: 'Compte rendu validé avec succès' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

module.exports = { getByAnapath, getPrelevementInfo, create, update, valider };
