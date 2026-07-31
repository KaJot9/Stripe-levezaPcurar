const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.get('/login', authController.paginaLogin);
router.post('/login', authController.processarLogin);
router.post('/logout', authController.logout);

module.exports = router;
