const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * GET /custom-fields
 * Optional query param: target_page
 */
exports.getAll = async (req, res) => {
  try {
    const { target_page } = req.query;
    const sql = target_page ?
      'SELECT * FROM custom_fields WHERE target_page = ?' :
      'SELECT * FROM custom_fields';
    const params = target_page ? [target_page] : [];
    const [rows] = await pool.execute(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching custom fields:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * POST /custom-fields
 * Body: { target_page, position, field_name, field_type, required, options }
 */
exports.create = async (req, res) => {
  try {
    const { target_page, position, field_name, field_type, required = false, options = null } = req.body;
    const id = uuidv4();
    await pool.execute(
      `INSERT INTO custom_fields 
        (id, target_page, position, field_name, field_type, required, options, created_by) 
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, target_page, position, field_name, field_type, required, options, req.user.id]
    );
    res.status(201).json({ id });
  } catch (err) {
    console.error('Error creating custom field:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * PUT /custom-fields/:id
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, field_name, field_type, required, options } = req.body;
    await pool.execute(
      `UPDATE custom_fields SET position = ?, field_name = ?, field_type = ?, required = ?, options = ? WHERE id = ?`,
      [position, field_name, field_type, required, options, id]
    );
    res.json({ message: 'Champ mis à jour' });
  } catch (err) {
    console.error('Error updating custom field:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * DELETE /custom-fields/:id
 */
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM custom_fields WHERE id = ?', [id]);
    res.json({ message: 'Champ supprimé' });
  } catch (err) {
    console.error('Error deleting custom field:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * GET /custom-fields/:id/value/:recordId
 * Retrieve stored value for a specific custom field and record
 */
exports.getValues = async (req, res) => {
  try {
    const { id, recordId } = req.params;
    const [rows] = await pool.execute(
      `SELECT valeur FROM valeurs_dynamiques WHERE champ_id = ? AND record_id = ?`,
      [id, recordId]
    );
    res.json(rows.length ? rows[0] : { valeur: null });
  } catch (err) {
    console.error('Error fetching custom field value:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

/**
 * POST /custom-fields/:id/value
 * Save a value for a custom field (payload: { recordId, valeur })
 */
exports.saveValue = async (req, res) => {
  try {
    const { id } = req.params;
    const { recordId, valeur } = req.body;
    const uuid = uuidv4();
    await pool.execute(
      `INSERT INTO valeurs_dynamiques (id, champ_id, record_id, valeur, created_at) VALUES (?,?,?,?, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET valeur = EXCLUDED.valeur`,
      [uuid, id, recordId, valeur]
    );
    res.json({ message: 'Valeur enregistrée' });
  } catch (err) {
    console.error('Error saving custom field value:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};
