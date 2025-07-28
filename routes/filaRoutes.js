const express = require('express');
const router = express.Router();
const filaController = require('../controllers/filaController');

// Entrar na fila
router.post('/entrar', filaController.enterQueue);

// Chutar ao gol
router.post('/chutar', filaController.shootBall);

// Consultar status na fila (corrigido para POST)
router.post('/status', filaController.getStatus);

module.exports = router;
