// Auth Routes - Gol de Ouro V19
// Módulo: auth
const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validationResult } = require('express-validator');

const AuthController = require('../controllers/auth.controller');
const { verifyToken } = require('../../shared/middleware/authMiddleware');

// Middleware de validação
const validateData = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// ✅ FASE 9: Rotas expandidas com rotas faltantes
router.post('/register', (req, res) => AuthController.register(req, res));
router.post('/login', (req, res) => AuthController.login(req, res));
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], validateData, (req, res) => AuthController.forgotPassword(req, res));
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], validateData, (req, res) => AuthController.resetPassword(req, res));
router.post('/verify-email', [
  body('token').notEmpty()
], validateData, (req, res) => AuthController.verifyEmail(req, res));
router.put('/change-password', verifyToken, (req, res) => AuthController.changePassword(req, res)); // Requer autenticação

module.exports = router;

