/**
 * services/plans.service.js
 * Regras de negócio relacionadas a planos. É a camada que o painel
 * administrativo e o checkout usam — nunca acessam o model diretamente.
 */

const planModel = require('../models/plan.model');
const { isNonEmptyString, isValidUrl, isValidPriceId, isPositiveNumber } = require('../utils/validators');

async function listarPlanos({ onlyActive = false } = {}) {
  return planModel.findAll({ onlyActive });
}

async function obterPlanoPorId(id) {
  return planModel.findById(id);
}

/**
 * Ponto central do sistema: dado um Price ID vindo do Stripe (webhook),
 * descobre a qual plano ele corresponde. Toda a lógica de liberação
 * de acesso depende exclusivamente desta função.
 */
async function obterPlanoPorPriceId(priceId) {
  if (!isValidPriceId(priceId)) {
    throw new Error(`Price ID inválido recebido do Stripe: ${priceId}`);
  }
  const plano = await planModel.findByPriceId(priceId);
  if (!plano) {
    throw new Error(`Nenhum plano cadastrado para o Price ID: ${priceId}`);
  }
  return plano;
}

function validarDadosPlano(payload) {
  const erros = [];
  if (!isNonEmptyString(payload.nome)) erros.push('Nome é obrigatório.');
  if (!isValidPriceId(payload.price_id)) erros.push('Price ID inválido (deve começar com "price_").');
  if (!isPositiveNumber(payload.valor)) erros.push('Valor deve ser um número positivo.');
  if (!isValidUrl(payload.link_grupo)) erros.push('Link do grupo deve ser uma URL válida.');
  return erros;
}

async function criarPlano(payload) {
  const erros = validarDadosPlano(payload);
  if (erros.length) {
    const err = new Error(erros.join(' '));
    err.status = 400;
    throw err;
  }

  return planModel.create({
    nome: payload.nome.trim(),
    price_id: payload.price_id.trim(),
    valor: Number(payload.valor),
    link_grupo: payload.link_grupo.trim(),
    ativo: payload.ativo !== undefined ? Boolean(payload.ativo) : true,
    ordem_exibicao: Number(payload.ordem_exibicao) || 0
  });
}

async function atualizarPlano(id, payload) {
  const existente = await planModel.findById(id);
  if (!existente) {
    const err = new Error('Plano não encontrado.');
    err.status = 404;
    throw err;
  }

  const merged = { ...existente, ...payload };
  const erros = validarDadosPlano(merged);
  if (erros.length) {
    const err = new Error(erros.join(' '));
    err.status = 400;
    throw err;
  }

  return planModel.update(id, {
    nome: merged.nome.trim(),
    price_id: merged.price_id.trim(),
    valor: Number(merged.valor),
    link_grupo: merged.link_grupo.trim(),
    ativo: Boolean(merged.ativo),
    ordem_exibicao: Number(merged.ordem_exibicao) || 0
  });
}

async function excluirPlano(id) {
  const existente = await planModel.findById(id);
  if (!existente) {
    const err = new Error('Plano não encontrado.');
    err.status = 404;
    throw err;
  }
  return planModel.remove(id);
}

async function alternarStatus(id, ativo) {
  return planModel.update(id, { ativo: Boolean(ativo) });
}

module.exports = {
  listarPlanos,
  obterPlanoPorId,
  obterPlanoPorPriceId,
  criarPlano,
  atualizarPlano,
  excluirPlano,
  alternarStatus
};
