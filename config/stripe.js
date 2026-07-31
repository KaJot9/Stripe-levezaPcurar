/**
 * config/stripe.js
 * Instância única do SDK do Stripe, usada em toda a aplicação.
 */

const Stripe = require('stripe');
const env = require('./env');

const stripe = new Stripe(env.stripe.secretKey, {
  apiVersion: '2024-06-20'
});

module.exports = stripe;
