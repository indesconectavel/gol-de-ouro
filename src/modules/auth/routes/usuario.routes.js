// Usuario Routes - Gol de Ouro V19
// Módulo: auth
const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuario.controller');
const { verifyToken } = require('../../shared/middleware/authMiddleware');

// ✅ AUDITORIA: Middleware de autenticação para todas as rotas protegidas
router.use(verifyToken);

// Endpoints básicos funcionais
router.get('/profile', (req, res) => UsuarioController.getUserProfile(req, res));
router.put('/profile', (req, res) => UsuarioController.updateUserProfile(req, res));
router.get('/list', (req, res) => UsuarioController.getUsersList(req, res));
router.get('/stats', (req, res) => UsuarioController.getUserStats(req, res));
router.put('/status/:id', (req, res) => UsuarioController.toggleUserStatus(req, res));

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Usuario routes funcionando',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

