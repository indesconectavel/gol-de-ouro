const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const exportController = require('../controllers/exportController');

// Relatórios e estatísticas
router.post('/relatorio-semanal', adminController.relatorioSemanal);
router.post('/controle-fila', adminController.controleFila);
router.post('/estatisticas', adminController.estatisticasGerais);
router.post('/top-jogadores', adminController.topJogadores);
router.post('/transacoes-recentes', adminController.transacoesRecentes);
router.post('/chutes-recentes', adminController.chutesRecentes);
router.post('/relatorio-usuarios', adminController.relatorioUsuarios);
router.post('/usuarios', adminController.todosUsuarios);
router.post('/logs', adminController.logsSistema);
router.post('/usuarios-bloqueados', adminController.usuariosBloqueados);
router.post('/suspender/:id', adminController.suspenderUsuario);

// Status do backup
router.post('/backup-status', adminController.statusBackup);

// Exportações em CSV
router.get('/exportar/usuarios-csv', exportController.exportarUsuariosCSV);
router.get('/exportar/chutes-csv', exportController.exportarChutesCSV);
router.get('/exportar/transacoes-csv', exportController.exportarTransacoesCSV);
router.get('/exportar/saques-csv', exportController.exportarSaquesCSV);
router.get('/exportar/relatorio-completo-csv', exportController.exportarRelatorioCompletoCSV);

module.exports = router;
