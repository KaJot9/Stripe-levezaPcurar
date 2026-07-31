/**
 * middlewares/errorHandler.middleware.js
 * Middleware final de tratamento de erros. Garante respostas
 * consistentes e evita vazar detalhes internos em produção.
 */

const logger = require('../utils/logger');
const env = require('../config/env');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  logger.error(`${req.method} ${req.originalUrl} ->`, err.message);
  if (env.nodeEnv !== 'production') {
    logger.error(err.stack);
  }

  res.status(status).json({
    error: status === 500 ? 'Erro interno do servidor.' : err.message
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Rota não encontrada.' });
}

module.exports = { errorHandler, notFoundHandler };
