// ROUTER PRINCIPAL - Gol de Ouro Backend
// Arquivo criado para resolver erro "Cannot find module './router'" no Render

const express = require('express');
const router = express.Router();

// Middleware de logging para todas as rotas
router.use((req, res, next) => {
  console.log(`[Router] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Rota de health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Rota principal
router.get('/', (req, res) => {
  res.json({
    message: '🚀 API Gol de Ouro - Router Principal',
    version: '1.0.0',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

// Rota de status do sistema
router.get('/status', (req, res) => {
  res.json({
    server: 'online',
    database: 'connected',
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erro
router.use((err, req, res, next) => {
  console.error('❌ Erro no router:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: err.message
  });
});

module.exports = router;
