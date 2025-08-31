const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const exportController = require('../controllers/exportController');
const { authAdminToken } = require('../middlewares/authMiddleware');

// Relatórios e estatísticas
router.post('/relatorio-semanal', authAdminToken, adminController.relatorioSemanal);
router.post('/controle-fila', authAdminToken, adminController.controleFila);
router.post('/estatisticas-gerais', authAdminToken, adminController.estatisticasGerais);
router.post('/top-jogadores', authAdminToken, adminController.topJogadores);
router.post('/transacoes-recentes', authAdminToken, adminController.transacoesRecentes);
router.post('/chutes-recentes', authAdminToken, adminController.chutesRecentes);
router.post('/relatorio-usuarios', authAdminToken, adminController.relatorioUsuarios);
router.post('/logs', authAdminToken, adminController.logsSistema);
router.post('/usuarios-bloqueados', authAdminToken, adminController.usuariosBloqueados);
router.post('/suspender/:id', authAdminToken, adminController.suspenderUsuario);
router.post('/bloquear', authAdminToken, adminController.bloquearUsuario);
router.post('/desbloquear', authAdminToken, adminController.desbloquearUsuario);
router.post('/backup-status', authAdminToken, adminController.statusBackup);
router.get('/lista-usuarios', authAdminToken, adminController.listaUsuarios);

// Exportações em CSV
router.get('/exportar/usuarios-csv', authAdminToken, exportController.exportarUsuariosCSV);
router.get('/exportar/chutes-csv', authAdminToken, exportController.exportarChutesCSV);
router.get('/exportar/transacoes-csv', authAdminToken, exportController.exportarTransacoesCSV);
router.get('/exportar/saques-csv', authAdminToken, exportController.exportarSaquesCSV);
router.get('/exportar/relatorio-completo-csv', authAdminToken, exportController.exportarRelatorioCompletoCSV);
router.get('/exportar/relatorio-geral-csv', authAdminToken, exportController.exportarRelatorioGeralCSV);

module.exports = router;
