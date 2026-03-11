const { Server } = require('socket.io');
const { verifyToken } = require('../config/jwt');
const { query } = require('../config/database');
const { get, set } = require('../config/redis');
const pokeService = require('../services/poke.service');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) return next(new Error('Authentication required'));

      const isBlacklisted = await get(`blacklist:${token}`);
      if (isBlacklisted) return next(new Error('Token revoked'));

      const decoded = verifyToken(token);
      const result = await query(
        'SELECT id, username, email, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );
      if (result.rows.length === 0) return next(new Error('User not found'));

      socket.user = result.rows[0];
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`📲 Client connecté: ${socket.user.username} (${socket.id})`);

    socket.emit('connected', { userId: socket.user.id, username: socket.user.username });

    socket.on('join:session', async (sessionId) => {
      try {
        const session = await query(
          'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
          [sessionId, socket.user.id]
        );
        if (session.rows.length === 0) {
          socket.emit('error', { message: 'Session non trouvée' });
          return;
        }
        socket.join(`session:${sessionId}`);
        socket.emit('session:joined', { sessionId });
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors de la connexion à la session' });
      }
    });

    socket.on('leave:session', (sessionId) => {
      socket.leave(`session:${sessionId}`);
    });

    socket.on('chat:message', async (data) => {
      try {
        const { sessionId, content } = data;
        if (!sessionId || !content?.trim()) {
          socket.emit('error', { message: 'Données invalides' });
          return;
        }

        // Verify session
        const session = await query(
          'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
          [sessionId, socket.user.id]
        );
        if (session.rows.length === 0) {
          socket.emit('error', { message: 'Session non trouvée' });
          return;
        }

        // Save & echo user message
        const userMsg = await query(
          'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3) RETURNING *',
          [sessionId, 'user', content.trim()]
        );
        socket.emit('message:saved', userMsg.rows[0]);

        // Emit typing indicator
        socket.emit('poke:typing', { sessionId });

        // Get context
        const context = await query(
          'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20',
          [sessionId]
        );

        // Send to Poke
        const pokeResponse = await pokeService.sendMessage(content.trim(), context.rows.reverse());

        // Save response
        const assistantMsg = await query(
          'INSERT INTO messages (session_id, role, content, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
          [sessionId, 'assistant', pokeResponse.content, JSON.stringify(pokeResponse.metadata || {})]
        );

        await query('UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1', [sessionId]);

        socket.emit('poke:response', assistantMsg.rows[0]);
        socket.emit('poke:typing:stop', { sessionId });
      } catch (error) {
        console.error('Socket chat error:', error);
        socket.emit('poke:typing:stop', { sessionId: data?.sessionId });
        socket.emit('error', { message: 'Erreur lors de l’envoi du message' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client déconnecté: ${socket.user.username} (${reason})`);
    });
  });

  return io;
};

const getIO = () => io;

module.exports = { initializeSocket, getIO };
