/**
 * config/env.js
 * Carrega e valida as variáveis de ambiente necessárias para a aplicação.
 * Centralizar isso aqui evita "process.env.X" espalhado pelo código
 * e falha rápido (fail-fast) caso algo essencial esteja faltando.
 */

require('dotenv').config();

const REQUIRED_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SESSION_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD_HASH'
];

function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error('\n❌ Variáveis de ambiente obrigatórias ausentes:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nVerifique seu arquivo .env (use .env.example como base).\n');
    process.exit(1);
  }
}

validateEnv();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    successUrl: process.env.STRIPE_SUCCESS_URL || `${process.env.APP_URL}/sucesso.html`,
    cancelUrl: process.env.STRIPE_CANCEL_URL || `${process.env.APP_URL}/cancelado.html`
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },

  session: {
    secret: process.env.SESSION_SECRET
  },

  admin: {
    email: process.env.ADMIN_EMAIL,
    passwordHash: process.env.ADMIN_PASSWORD_HASH
  },

  resend: {
    apiKey: process.env.RESEND_API_KEY
  },

  email: {
    from: process.env.EMAIL_FROM
  }
};