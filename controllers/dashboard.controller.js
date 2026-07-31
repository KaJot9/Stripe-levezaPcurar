/**
 * controllers/dashboard.controller.js
 */

const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');

const estatisticas = asyncHandler(async (req, res) => {
  const stats = await dashboardService.obterEstatisticas();
  res.json(stats);
});

module.exports = { estatisticas };
