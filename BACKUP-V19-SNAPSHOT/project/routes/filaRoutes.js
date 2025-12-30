const express = require('express');
const router = express.Router();
const filaController = require('../controllers/filaController');

// POST /fila/entrar – Adiciona o jogador à fila
router.post('/entrar', filaController.enterQueue);

// POST /fila/chutar – Realiza o chute do jogador na partida
router.post('/chutar', filaController.shootBall);

// POST /fila/status – Consulta status da fila e do chute
router.post('/status', filaController.getStatus);

module.exports = router;
