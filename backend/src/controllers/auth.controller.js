const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { set, get, del } = require('../config/redis');

const register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const existing = await query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email ou nom d'utilisateur déjà utilisé" });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role, created_at',
      [username, email, hashedPassword]
    );
    const user = result.rows[0];
    const token = generateToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });
    await set(`refresh:${user.id}`, refreshToken, 30 * 24 * 3600);
    res.status(201).json({ user, token, refreshToken });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT * FROM users WHERE email = $1 AND is_active = true', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);
    const token = generateToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id });
    await set(`refresh:${user.id}`, refreshToken, 30 * 24 * 3600);
    const { password_hash: _password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token, refreshToken });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token requis' });
    const decoded = verifyRefreshToken(refreshToken);
    const stored = await get(`refresh:${decoded.userId}`);
    if (!stored || stored !== refreshToken) {
      return res.status(401).json({ error: 'Refresh token invalide' });
    }
    const result = await query('SELECT id, username, email, role FROM users WHERE id = $1 AND is_active = true', [decoded.userId]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Utilisateur non trouvé' });
    const user = result.rows[0];
    const newToken = generateToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id });
    await set(`refresh:${user.id}`, newRefreshToken, 30 * 24 * 3600);
    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Refresh token expiré' });
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await set(`blacklist:${req.token}`, true, 7 * 24 * 3600);
    await del(`refresh:${req.user.id}`);
    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

const updateMe = async (req, res, next) => {
  try {
    const { username } = req.body;
    const result = await query(
      'UPDATE users SET username = COALESCE($1, username), updated_at = NOW() WHERE id = $2 RETURNING id, username, email, role',
      [username, req.user.id]
    );
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) return res.status(400).json({ error: 'Mot de passe actuel incorrect' });
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, req.user.id]);
    await del(`refresh:${req.user.id}`);
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, updateMe, changePassword };
