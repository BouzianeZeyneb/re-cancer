const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { auditLog } = require('../middleware/auth');

const getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.execute('SELECT id, nom, prenom, email, role, actif, created_at FROM users ORDER BY nom');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const { nom, prenom, email, password, role, actif = true } = req.body;
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) return res.status(400).json({ message: 'Email déjà utilisé' });

    const id = uuidv4();
    const hashed = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (id, nom, prenom, email, password, role, actif) VALUES (?,?,?,?,?,?,?)',
      [id, nom, prenom, email, hashed, role, actif]
    );
    await auditLog(req.user.id, 'CREATE_USER', 'users', id, { email, role, actif }, req.ip);
    res.status(201).json({ message: 'Utilisateur créé avec succès', id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, role, actif } = req.body;
    await pool.execute(
      'UPDATE users SET nom=?, prenom=?, email=?, role=?, actif=? WHERE id=?',
      [nom, prenom, email, role, actif, id]
    );
    await auditLog(req.user.id, 'UPDATE_USER', 'users', id, req.body, req.ip);
    res.json({ message: 'Utilisateur modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return res.status(400).json({ message: 'Impossible de supprimer votre propre compte' });
    await pool.execute('UPDATE users SET actif = false WHERE id = ?', [id]);
    await auditLog(req.user.id, 'DELETE_USER', 'users', id, {}, req.ip);
    res.json({ message: 'Utilisateur désactivé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllUsers, createUser, updateUser, deleteUser };
