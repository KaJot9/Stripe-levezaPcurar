/**
 * controllers/webhook.controller.js
 *
 * Núcleo do sistema: recebe os eventos do Stripe, valida a assinatura
 * do webhook e executa as regras de negócio para cada tipo de evento.
 *
 * IMPORTANTE: esta rota precisa receber o corpo bruto (raw body), não
 * JSON parseado — isso é configurado no server.js com express.raw().
 */

const stripeService = require('../services/stripe.service');
const plansService = require('../services/plans.service');
const customersService = require('../services/customers.service');
const deliveryService = require('../services/delivery.service');
const webhookEventModel = require('../models/webhookEvent.model');
const logger = require('../utils/logger');

/**
 * POST /webhook/stripe
 */
async function receberWebhook(req, res) {
  const signature = req.headers['stripe-signature'];
  let event;

  // 1. Validar a assinatura do webhook (segurança essencial).
  try {
    event = stripeService.construirEventoWebhook(req.body, signature);
 } catch (err) {
  logger.error("Assinatura de webhook inválida:", err.message);
  return res.status(400).send(`Webhook Error: ${err.message}`);
 }
 logger.info(`Webhook recebido: ${event.type} ${event.id}`);

  // 2. Idempotência: se este evento já foi processado, apenas confirma o recebimento.
  const jaProcessado = await webhookEventModel.jaProcessado(event.id);
  if (jaProcessado) {
    logger.info(`Evento ${event.id} (${event.type}) já processado — ignorando.`);
    return res.json({ received: true, duplicated: true });
  }

  // 3. Responde 200 rapidamente é uma boa prática, mas aqui processamos
  //    de forma síncrona pois as operações são leves (I/O em banco/e-mail).
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await tratarCheckoutConcluido(event);
        break;

      case 'invoice.paid':
        await tratarFaturaPaga(event);
        break;

      case 'invoice.payment_failed':
        await tratarFalhaPagamento(event);
        break;

      case 'customer.subscription.updated':
        await tratarAssinaturaAtualizada(event);
        break;

      case 'customer.subscription.deleted':
        await tratarAssinaturaCancelada(event);
        break;

      default:
        logger.info(`Evento não tratado explicitamente: ${event.type}`);
    }

    await webhookEventModel.registrar(event.id, event.type);
    return res.json({ received: true });
  } catch (err) {
    // Não marcamos como processado se der erro, para o Stripe reenviar.
    logger.error(`Erro ao processar evento ${event.type} (${event.id}):`, err.message);
    return res.status(500).json({ error: 'Erro ao processar evento.' });
  }
}
/**
 * checkout.session.completed
 * Fluxo principal descrito no requisito:
 * localizar cliente -> identificar Price ID -> localizar plano ->
 * obter link -> registrar assinatura -> enviar link.
 */
async function tratarCheckoutConcluido(event) {
  const session = event.data.object;

  // Reconsultamos a sessão expandida para garantir dados completos
  // (subscription, customer, line_items) mesmo que o payload do evento seja parcial.
  const sessionCompleta = await stripeService.obterCheckoutSession(session.id);

  const subscriptionId =
    typeof sessionCompleta.subscription === 'string'
      ? sessionCompleta.subscription
      : sessionCompleta.subscription?.id;

  const stripeCustomerId =
    typeof sessionCompleta.customer === 'string'
      ? sessionCompleta.customer
      : sessionCompleta.customer?.id;

  const email = sessionCompleta.customer_details?.email || sessionCompleta.customer_email;
  const nome = sessionCompleta.customer_details?.name || null;
  const telefone = sessionCompleta.customer_details?.phone || null;

  // Identifica o Price ID a partir dos itens da sessão (nunca pelo valor).
  const priceId =
    sessionCompleta.line_items?.data?.[0]?.price?.id || sessionCompleta.metadata?.price_id;

  if (!priceId) {
    throw new Error(`Não foi possível identificar o Price ID na sessão ${session.id}`);
  }

  // Localiza o plano correspondente ao Price ID.
  const plano = await plansService.obterPlanoPorPriceId(priceId);

  // Registra a assinatura no banco.
  await customersService.registrarAssinatura({
    nome,
    email,
    telefone,
    stripeCustomerId,
    subscriptionId,
    priceId,
    planoId: plano.id
  });

  // Envia automaticamente o link do grupo ao cliente.
  if (email) {
    await deliveryService.entregarAcesso({
      subscriptionId,
      email,
      nomePlano: plano.nome,
      linkGrupo: plano.link_grupo
    });
  } else {
    logger.warn(`Checkout ${session.id} concluído sem e-mail do cliente — link não enviado.`);
  }
}

/**
 * invoice.paid -> assinatura confirmada/renovada como ativa.
 */
async function tratarFaturaPaga(event) {
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  await customersService.marcarAtiva(subscriptionId);
}

/**
 * invoice.payment_failed -> assinatura marcada como pendente/inadimplente.
 */
async function tratarFalhaPagamento(event) {
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  await customersService.marcarInadimplente(subscriptionId);
}

/**
 * customer.subscription.updated -> mantém status sincronizado com o Stripe
 * (ex: reativação, mudança de plano, fim de período de trial, etc).
 */
async function tratarAssinaturaAtualizada(event) {
  const subscription = event.data.object;
  const subscriptionId = subscription.id;

  const statusMap = {
    active: 'ativa',
    trialing: 'ativa',
    past_due: 'inadimplente',
    unpaid: 'inadimplente',
    canceled: 'cancelada',
    incomplete_expired: 'cancelada'
  };

  const statusInterno = statusMap[subscription.status] || 'pendente';

  const cliente = await customersService.buscarPorSubscriptionId(subscriptionId);
  if (!cliente) {
    logger.warn(`customer.subscription.updated para assinatura desconhecida: ${subscriptionId}`);
    return;
  }

  // Se o plano mudou (upgrade/downgrade), atualiza o price_id/plano também.
  const novoPriceId = subscription.items?.data?.[0]?.price?.id;
  if (novoPriceId && novoPriceId !== cliente.price_id) {
    const novoPlano = await plansService.obterPlanoPorPriceId(novoPriceId);
    await customersService.registrarAssinatura({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      stripeCustomerId: cliente.stripe_customer_id,
      subscriptionId,
      priceId: novoPriceId,
      planoId: novoPlano.id
    });
  }

  if (statusInterno === 'ativa') await customersService.marcarAtiva(subscriptionId);
  else if (statusInterno === 'inadimplente') await customersService.marcarInadimplente(subscriptionId);
  else if (statusInterno === 'cancelada') await customersService.marcarCancelada(subscriptionId);
}

/**
 * customer.subscription.deleted -> cancelamento definitivo.
 * Regra explícita do requisito: NÃO reenviar links de acesso após o cancelamento.
 */
async function tratarAssinaturaCancelada(event) {
  const subscription = event.data.object;
  await customersService.marcarCancelada(subscription.id);
  // Nenhuma chamada a deliveryService.entregarAcesso() aqui — intencional.
}

module.exports = { receberWebhook };
