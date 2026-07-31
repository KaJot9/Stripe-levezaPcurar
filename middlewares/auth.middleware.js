/**
 * middlewares/auth.middleware.js
 * Protege rotas do painel administrativo, exigindo sessão autenticada.
 */

function exigirLogin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }

  // Requisições de API (fetch/JSON) recebem 401; navegação recebe redirect.
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Não autenticado.' });
  }
  return res.redirect('/admin/login');
}

module.exports = { exigirLogin };
