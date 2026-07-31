/**
 * controllers/plans.controller.js
 * Endpoints de API usados pela tela de "Planos" do painel administrativo.
 */

const plansService = require('../services/plans.service');
const asyncHandler = require('../utils/asyncHandler');

const listar = asyncHandler(async (req, res) => {
  const planos = await plansService.listarPlanos();
  res.json(planos);
});

const obter = asyncHandler(async (req, res) => {
  const plano = await plansService.obterPlanoPorId(req.params.id);
  if (!plano) return res.status(404).json({ error: 'Plano não encontrado.' });
  res.json(plano);
});

const criar = asyncHandler(async (req, res) => {
  const plano = await plansService.criarPlano(req.body);
  res.status(201).json(plano);
});

const atualizar = asyncHandler(async (req, res) => {
  const plano = await plansService.atualizarPlano(req.params.id, req.body);
  res.json(plano);
});

const excluir = asyncHandler(async (req, res) => {
  await plansService.excluirPlano(req.params.id);
  res.status(204).send();
});

const alternarStatus = asyncHandler(async (req, res) => {
  const plano = await plansService.alternarStatus(req.params.id, req.body.ativo);
  res.json(plano);
});

module.exports = { listar, obter, criar, atualizar, excluir, alternarStatus };
