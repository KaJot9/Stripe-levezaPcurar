 const express = require('express');
const webhookController = require('../controllers/webhook.controller');

const router = express.Router();

// Atenção: o parsing "raw" deste corpo é feito no server.js, ANTES do
// express.json() global, pois o Stripe exige o corpo bruto para validar
// a assinatura do webhook (stripe-signature).
router.post('/stripe', webhookController.receberWebhook);

module.exports = router;
