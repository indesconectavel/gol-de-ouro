// Withdraw Routes - Gol de Ouro V19
// Módulo: financial
const express = require('express');
const router = express.Router();

const WithdrawController = require('../controllers/withdraw.controller');
const { verifyToken } = require('../../shared/middleware/authMiddleware');

// ✅ FASE 9: Rotas de saque organizadas
router.post('/request', verifyToken, (req, res) => WithdrawController.requestWithdraw(req, res));
router.get('/history', verifyToken, (req, res) => WithdrawController.getWithdrawHistory(req, res));

module.exports = router;

