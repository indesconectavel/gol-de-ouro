const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const { verifyToken, verifyAdminToken } = require('../middlewares/authMiddleware');

// ✅ FASE 9 ETAPA 5: Webhook do Mercado Pago com validação de signature
// O método webhookMercadoPago já inclui validação de signature e processamento internamente
router.post('/webhook', (req, res, next) => {
  PaymentController.webhookMercadoPago(req, res, next);
});

// Middleware de autenticação para rotas protegidas
router.use(verifyToken);

// ✅ Rotas implementadas no PaymentController
router.post('/pix/criar', PaymentController.criarPagamentoPix);
router.get('/pix/status/:payment_id', PaymentController.consultarStatusPagamento);
router.get('/pix/usuario/:user_id', PaymentController.listarPagamentosUsuario);
router.post('/pix/cancelar/:payment_id', PaymentController.cancelarPagamentoPix);
router.post('/saque', PaymentController.solicitarSaque);
router.get('/saque/:id', PaymentController.obterSaque);
router.get('/saques/usuario/:user_id', PaymentController.listarSaquesUsuario);
router.get('/extrato/:user_id', PaymentController.obterExtrato);
router.get('/saldo/:user_id', PaymentController.obterSaldo);
router.get('/health', PaymentController.healthCheck);

// ⚠️ Rotas não implementadas - comentadas temporariamente
// Serão implementadas conforme necessário
// router.post('/deposito', PaymentController.solicitarDeposito);
// router.get('/deposito/:id', PaymentController.obterDeposito);
// router.get('/depositos/usuario/:user_id', PaymentController.listarDepositosUsuario);
// router.post('/deposito/:id/confirmar', PaymentController.confirmarDeposito);
// router.post('/saque/:id/processar', PaymentController.processarSaque);
// router.post('/saque/:id/cancelar', PaymentController.cancelarSaque);
// router.post('/transferencia', PaymentController.realizarTransferencia);
// router.get('/transferencias/usuario/:user_id', PaymentController.listarTransferenciasUsuario);
// router.get('/transferencia/:id', PaymentController.obterTransferencia);
// router.get('/extrato/:user_id/periodo/:periodo', PaymentController.obterExtratoPeriodo);
// router.post('/extrato/exportar', PaymentController.exportarExtrato);
// router.post('/saldo/atualizar', PaymentController.atualizarSaldo);
// router.get('/saldo/historico/:user_id', PaymentController.obterHistoricoSaldo);
// router.get('/admin/todos', verifyAdminToken, PaymentController.listarTodosPagamentos);
// router.get('/admin/estatisticas', verifyAdminToken, PaymentController.obterEstatisticasPagamentos);
// router.post('/admin/processar', verifyAdminToken, PaymentController.processarPagamentoAdmin);
// router.post('/admin/reverter', verifyAdminToken, PaymentController.reverterPagamento);

module.exports = router;
