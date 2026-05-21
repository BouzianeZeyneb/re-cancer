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
