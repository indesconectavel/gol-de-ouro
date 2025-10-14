const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

// Endpoints básicos funcionais
router.get('/profile', usuarioController.getUserProfile);
router.put('/profile', usuarioController.updateUserProfile);
router.get('/list', usuarioController.getUsersList);
router.get('/stats', usuarioController.getUserStats);
router.put('/status/:id', usuarioController.toggleUserStatus);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Usuario routes funcionando',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;