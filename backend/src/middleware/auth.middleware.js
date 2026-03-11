const { verifyToken } = require('../config/jwt');
const { get } = require('../config/redis');
const { query } = require('../config/database');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted in Redis
    const isBlacklisted = await get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token révoqué' });
    }

    const decoded = verifyToken(token);

    // Fetch user from DB to ensure they still exist
    const result = await query('SELECT id, username, email, role FROM users WHERE id = $1 AND is_active = true', [decoded.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé ou désactivé' });
    }

    req.user = result.rows[0];
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalide' });
    }
    next(error);
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès refusé: droits admin requis' });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware };
