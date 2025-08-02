const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Endpoints principais
router.post('/entrada', usuarioController.entrada); // entra na fila
router.post('/chutar', usuarioController.chutar); // faz um chute

// Saldo e transações
router.post('/saldo', usuarioController.saldo);
router.post('/saldo-detalhado', usuarioController.saldoDetalhado);
router.post('/ultimas-transacoes', usuarioController.ultimasTransacoes);

// Saques e relatórios
router.post('/saque', usuarioController.solicitarSaque);
router.post('/relatorio', usuarioController.gerarRelatorio);

module.exports = router;
