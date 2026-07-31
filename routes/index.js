/**
 * routes/index.js
 * Agrega todos os módulos de rota em um único router,
 * mantendo o server.js enxuto.
 */

const express = require('express');

const checkoutRoutes = require('./checkout.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const adminApiRoutes = require('./adminApi.routes');

const router = express.Router();

router.use('/api', checkoutRoutes);
router.use('/admin', authRoutes);
router.use('/admin', adminRoutes);
router.use('/api/admin', adminApiRoutes);

module.exports = router;
