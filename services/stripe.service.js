/**
 * services/stripe.service.js
 * Toda interação direta com a API do Stripe fica isolada aqui.
 */

const stripe = require('../config/stripe');
const env = require('../config/env');

/**
 * Cria uma sessão do Stripe Checkout para assinatura recorrente.
 * @param {string} priceId - Price ID do Stripe (nunca o valor em dinheiro).
 * @param {string} [customerEmail] - E-mail pré-preenchido no checkout (opcional).
 */
async function criarCheckoutSession(priceId, customerEmail) {
  return stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: env.stripe.successUrl,
    cancel_url: env.stripe.cancelUrl,
    customer_email: customerEmail || undefined,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    metadata: {
      price_id: priceId
    }
  });
}

/**
 * Recupera uma sessão de checkout expandindo assinatura e cliente.
 */
async function obterCheckoutSession(sessionId) {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer', 'line_items']
  });
}

async function obterAssinatura(subscriptionId) {
  return stripe.subscriptions.retrieve(subscriptionId);
}

async function obterCliente(customerId) {
  return stripe.customers.retrieve(customerId);
}

/**
 * Valida a assinatura do webhook e retorna o evento já verificado.
 * ESSENCIAL para segurança: garante que a requisição veio realmente do Stripe.
 */
function construirEventoWebhook(rawBody, signature) {
  return stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
}

module.exports = {
  criarCheckoutSession,
  obterCheckoutSession,
  obterAssinatura,
  obterCliente,
  construirEventoWebhook
};
