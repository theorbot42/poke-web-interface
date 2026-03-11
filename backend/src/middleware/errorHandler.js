const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide dans le corps de la requête' });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Conflit: la ressource existe déjà' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Référence invalide' });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational ? err.message : 'Erreur interne du serveur';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;
