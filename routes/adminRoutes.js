const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const exportController = require('../controllers/exportController');

// ✅ Rotas administrativas
router.get('/relatorio-semanal', adminController.relatorioSemanal);
router.get('/controle-fila', adminController.controleFila);
router.get('/usuarios', adminController.listarUsuarios);
router.get('/estatisticas-gerais', adminController.estatisticasGerais);
router.get('/top-jogadores', adminController.topJogadores);
router.get('/transacoes-recentes', adminController.transacoesRecentes);
router.get('/chutes-recentes', adminController.chutesRecentes);
router.get('/relatorio-usuarios', adminController.relatorioUsuarios);
router.get('/logs', adminController.logsSistema);
router.get('/usuarios-bloqueados', adminController.usuariosBloqueados);
router.get('/suspender-usuario/:id', adminController.suspenderUsuario);

// ✅ Exportações CSV
router.get('/exportar/usuarios-csv', exportController.exportarUsuariosCSV);
router.get('/exportar/chutes-csv', exportController.exportarChutesCSV);
router.get('/exportar/transacoes-csv', exportController.exportarTransacoesCSV);
router.get('/exportar/saques-csv', exportController.exportarSaquesCSV);
router.get('/exportar/relatorio-completo-csv', exportController.exportarRelatorioCompletoCSV);
router.get('/backup-status', exportController.statusBackup);

module.exports = router;
