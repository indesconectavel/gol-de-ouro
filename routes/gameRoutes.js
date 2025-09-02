const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.verifyToken);

// Entrar na fila para jogar
router.post('/fila/entrar', GameController.entrarNaFila);

// Obter status da fila
router.post('/fila/status', GameController.obterStatusFila);

// Obter opções de chute
router.get('/opcoes-chute', GameController.obterOpcoesChute);

// Executar chute
router.post('/chutar', GameController.executarChute);

// Obter histórico de jogos
router.post('/historico', GameController.obterHistoricoJogos);

// Obter estatísticas (admin)
router.get('/estatisticas', authMiddleware.verifyAdminToken, GameController.obterEstatisticas);

module.exports = router;