const express = require('express');
const { exigirLogin } = require('../middlewares/auth.middleware');
const plansController = require('../controllers/plans.controller');
const customersController = require('../controllers/customers.controller');
const dashboardController = require('../controllers/dashboard.controller');

const router = express.Router();

router.use(exigirLogin);

// Planos (CRUD completo, sem necessidade de alterar código para novos planos)
router.get('/planos', plansController.listar);
router.get('/planos/:id', plansController.obter);
router.post('/planos', plansController.criar);
router.put('/planos/:id', plansController.atualizar);
router.patch('/planos/:id/status', plansController.alternarStatus);
router.delete('/planos/:id', plansController.excluir);

// Clientes (listar/buscar)
router.get('/clientes', customersController.listar);

// Dashboard
router.get('/dashboard/estatisticas', dashboardController.estatisticas);

module.exports = router;
