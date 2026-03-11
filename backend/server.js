require('dotenv').config();
const app = require('./src/app');
const http = require('http');
const { initializeSocket } = require('./src/websocket/socketHandler');
const { connectDatabase } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
initializeSocket(server);

async function startServer() {
  try {
    await connectDatabase();
    console.log('✅ Base de données connectée');
    await connectRedis();
    console.log('✅ Redis connecté');
    server.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📡 WebSocket disponible sur ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erreur de démarrage:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, fermeture du serveur...');
  server.close(() => {
    console.log('Serveur fermé');
    process.exit(0);
  });
});
