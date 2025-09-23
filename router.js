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

// Rota de readiness check
router.get('/readiness', (req, res) => {
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Rota raiz
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Gol de Ouro Backend API',
    version: '1.1.1',
    timestamp: new Date().toISOString(),
    status: 'running'
  });
});

// Rota de status
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Exportar o router
module.exports = router;
