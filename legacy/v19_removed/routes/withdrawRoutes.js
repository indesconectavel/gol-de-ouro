const express = require('express');
const router = express.Router();

const WithdrawController = require('../controllers/withdrawController');
const { verifyToken } = require('../middlewares/authMiddleware');

// ✅ FASE 9: Rotas de saque organizadas
router.post('/request', verifyToken, WithdrawController.requestWithdraw);
router.get('/history', verifyToken, WithdrawController.getWithdrawHistory);

module.exports = router;


