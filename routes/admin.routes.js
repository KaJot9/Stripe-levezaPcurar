const express = require('express');
const { exigirLogin } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/dashboard', exigirLogin, (req, res) => res.render('admin/dashboard'));
router.get('/planos', exigirLogin, (req, res) => res.render('admin/plans'));
router.get('/clientes', exigirLogin, (req, res) => res.render('admin/customers'));
router.get('/', exigirLogin, (req, res) => res.redirect('/admin/dashboard'));

module.exports = router;
