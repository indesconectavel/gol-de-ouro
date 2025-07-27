const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

router.post('/saldo', usuarioController.saldo);
router.post('/saque', usuarioController.solicitarSaque);
router.post('/relatorio', usuarioController.gerarRelatorio);
router.post('/saldo-detalhado', usuarioController.saldoDetalhado);
router.post('/ultimas-transacoes', usuarioController.ultimasTransacoes);

module.exports = router;
