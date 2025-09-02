const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Webhook do Mercado Pago (sem autenticação - deve vir primeiro)
router.post('/webhook', PaymentController.webhookMercadoPago);

// Middleware de autenticação para rotas protegidas
router.use(authMiddleware.verifyToken);

// Rotas de pagamento PIX
router.post('/pix/criar', PaymentController.criarPagamentoPix);
router.get('/pix/status/:payment_id', PaymentController.consultarStatusPagamento);
router.get('/pix/usuario/:user_id', PaymentController.listarPagamentosUsuario);

// Rotas administrativas
router.get('/admin/todos', authMiddleware.verifyAdminToken, PaymentController.listarTodosPagamentos);

module.exports = router;
