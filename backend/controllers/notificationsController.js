const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const getMyNotifications = async (req, res) => {
  try {
    const [notifs] = await pool.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(notifs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('UPDATE notifications SET lu = true WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    await pool.execute('UPDATE notifications SET lu = true WHERE user_id = ? AND lu = false', [req.user.id]);
    res.json({ message: 'Toutes les notifications marquées comme lues' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createNotification = async (user_id, titre, message, lien, io) => {
  try {
    const id = uuidv4();
    await pool.execute(
      'INSERT INTO notifications (id, user_id, titre, message, lien) VALUES (?, ?, ?, ?, ?)',
      [id, user_id, titre, message, lien || null]
    );
    
    // Si WebSocket est disponible, émettre la notification en temps réel
    if (io) {
      // Find the socket ID of the user if they are connected
      // Usually you would broadcast to a specific room for that user
      io.to(`user_${user_id}`).emit('new_notification', {
        id, user_id, titre, message, lien, lu: 0, created_at: new Date()
      });
    }
  } catch (error) {
    console.error('Erreur creation notification:', error.message);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  createNotification
};
