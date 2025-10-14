const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/auth');

// Webhook do Mercado Pago (sem autenticação - deve vir primeiro)
router.post('/webhook', PaymentController.webhookMercadoPago);

// Middleware de autenticação para rotas protegidas
router.use(authMiddleware.authenticateToken);

// Rotas de pagamento PIX
router.post('/pix/criar', PaymentController.criarPagamentoPix);
router.get('/pix/status/:payment_id', PaymentController.consultarStatusPagamento);
router.get('/pix/usuario/:user_id', PaymentController.listarPagamentosUsuario);
router.post('/pix/cancelar/:payment_id', PaymentController.cancelarPagamentoPix);

// Rotas de depósito
router.post('/deposito', PaymentController.solicitarDeposito);
router.get('/deposito/:id', PaymentController.obterDeposito);
router.get('/depositos/usuario/:user_id', PaymentController.listarDepositosUsuario);
router.post('/deposito/:id/confirmar', PaymentController.confirmarDeposito);

// Rotas de saque
router.post('/saque', PaymentController.solicitarSaque);
router.get('/saque/:id', PaymentController.obterSaque);
router.get('/saques/usuario/:user_id', PaymentController.listarSaquesUsuario);
router.post('/saque/:id/processar', PaymentController.processarSaque);
router.post('/saque/:id/cancelar', PaymentController.cancelarSaque);

// Rotas de transferência
router.post('/transferencia', PaymentController.realizarTransferencia);
router.get('/transferencias/usuario/:user_id', PaymentController.listarTransferenciasUsuario);
router.get('/transferencia/:id', PaymentController.obterTransferencia);

// Rotas de extrato
router.get('/extrato/:user_id', PaymentController.obterExtrato);
router.get('/extrato/:user_id/periodo/:periodo', PaymentController.obterExtratoPeriodo);
router.post('/extrato/exportar', PaymentController.exportarExtrato);

// Rotas de saldo
router.get('/saldo/:user_id', PaymentController.obterSaldo);
router.post('/saldo/atualizar', PaymentController.atualizarSaldo);
router.get('/saldo/historico/:user_id', PaymentController.obterHistoricoSaldo);

// Rotas de comissões
router.get('/comissoes/:user_id', PaymentController.obterComissoes);
router.post('/comissoes/calcular', PaymentController.calcularComissoes);
router.post('/comissoes/pagar', PaymentController.pagarComissoes);

// Rotas de cashback
router.get('/cashback/:user_id', PaymentController.obterCashback);
router.post('/cashback/aplicar', PaymentController.aplicarCashback);
router.get('/cashback/historico/:user_id', PaymentController.obterHistoricoCashback);

// Rotas de bônus
router.post('/bonus/aplicar', PaymentController.aplicarBonus);
router.get('/bonus/:user_id', PaymentController.obterBonus);
router.post('/bonus/validar', PaymentController.validarBonus);

// Rotas de promoções
router.get('/promocoes', PaymentController.obterPromocoes);
router.post('/promocoes/participar', PaymentController.participarPromocao);
router.get('/promocoes/usuario/:user_id', PaymentController.obterPromocoesUsuario);

// Rotas de cupons
router.post('/cupons/validar', PaymentController.validarCupom);
router.post('/cupons/usar', PaymentController.usarCupom);
router.get('/cupons/usuario/:user_id', PaymentController.obterCuponsUsuario);

// Rotas de referência
router.get('/referencias/:user_id', PaymentController.obterReferencias);
router.post('/referencias/gerar', PaymentController.gerarReferencia);
router.post('/referencias/usar', PaymentController.usarReferencia);

// Rotas de afiliados
router.get('/afiliados/:user_id', PaymentController.obterDadosAfiliado);
router.get('/afiliados/:user_id/ganhos', PaymentController.obterGanhosAfiliado);
router.post('/afiliados/pagar', PaymentController.pagarAfiliados);

// Rotas de relatórios financeiros
router.get('/relatorios/financeiro', PaymentController.obterRelatorioFinanceiro);
router.get('/relatorios/transacoes', PaymentController.obterRelatorioTransacoes);
router.get('/relatorios/usuarios', PaymentController.obterRelatorioUsuarios);

// Rotas de auditoria
router.get('/auditoria/transacoes', PaymentController.obterAuditoriaTransacoes);
router.get('/auditoria/saldos', PaymentController.obterAuditoriaSaldos);
router.post('/auditoria/reconciliar', PaymentController.reconciliarTransacoes);

// Rotas de configurações
router.get('/configuracoes', PaymentController.obterConfiguracoesPagamento);
router.put('/configuracoes', PaymentController.atualizarConfiguracoesPagamento);
router.post('/configuracoes/testar', PaymentController.testarConfiguracoesPagamento);

// Rotas de métodos de pagamento
router.get('/metodos', PaymentController.obterMetodosPagamento);
router.post('/metodos/adicionar', PaymentController.adicionarMetodoPagamento);
router.put('/metodos/:id', PaymentController.atualizarMetodoPagamento);
router.delete('/metodos/:id', PaymentController.removerMetodoPagamento);

// Rotas de taxas
router.get('/taxas', PaymentController.obterTaxas);
router.put('/taxas', PaymentController.atualizarTaxas);
router.post('/taxas/calcular', PaymentController.calcularTaxas);

// Rotas de limites
router.get('/limites/:user_id', PaymentController.obterLimitesUsuario);
router.put('/limites/:user_id', PaymentController.atualizarLimitesUsuario);
router.post('/limites/verificar', PaymentController.verificarLimites);

// Rotas de fraudes
router.post('/fraudes/detectar', PaymentController.detectarFraude);
router.get('/fraudes/suspeitas', PaymentController.obterFraudesSuspeitas);
router.post('/fraudes/analisar', PaymentController.analisarFraude);

// Rotas de backup
router.post('/backup/transacoes', PaymentController.backupTransacoes);
router.get('/backup/transacoes/:data', PaymentController.obterBackupTransacoes);

// Rotas de recuperação
router.post('/recuperacao/solicitar', PaymentController.solicitarRecuperacao);
router.post('/recuperacao/confirmar', PaymentController.confirmarRecuperacao);
router.get('/recuperacao/status/:id', PaymentController.obterStatusRecuperacao);

// Rotas administrativas
router.get('/admin/todos', authMiddleware.authenticateAdmin, PaymentController.listarTodosPagamentos);
router.get('/admin/estatisticas', authMiddleware.authenticateAdmin, PaymentController.obterEstatisticasPagamentos);
router.post('/admin/processar', authMiddleware.authenticateAdmin, PaymentController.processarPagamentoAdmin);
router.post('/admin/reverter', authMiddleware.authenticateAdmin, PaymentController.reverterPagamento);

// Health check dos pagamentos
router.get('/health', PaymentController.healthCheck);

module.exports = router;