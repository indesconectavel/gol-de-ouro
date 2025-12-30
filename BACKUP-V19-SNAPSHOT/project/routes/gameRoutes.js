const express = require('express');
const router = express.Router();
const GameController = require('../controllers/gameController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Endpoints básicos funcionais
router.get('/status', GameController.getGameStatus);
router.post('/chutar', GameController.registerShot);
router.get('/stats', GameController.getGameStats);
router.get('/history', GameController.getShotHistory);

// ✅ FASE 9 ETAPA 5: Rota shoot refatorada (requer autenticação)
router.post('/shoot', verifyToken, GameController.shoot);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Game routes funcionando',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;