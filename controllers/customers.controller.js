/**
 * controllers/customers.controller.js
 * Endpoint de API usado pela tela de "Clientes" do painel administrativo.
 */

const customersService = require('../services/customers.service');
const asyncHandler = require('../utils/asyncHandler');

const listar = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Number(req.query.pageSize) || 20);
  const search = (req.query.search || '').trim();

  const { data, count } = await customersService.listarClientes({ page, pageSize, search });

  res.json({
    data,
    pagination: { page, pageSize, total: count, totalPages: Math.ceil(count / pageSize) }
  });
});

module.exports = { listar };
