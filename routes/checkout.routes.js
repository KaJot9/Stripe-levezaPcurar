const express = require('express');
const rateLimit = require('express-rate-limit');
const checkoutController = require('../controllers/checkout.controller');

const router = express.Router();

// Limita tentativas de criação de sessão para evitar abuso.
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false
});

router.get('/planos', checkoutController.listarPlanosPublicos);
router.post('/checkout/create-session', checkoutLimiter, checkoutController.criarSessao);

module.exports = router;
