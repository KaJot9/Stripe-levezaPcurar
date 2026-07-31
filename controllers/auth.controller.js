/**
 * controllers/auth.controller.js
 * Login/logout simples do painel administrativo, baseado em sessão.
 * O admin é único e configurado via variáveis de ambiente (ADMIN_EMAIL,
 * ADMIN_PASSWORD_HASH), evitando a necessidade de uma tabela de usuários
 * para este escopo inicial.
 */

const bcrypt = require('bcryptjs');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

const paginaLogin = (req, res) => {
  res.render('admin/login', { erro: null });
};

const processarLogin = asyncHandler(async (req, res) => {
  const { email, senha } = req.body;

  const emailValido = email === env.admin.email;
  const senhaValida = emailValido && bcrypt.compareSync(senha || '', env.admin.passwordHash);

  if (!emailValido || !senhaValida) {
    return res.status(401).render('admin/login', { erro: 'E-mail ou senha inválidos.' });
  }

  req.session.isAdmin = true;
  req.session.adminEmail = email;
  res.redirect('/admin/dashboard');
});

const logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
};

module.exports = { paginaLogin, processarLogin, logout };
