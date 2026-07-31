/**
 * controllers/checkout.controller.js
 * Endpoint público chamado pela landing page para iniciar o pagamento.
 */

const stripeService = require('../services/stripe.service');
const plansService = require('../services/plans.service');
const { isValidPriceId, isValidEmail } = require('../utils/validators');
const asyncHandler = require('../utils/asyncHandler');

/**
 * POST /api/checkout/create-session
 * body: { priceId: string, email?: string }
 */
const criarSessao = asyncHandler(async (req, res) => {
  const { priceId, email } = req.body;

  if (!isValidPriceId(priceId)) {
    return res.status(400).json({ error: 'priceId inválido.' });
  }
  if (email && !isValidEmail(email)) {
    return res.status(400).json({ error: 'E-mail inválido.' });
  }

  // Garante que o plano existe e está ativo antes de criar a sessão.
  const plano = await plansService.obterPlanoPorPriceId(priceId);
  if (!plano.ativo) {
    return res.status(400).json({ error: 'Este plano não está disponível no momento.' });
  }

  const session = await stripeService.criarCheckoutSession(priceId, email);
  res.json({ url: session.url, sessionId: session.id });
});

/**
 * GET /api/planos
 * Lista pública de planos ativos, usada pela landing page para
 * renderizar os botões de assinatura dinamicamente.
 */
const listarPlanosPublicos = asyncHandler(async (req, res) => {
  const planos = await plansService.listarPlanos({ onlyActive: true });
  const publicos = planos.map((p) => ({
    id: p.id,
    nome: p.nome,
    price_id: p.price_id,
    valor: p.valor
  }));
  res.json(publicos);
});

module.exports = { criarSessao, listarPlanosPublicos };
