const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validationResult } = require('express-validator');

const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

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
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail()
], validateData, authController.forgotPassword);
router.post('/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], validateData, authController.resetPassword);
router.post('/verify-email', [
  body('token').notEmpty()
], validateData, authController.verifyEmail);
router.put('/change-password', verifyToken, authController.changePassword); // Requer autenticação

module.exports = router;
