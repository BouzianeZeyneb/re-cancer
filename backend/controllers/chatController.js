const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');

const initChatTables = async () => {
  const conn = await pool.getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(36) PRIMARY KEY,
        user1_id VARCHAR(36) NOT NULL,
        user2_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL,
        sender_id VARCHAR(36) NOT NULL,
        type ENUM('text','audio') DEFAULT 'text',
        content TEXT,
        audio_data LONGTEXT,
        lu BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  } finally {
    conn.release();
  }
};

const getConversations = async (req, res) => {
  try {
    const [convs] = await pool.execute(`
      SELECT c.*,
        u1.nom as user1_nom, u1.prenom as user1_prenom, u1.role as user1_role,
        u2.nom as user2_nom, u2.prenom as user2_prenom, u2.role as user2_role,
        (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
        (SELECT type FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_type,
        (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND lu = false) as unread_count
      FROM conversations c
      JOIN users u1 ON c.user1_id = u1.id
      JOIN users u2 ON c.user2_id = u2.id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY last_message_time DESC
    `, [req.user.id, req.user.id, req.user.id]);
    res.json(convs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrCreateConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const myId = req.user.id;

    const [existing] = await pool.execute(`
      SELECT * FROM conversations 
      WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
    `, [myId, userId, userId, myId]);

    if (existing.length) {
      return res.json(existing[0]);
    }

    const id = uuidv4();
    await pool.execute('INSERT INTO conversations (id, user1_id, user2_id) VALUES (?,?,?)', [id, myId, userId]);
    const [conv] = await pool.execute('SELECT * FROM conversations WHERE id = ?', [id]);
    res.status(201).json(conv[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { convId } = req.params;
    const [messages] = await pool.execute(`
      SELECT m.*, u.nom, u.prenom, u.role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [convId]);

    // Mark as read
    await pool.execute('UPDATE messages SET lu = true WHERE conversation_id = ? AND sender_id != ?', [convId, req.user.id]);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const id = uuidv4();
    const { conversation_id, content, type, audio_data } = req.body;
    await pool.execute(
      'INSERT INTO messages (id, conversation_id, sender_id, type, content, audio_data) VALUES (?,?,?,?,?,?)',
      [id, conversation_id, req.user.id, type || 'text', content || null, audio_data || null]
    );
    const [msg] = await pool.execute(`
      SELECT m.*, u.nom, u.prenom FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?
    `, [id]);
    res.status(201).json(msg[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, nom, prenom, role, email FROM users WHERE id != ? AND actif = true ORDER BY nom',
      [req.user.id]
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { initChatTables, getConversations, getOrCreateConversation, getMessages, sendMessage, getUsers };
