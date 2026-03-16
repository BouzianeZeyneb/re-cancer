const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cancer_registry_secret_2024');
    const [users] = await pool.execute('SELECT id, nom, prenom, email, role, actif FROM users WHERE id = ?', [decoded.id]);
    
    if (!users.length || !users[0].actif) {
      return res.status(401).json({ message: 'Utilisateur inactif ou non trouvé' });
    }

    req.user = users[0];
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalide' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  next();
};

const auditLog = async (userId, action, tableName, recordId, details, ip) => {
  const { v4: uuidv4 } = require('uuid');
  try {
    await pool.execute(
      'INSERT INTO audit_logs (id, user_id, action, table_name, record_id, details, ip_address) VALUES (?,?,?,?,?,?,?)',
      [uuidv4(), userId, action, tableName, recordId, JSON.stringify(details), ip]
    );
  } catch (e) { console.error('Audit log error:', e); }
};

module.exports = { authMiddleware, requireRole, auditLog };
