const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { auditLog } = require('../middleware/auth');

const getAllPatients = async (req, res) => {
  try {
    const { search, sexe, wilaya, page = 1, limit = 20 } = req.query;
    let query = `
      SELECT p.*, 
        (SELECT COUNT(*) FROM cancer_cases WHERE patient_id = p.id) as nb_cancers,
        (SELECT statut_patient FROM cancer_cases WHERE patient_id = p.id ORDER BY created_at DESC LIMIT 1) as derniere_statut
      FROM patients p WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (p.nom LIKE ? OR p.prenom LIKE ? OR p.num_carte_nationale LIKE ? OR p.telephone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (sexe) { query += ' AND p.sexe = ?'; params.push(sexe); }
    if (wilaya) { query += ' AND p.wilaya LIKE ?'; params.push(`%${wilaya}%`); }

    const offset = (page - 1) * limit;
    const [countResult] = await pool.execute(query.replace('SELECT p.*,', 'SELECT COUNT(*) as total,').split('FROM patients')[0] + ' FROM patients p WHERE 1=1' + query.split('WHERE 1=1')[1], params);

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const [patients] = await pool.execute(query, params);
    res.json({ patients, total: patients.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;
    const [patients] = await pool.execute('SELECT * FROM patients WHERE id = ?', [id]);
    if (!patients.length) return res.status(404).json({ message: 'Patient non trouvé' });

    const [cases] = await pool.execute(`
      SELECT cc.*, u.nom as medecin_nom, u.prenom as medecin_prenom 
      FROM cancer_cases cc 
      LEFT JOIN users u ON cc.medecin_traitant = u.id 
      WHERE cc.patient_id = ? ORDER BY cc.date_diagnostic DESC
    `, [id]);

    const [rdv] = await pool.execute('SELECT * FROM rendez_vous WHERE patient_id = ? ORDER BY date_rdv DESC LIMIT 10', [id]);

    res.json({ ...patients[0], cancer_cases: cases, rendez_vous: rdv });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPatient = async (req, res) => {
  try {
    // Check duplicate by carte nationale
    if (req.body.num_carte_nationale) {
      const [existing] = await pool.execute('SELECT id, nom, prenom FROM patients WHERE num_carte_nationale = ?', [req.body.num_carte_nationale]);
      if (existing.length) {
        // Don't create — just redirect to comparison with existing patient
        // Create a temp patient WITHOUT carte nationale to avoid UNIQUE conflict
        const id = uuidv4();
        const { nom, prenom, date_naissance, sexe, telephone, num_carte_chifa, adresse, commune, wilaya, latitude, longitude, fumeur, alcool, activite_sportive, autres_medicaments, autres_facteurs_risque } = req.body;
        await pool.execute(
          `INSERT INTO patients (id, nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, latitude, longitude, fumeur, alcool, activite_sportive, autres_medicaments, autres_facteurs_risque, created_by) 
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [id, nom, prenom, date_naissance, sexe, telephone, null, num_carte_chifa, adresse, commune, wilaya, latitude||null, longitude||null, fumeur||false, alcool||false, activite_sportive||false, autres_medicaments, autres_facteurs_risque, req.user.id]
        );
        return res.status(409).json({ 
          id,
          similar: existing[0],
          code: 'SIMILAR_FOUND',
          message: 'Doublon détecté'
        });
      }
    }

    // Check potential duplicates by name — find any existing patient with same name
    const [nameDup] = await pool.execute(
      `SELECT id, nom, prenom, date_naissance, num_carte_nationale 
       FROM patients 
       WHERE LOWER(TRIM(nom)) = LOWER(TRIM(?)) AND LOWER(TRIM(prenom)) = LOWER(TRIM(?))
       LIMIT 1`,
      [req.body.nom, req.body.prenom]
    );
    if (nameDup.length) {
      // Create the patient first
      const id = uuidv4();
      const { nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, latitude, longitude, fumeur, alcool, activite_sportive, autres_medicaments, autres_facteurs_risque } = req.body;
      await pool.execute(
        `INSERT INTO patients (id, nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, latitude, longitude, fumeur, alcool, activite_sportive, autres_medicaments, autres_facteurs_risque, created_by) 
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [id, nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, latitude||null, longitude||null, fumeur||false, alcool||false, activite_sportive||false, autres_medicaments, autres_facteurs_risque, req.user.id]
      );
      // Return 409 so frontend catch handles redirect
      return res.status(409).json({ 
        id, 
        similar: nameDup[0],
        code: 'SIMILAR_FOUND',
        message: 'Doublon détecté'
      });
    }

    const id = uuidv4();
    const { nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, latitude, longitude, fumeur, alcool, activite_sportive, autres_medicaments, autres_facteurs_risque } = req.body;
    
    await pool.execute(
      `INSERT INTO patients (id, nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, latitude, longitude, fumeur, alcool, activite_sportive, autres_medicaments, autres_facteurs_risque, created_by) 
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, latitude || null, longitude || null, fumeur||false, alcool||false, activite_sportive||false, autres_medicaments, autres_facteurs_risque, req.user.id]
    );

    await auditLog(req.user.id, 'CREATE_PATIENT', 'patients', id, { nom, prenom }, req.ip);
    res.status(201).json({ message: 'Patient créé avec succès', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, fumeur, alcool, activite_sportive, autres_medicaments, autres_facteurs_risque } = req.body;
    
    await pool.execute(
      `UPDATE patients SET nom=?, prenom=?, date_naissance=?, sexe=?, telephone=?, num_carte_nationale=?, num_carte_chifa=?, adresse=?, commune=?, wilaya=?, fumeur=?, alcool=?, activite_sportive=?, autres_medicaments=?, autres_facteurs_risque=? WHERE id=?`,
      [nom, prenom, date_naissance, sexe, telephone, num_carte_nationale, num_carte_chifa, adresse, commune, wilaya, fumeur||false, alcool||false, activite_sportive||false, autres_medicaments, autres_facteurs_risque, id]
    );

    await auditLog(req.user.id, 'UPDATE_PATIENT', 'patients', id, req.body, req.ip);
    res.json({ message: 'Patient modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const [cases] = await pool.execute('SELECT id FROM cancer_cases WHERE patient_id = ?', [id]);
    if (cases.length > 0) {
      return res.status(400).json({ message: `Ce patient a ${cases.length} dossier(s) de cancer associé(s). Suppression impossible.` });
    }
    await pool.execute('DELETE FROM patients WHERE id = ?', [id]);
    await auditLog(req.user.id, 'DELETE_PATIENT', 'patients', id, {}, req.ip);
    res.json({ message: 'Patient supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const mergePatients = async (req, res) => {
  try {
    const { sourceId, targetId } = req.body;
    // Move all cases from source to target
    await pool.execute('UPDATE cancer_cases SET patient_id = ? WHERE patient_id = ?', [targetId, sourceId]);
    await pool.execute('UPDATE rendez_vous SET patient_id = ? WHERE patient_id = ?', [targetId, sourceId]);
    // Ignore duplicates if they already exist in target
    await pool.execute('UPDATE IGNORE styles_vie_valeurs SET patient_id = ? WHERE patient_id = ?', [targetId, sourceId]);
    // Delete remaining that were ignored
    await pool.execute('DELETE FROM styles_vie_valeurs WHERE patient_id = ?', [sourceId]);

    await pool.execute('DELETE FROM patients WHERE id = ?', [sourceId]);
    await auditLog(req.user.id, 'MERGE_PATIENTS', 'patients', targetId, { sourceId, targetId }, req.ip);
    res.json({ message: 'Patients fusionnés avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllPatients, getPatientById, createPatient, updatePatient, deletePatient, mergePatients };
