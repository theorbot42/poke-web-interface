const { query } = require('../config/database');
const { get, set } = require('../config/redis');
const pokeService = require('../services/poke.service');

const getSessions = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT cs.*, COUNT(m.id)::int as message_count,
        MAX(m.created_at) as last_message_at
       FROM chat_sessions cs
       LEFT JOIN messages m ON m.session_id = cs.id
       WHERE cs.user_id = $1
       GROUP BY cs.id
       ORDER BY cs.updated_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ sessions: result.rows });
  } catch (error) {
    next(error);
  }
};

const createSession = async (req, res, next) => {
  try {
    const { title } = req.body;
    const result = await query(
      'INSERT INTO chat_sessions (user_id, title) VALUES ($1, $2) RETURNING *',
      [req.user.id, title || 'Nouvelle conversation']
    );
    res.status(201).json({ session: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const getSession = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [req.params.sessionId, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session non trouvée' });
    res.json({ session: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const deleteSession = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM chat_sessions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.sessionId, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session non trouvée' });
    res.json({ message: 'Session supprimée' });
  } catch (error) {
    next(error);
  }
};

const updateSessionTitle = async (req, res, next) => {
  try {
    const { title } = req.body;
    const result = await query(
      'UPDATE chat_sessions SET title = $1, updated_at = NOW() WHERE id = $2 AND user_id = $3 RETURNING *',
      [title, req.params.sessionId, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Session non trouvée' });
    res.json({ session: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify session belongs to user
    const session = await query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [req.params.sessionId, req.user.id]
    );
    if (session.rows.length === 0) return res.status(404).json({ error: 'Session non trouvée' });

    const result = await query(
      'SELECT * FROM messages WHERE session_id = $1 ORDER BY created_at ASC LIMIT $2 OFFSET $3',
      [req.params.sessionId, limit, offset]
    );
    res.json({ messages: result.rows });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    const { sessionId } = req.params;

    const session = await query(
      'SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, req.user.id]
    );
    if (session.rows.length === 0) return res.status(404).json({ error: 'Session non trouvée' });

    // Save user message
    const userMsg = await query(
      'INSERT INTO messages (session_id, role, content) VALUES ($1, $2, $3) RETURNING *',
      [sessionId, 'user', content]
    );

    // Get recent context for Poke
    const context = await query(
      'SELECT role, content FROM messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT 20',
      [sessionId]
    );

    // Send to Poke MCP
    const pokeResponse = await pokeService.sendMessage(content, context.rows.reverse());

    // Save Poke response
    const assistantMsg = await query(
      'INSERT INTO messages (session_id, role, content, metadata) VALUES ($1, $2, $3, $4) RETURNING *',
      [sessionId, 'assistant', pokeResponse.content, JSON.stringify(pokeResponse.metadata || {})]
    );

    // Update session timestamp
    await query('UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1', [sessionId]);

    res.json({
      userMessage: userMsg.rows[0],
      assistantMessage: assistantMsg.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT m.*, cs.title as session_title
       FROM messages m
       JOIN chat_sessions cs ON cs.id = m.session_id
       WHERE cs.user_id = $1
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    res.json({ messages: result.rows });
  } catch (error) {
    next(error);
  }
};

const clearHistory = async (req, res, next) => {
  try {
    await query(
      'DELETE FROM messages WHERE session_id IN (SELECT id FROM chat_sessions WHERE user_id = $1)',
      [req.user.id]
    );
    res.json({ message: 'Historique effacé' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSessions, createSession, getSession, deleteSession, updateSessionTitle, getMessages, sendMessage, getHistory, clearHistory };
