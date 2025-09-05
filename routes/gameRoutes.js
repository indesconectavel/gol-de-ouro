const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');
const authMiddleware = require('../middlewares/authMiddleware');
const analyticsCollector = require('../src/utils/analytics');

// Middleware de autenticação para rotas protegidas
// router.use(authMiddleware.verifyToken); // Comentado para permitir endpoints públicos

// Endpoints públicos (sem autenticação)
router.get('/opcoes-chute', GameController.obterOpcoesChute);

// Endpoints protegidos (com autenticação)
router.post('/fila/entrar', authMiddleware.verifyToken, GameController.entrarNaFila);
router.post('/fila/status', authMiddleware.verifyToken, GameController.obterStatusFila);
router.post('/chutar', authMiddleware.verifyToken, GameController.executarChute);
router.post('/historico', authMiddleware.verifyToken, GameController.obterHistoricoJogos);
router.get('/estatisticas', authMiddleware.verifyAdminToken, GameController.obterEstatisticas);

// Endpoints públicos para o dashboard
router.get('/stats', async (req, res) => {
  try {
    // Dados fictícios para estatísticas de jogos (congruentes com 100 chutes)
    const stats = {
      totalGames: 100,
      activeGames: 8,
      completedGames: 92,
      averageGameDuration: 45,
      popularGameTypes: [
        { name: 'Chute ao Gol', count: 60 },
        { name: 'Penalty', count: 25 },
        { name: 'Falta', count: 15 }
      ],
      gameCompletionRate: 92.0,
      // Valores congruentes para Gol de Ouro
      goldenGoals: 12,
      nextGoldenGoal: 100, // 100 chutes para próximo gol de ouro
      totalBets: 1000.00, // R$ 10,00 por jogo x 100 jogos
      totalPrizes: 500.00, // R$ 5,00 por jogo x 100 jogos
      goldenGoalPrize: 50.00 // Prêmio do gol de ouro
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas de jogos',
      message: error.message
    });
  }
});

router.get('/recent', async (req, res) => {
  try {
    // Dados fictícios para jogos recentes
    const recentGames = [
      {
        id: 1,
        player: 'João Silva',
        gameType: 'Chute ao Gol',
        result: 'Gol',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        bet: 10.50
      },
      {
        id: 2,
        player: 'Maria Santos',
        gameType: 'Penalty',
        result: 'Defesa',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        bet: 25.00
      },
      {
        id: 3,
        player: 'Pedro Costa',
        gameType: 'Falta',
        result: 'Gol',
        timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        bet: 15.75
      },
      {
        id: 4,
        player: 'Ana Oliveira',
        gameType: 'Chute ao Gol',
        result: 'Fora',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        bet: 8.00
      },
      {
        id: 5,
        player: 'Carlos Lima',
        gameType: 'Penalty',
        result: 'Gol',
        timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
        bet: 30.00
      }
    ];
    
    res.json({
      success: true,
      data: recentGames
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erro ao obter jogos recentes',
      message: error.message
    });
  }
});

module.exports = router;