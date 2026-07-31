/**
 * services/customers.service.js
 * Regras de negócio relacionadas a clientes e ao ciclo de vida da assinatura.
 * É esta camada que o webhook controller usa para registrar/atualizar status.
 */

const customerModel = require('../models/customer.model');

/**
 * Registra (ou atualiza, se já existir pelo subscription_id) a assinatura
 * de um cliente após o checkout ser concluído.
 */
async function registrarAssinatura({
  nome,
  email,
  telefone,
  stripeCustomerId,
  subscriptionId,
  priceId,
  planoId
}) {
  const existente = subscriptionId
    ? await customerModel.findBySubscriptionId(subscriptionId)
    : null;

  if (existente) {
    return customerModel.updateById(existente.id, {
      nome: nome || existente.nome,
      telefone: telefone || existente.telefone,
      price_id: priceId,
      plano_id: planoId,
      status: 'ativa'
    });
  }

  return customerModel.create({
    nome,
    email,
    telefone,
    stripe_customer_id: stripeCustomerId,
    subscription_id: subscriptionId,
    price_id: priceId,
    plano_id: planoId,
    status: 'ativa',
    link_enviado: false
  });
}

async function marcarLinkEnviado(subscriptionId) {
  return customerModel.updateBySubscriptionId(subscriptionId, { link_enviado: true });
}

async function marcarAtiva(subscriptionId) {
  return customerModel.updateBySubscriptionId(subscriptionId, { status: 'ativa' });
}

async function marcarInadimplente(subscriptionId) {
  return customerModel.updateBySubscriptionId(subscriptionId, { status: 'inadimplente' });
}

/**
 * Marca a assinatura como cancelada. A partir daqui, nenhuma outra rotina
 * do sistema deve reenviar o link de acesso para este cliente.
 */
async function marcarCancelada(subscriptionId) {
  return customerModel.updateBySubscriptionId(subscriptionId, { status: 'cancelada' });
}

async function buscarPorSubscriptionId(subscriptionId) {
  return customerModel.findBySubscriptionId(subscriptionId);
}

async function listarClientes({ page, pageSize, search }) {
  return customerModel.findAll({ page, pageSize, search });
}

module.exports = {
  registrarAssinatura,
  marcarLinkEnviado,
  marcarAtiva,
  marcarInadimplente,
  marcarCancelada,
  buscarPorSubscriptionId,
  listarClientes
};
