// Payment Routes - Gol de Ouro V19
// Módulo: financial
const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { verifyToken, verifyAdminToken } = require('../../shared/middleware/authMiddleware');

// ✅ FASE 9 ETAPA 5: Webhook do Mercado Pago com validação de signature
// O método webhookMercadoPago já inclui validação de signature e processamento internamente
router.post('/webhook', (req, res, next) => {
  PaymentController.webhookMercadoPago(req, res, next);
});

// Middleware de autenticação para rotas protegidas
router.use(verifyToken);

// ✅ Rotas implementadas no PaymentController
router.post('/pix/criar', (req, res) => PaymentController.criarPagamentoPix(req, res));
router.get('/pix/status/:payment_id', (req, res) => PaymentController.consultarStatusPagamento(req, res));
router.get('/pix/usuario/:user_id', (req, res) => PaymentController.listarPagamentosUsuario(req, res));
router.post('/pix/cancelar/:payment_id', (req, res) => PaymentController.cancelarPagamentoPix(req, res));
router.post('/saque', (req, res) => PaymentController.solicitarSaque(req, res));
router.get('/saque/:id', (req, res) => PaymentController.obterSaque(req, res));
router.get('/saques/usuario/:user_id', (req, res) => PaymentController.listarSaquesUsuario(req, res));
router.get('/extrato/:user_id', (req, res) => PaymentController.obterExtrato(req, res));
router.get('/saldo/:user_id', (req, res) => PaymentController.obterSaldo(req, res));
router.get('/health', (req, res) => PaymentController.healthCheck(req, res));

module.exports = router;

