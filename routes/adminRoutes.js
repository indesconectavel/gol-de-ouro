const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const exportController = require('../controllers/exportController');
const authMiddleware = require('../middlewares/authMiddleware');

// Relatórios e estatísticas
router.post('/relatorio-semanal', authMiddleware, adminController.relatorioSemanal);
router.post('/controle-fila', authMiddleware, adminController.controleFila);
router.post('/estatisticas', authMiddleware, adminController.estatisticasGerais);
router.post('/top-jogadores', authMiddleware, adminController.topJogadores);
router.post('/transacoes-recentes', authMiddleware, adminController.transacoesRecentes);
router.post('/chutes-recentes', authMiddleware, adminController.chutesRecentes);
router.post('/relatorio-usuarios', authMiddleware, adminController.relatorioUsuarios);
router.post('/usuarios', authMiddleware, adminController.todosUsuarios);
router.post('/logs', authMiddleware, adminController.logsSistema);
router.post('/usuarios-bloqueados', authMiddleware, adminController.usuariosBloqueados);
router.post('/suspender/:id', authMiddleware, adminController.suspenderUsuario);

// Status do backup
router.post('/backup-status', authMiddleware, adminController.statusBackup);

// Exportações em CSV
router.get('/exportar/usuarios-csv', authMiddleware, exportController.exportarUsuariosCSV);
router.get('/exportar/chutes-csv', authMiddleware, exportController.exportarChutesCSV);
router.get('/exportar/transacoes-csv', authMiddleware, exportController.exportarTransacoesCSV);
router.get('/exportar/saques-csv', authMiddleware, exportController.exportarSaquesCSV);
router.get('/exportar/relatorio-completo-csv', authMiddleware, exportController.exportarRelatorioCompletoCSV);

module.exports = router;
