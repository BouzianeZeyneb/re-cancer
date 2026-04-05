const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { createNotification } = require('./notificationsController');

const generateInviteCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

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

    const [participants] = await pool.execute(`
      SELECT rp.*, u.nom, u.prenom, u.role
      FROM rcp_participants rp
      JOIN users u ON rp.user_id = u.id
      WHERE rp.rcp_id = ?
    `, [id]);

    res.json({ ...rcp[0], dossiers, participants });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createRCP = async (req, res) => {
  try {
    const id = uuidv4();
    const invite_code = generateInviteCode();
    const { titre, date_reunion, statut, notes_globales, invitedMedecins } = req.body;
    
    await pool.execute(
      'INSERT INTO reunions_rcp (id, titre, date_reunion, statut, notes_globales, invite_code, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, titre, date_reunion, statut || 'Planifiée', notes_globales || null, invite_code, req.user.id]
    );

    // Get io from app for real-time notifications
    const io = req.app.get('io');
    
    // Add creator to participants automatically
    const creatorPartId = uuidv4();
    await pool.execute('INSERT INTO rcp_participants (id, rcp_id, user_id) VALUES (?, ?, ?)', [creatorPartId, id, req.user.id]);

    // Handle invitedMedecins array
    if (invitedMedecins && Array.isArray(invitedMedecins)) {
      for (const medecinId of invitedMedecins) {
        if (medecinId === req.user.id) continue;
        
        const partId = uuidv4();
        await pool.execute('INSERT INTO rcp_participants (id, rcp_id, user_id) VALUES (?, ?, ?)', [partId, id, medecinId]);
        
        // Create Notification
        const notifTitle = "Invitation à une RCP";
        const notifMsg = `Vous avez été invité à rejoindre la RCP : ${titre}`;
        const notifLien = `/rcp/${id}`;
        await createNotification(medecinId, notifTitle, notifMsg, notifLien, io);
      }
    }

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

const updateRCPDecisionFinale = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision_finale, statut } = req.body;
    await pool.execute(
      'UPDATE reunions_rcp SET decision_finale = ?, statut = ? WHERE id = ?',
      [decision_finale, statut || 'Terminée', id]
    );
    res.json({ message: 'Décision finale enregistrée et réunion clôturée' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getRCPMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const [messages] = await pool.execute(`
      SELECT m.*, u.nom, u.prenom, u.role
      FROM rcp_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.rcp_id = ?
      ORDER BY m.created_at ASC
    `, [id]);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const saveRCPMessage = async (req, res) => {
  try {
    const id = uuidv4();
    const { id: rcp_id } = req.params;
    const { content } = req.body;
    
    await pool.execute(
      'INSERT INTO rcp_messages (id, rcp_id, sender_id, content) VALUES (?, ?, ?, ?)',
      [id, rcp_id, req.user.id, content]
    );

    const [msg] = await pool.execute(`
      SELECT m.*, u.nom, u.prenom, u.role
      FROM rcp_messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `, [id]);

    // Emit real-time message to room
    const io = req.app.get('io');
    if (io) {
      io.to(`rcp_${rcp_id}`).emit('new_rcp_message', msg[0]);
    }

    res.status(201).json(msg[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinRCPByCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code requis' });

    const [rcps] = await pool.execute('SELECT id, titre FROM reunions_rcp WHERE invite_code = ?', [code.toUpperCase()]);
    if (rcps.length === 0) return res.status(404).json({ message: 'Code invalide ou RCP introuvable' });

    const rcp_id = rcps[0].id;

    // Check if already a participant
    const [existing] = await pool.execute('SELECT id FROM rcp_participants WHERE rcp_id = ? AND user_id = ?', [rcp_id, req.user.id]);
    if (existing.length > 0) return res.status(400).json({ message: 'Vous êtes déjà participant à cette RCP' });

    const partId = uuidv4();
    await pool.execute('INSERT INTO rcp_participants (id, rcp_id, user_id) VALUES (?, ?, ?)', [partId, rcp_id, req.user.id]);

    res.json({ message: 'Vous avez rejoint la RCP avec succès', rcp_id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const inviteDoctorToRCP = async (req, res) => {
  try {
    const { id: rcp_id } = req.params;
    const { medecinId } = req.body;

    const [rcps] = await pool.execute('SELECT titre FROM reunions_rcp WHERE id = ?', [rcp_id]);
    if (rcps.length === 0) return res.status(404).json({ message: 'RCP introuvable' });

    // Check if already a participant
    const [existing] = await pool.execute('SELECT id FROM rcp_participants WHERE rcp_id = ? AND user_id = ?', [rcp_id, medecinId]);
    if (existing.length > 0) return res.status(400).json({ message: 'Médecin déjà invité ou participant' });

    const partId = uuidv4();
    await pool.execute('INSERT INTO rcp_participants (id, rcp_id, user_id) VALUES (?, ?, ?)', [partId, rcp_id, medecinId]);

    // Send notification
    const io = req.app.get('io');
    const notifTitle = "Nouvelle invitation à une RCP";
    const notifMsg = `Vous avez été invité à la RCP : ${rcps[0].titre}`;
    const notifLien = `/rcp/${rcp_id}`;
    await createNotification(medecinId, notifTitle, notifMsg, notifLien, io);

    res.status(201).json({ message: 'Médecin invité' });
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
  removeCaseFromRCP,
  updateRCPDecisionFinale,
  getRCPMessages,
  saveRCPMessage,
  joinRCPByCode,
  inviteDoctorToRCP
};
