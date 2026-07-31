/**
 * server.js
 * Ponto de entrada da aplicação. Responsável apenas por "montar" a app:
 * middlewares globais, view engine, rotas e tratamento de erros.
 * Toda a lógica de negócio vive em controllers/services/models.
 */

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');

const env = require('./config/env');
const logger = require('./utils/logger');
const webhookRoutes = require('./routes/webhook.routes');
const mainRoutes = require('./routes/index');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler.middleware');

const app = express();

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

/**
 * ORDEM CRÍTICA:
 * A rota de webhook do Stripe precisa do corpo BRUTO (Buffer) para validar
 * a assinatura HMAC. Por isso ela é registrada ANTES do express.json(),
 * usando express.raw() apenas para este caminho específico.
 */
app.use('/webhook', express.raw({ type: 'application/json' }), webhookRoutes);

// A partir daqui, todo o resto da aplicação usa JSON normalmente.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: env.session.secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 8 // 8 horas
    }
  })
);

// Arquivos estáticos (landing page, sucesso/cancelado, assets do admin)
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da aplicação (API pública + admin)
app.use(mainRoutes);

// Health check simples, útil para monitoramento em produção.
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info(`Servidor rodando em ${env.appUrl} (ambiente: ${env.nodeEnv})`);
});
