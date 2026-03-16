const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const getAllRCP = async (req, res) => {
  try {
    const [rcps] = await pool.execute(`
      SELECT r.*, u.nom as createur_nom, u.prenom as createur_prenom,
        (SELECT COUNT(*) FROM rcp_cases WHERE rcp_id = r.id) as nb_dossiers
      FROM reunions_rcp r
      LEFT JOIN users u ON r.created_by = u.id
      ORDER BY r.date_reunion DESC
    `);
    res.json(rcps);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRCPById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rcp] = await pool.execute(`
      SELECT r.*, u.nom as createur_nom, u.prenom as createur_prenom
      FROM reunions_rcp r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `, [id]);
    
    if (!rcp.length) return res.status(404).json({ message: 'RCP non trouvée' });

    const [dossiers] = await pool.execute(`
      SELECT rc.*, cc.type_cancer, cc.stade, p.nom as patient_nom, p.prenom as patient_prenom,
        u.nom as medecin_nom, u.prenom as medecin_prenom
      FROM rcp_cases rc
      JOIN cancer_cases cc ON rc.case_id = cc.id
      JOIN patients p ON cc.patient_id = p.id
      LEFT JOIN users u ON rc.medecin_presentateur = u.id
      WHERE rc.rcp_id = ?
    `, [id]);

    res.json({ ...rcp[0], dossiers });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRCP = async (req, res) => {
  try {
    const id = uuidv4();
    const { titre, date_reunion, statut, notes_globales } = req.body;
    await pool.execute(
      'INSERT INTO reunions_rcp (id, titre, date_reunion, statut, notes_globales, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [id, titre, date_reunion, statut || 'Planifiée', notes_globales || null, req.user.id]
    );
    res.status(201).json({ message: 'RCP créée', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRCP = async (req, res) => {
  try {
    const { id } = req.params;
    const { titre, date_reunion, statut, notes_globales } = req.body;
    await pool.execute(
      'UPDATE reunions_rcp SET titre=?, date_reunion=?, statut=?, notes_globales=? WHERE id=?',
      [titre, date_reunion, statut, notes_globales, id]
    );
    res.json({ message: 'RCP mise à jour' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteRCP = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM reunions_rcp WHERE id = ?', [id]);
    res.json({ message: 'RCP supprimée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCaseToRCP = async (req, res) => {
  try {
    const { rcp_id } = req.params;
    const { case_id, medecin_presentateur, decision_retenue } = req.body;
    const id = uuidv4();
    
    await pool.execute(
      'INSERT INTO rcp_cases (id, rcp_id, case_id, medecin_presentateur, decision_retenue) VALUES (?, ?, ?, ?, ?)',
      [id, rcp_id, case_id, medecin_presentateur || req.user.id, decision_retenue || null]
    );
    res.status(201).json({ message: 'Dossier ajouté à la RCP', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRCPCaseDecision = async (req, res) => {
  try {
    const { rcp_id, case_rcp_id } = req.params;
    const { decision_retenue } = req.body;
    
    // Update decision in rcp_cases table
    await pool.execute(
      'UPDATE rcp_cases SET decision_retenue = ? WHERE id = ? AND rcp_id = ?',
      [decision_retenue, case_rcp_id, rcp_id]
    );

    // Also update the main cancer case decision if it's finalized
    const [rcpCase] = await pool.execute('SELECT case_id FROM rcp_cases WHERE id = ?', [case_rcp_id]);
    if (rcpCase.length) {
      await pool.execute('UPDATE cancer_cases SET decision_rcp = ? WHERE id = ?', [decision_retenue, rcpCase[0].case_id]);
    }

    res.json({ message: 'Décision enregistrée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeCaseFromRCP = async (req, res) => {
  try {
    const { rcp_id, case_rcp_id } = req.params;
    await pool.execute('DELETE FROM rcp_cases WHERE id = ? AND rcp_id = ?', [case_rcp_id, rcp_id]);
    res.json({ message: 'Dossier retiré de la RCP' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllRCP,
  getRCPById,
  createRCP,
  updateRCP,
  deleteRCP,
  addCaseToRCP,
  updateRCPCaseDecision,
  removeCaseFromRCP
};
