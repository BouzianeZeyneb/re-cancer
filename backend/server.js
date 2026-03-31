require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { initDatabase, initDynamicTables, initMedicalTables } = require('./config/database');
const { initChatTables } = require('./controllers/chatController');
const routes = require('./routes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors({ origin: '*', credentials: false }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api', routes);
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

const connectedUsers = {};

// Make io available in controllers
app.set('io', io);

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    connectedUsers[userId] = socket.id;
    socket.userId = userId;
    io.emit('users_online', Object.keys(connectedUsers));
  });

  socket.on('send_message', (data) => {
    const receiverSocket = connectedUsers[data.receiver_id];
    if (receiverSocket) io.to(receiverSocket).emit('new_message', data);
  });

  socket.on('typing', (data) => {
    const receiverSocket = connectedUsers[data.receiver_id];
    if (receiverSocket) io.to(receiverSocket).emit('user_typing', { sender_id: data.sender_id });
  });

  socket.on('stop_typing', (data) => {
    const receiverSocket = connectedUsers[data.receiver_id];
    if (receiverSocket) io.to(receiverSocket).emit('user_stop_typing', { sender_id: data.sender_id });
  });

  // User personal room for notifications
  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
  });

  // RCP Group Chat Room
  socket.on('join_rcp', (rcpId) => {
    socket.join(`rcp_${rcpId}`);
  });

  socket.on('typing_rcp', (data) => {
    socket.to(`rcp_${data.rcpId}`).emit('user_typing_rcp', { sender_id: data.sender_id, rcpId: data.rcpId });
  });

  socket.on('stop_typing_rcp', (data) => {
    socket.to(`rcp_${data.rcpId}`).emit('user_stop_typing_rcp', { sender_id: data.sender_id, rcpId: data.rcpId });
  });

  socket.on('disconnect', () => {
    if (socket.userId) {
      delete connectedUsers[socket.userId];
      io.emit('users_online', Object.keys(connectedUsers));
    }
  });
});

app.use((err, req, res, next) => {
  res.status(500).json({ message: 'Erreur serveur interne' });
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await initDatabase();
    await initDynamicTables();
    await initMedicalTables();
    await initChatTables();
    server.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📊 API disponible: http://localhost:${PORT}/api`);
      console.log(`💬 Socket.io actif`);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
};

start();
