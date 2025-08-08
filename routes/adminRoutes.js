const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const exportController = require('../controllers/exportController');
const authMiddleware = require('../middlewares/authMiddleware');

// Relatórios e estatísticas
router.post('/relatorio-semanal', authMiddleware, (req, res) => adminController.relatorioSemanal(req, res));
router.post('/controle-fila', authMiddleware, (req, res) => adminController.controleFila(req, res));
router.post('/estatisticas-gerais', authMiddleware, (req, res) => adminController.estatisticasGerais(req, res));
router.post('/top-jogadores', authMiddleware, (req, res) => adminController.topJogadores(req, res));
router.post('/transacoes-recentes', authMiddleware, (req, res) => adminController.transacoesRecentes(req, res));
router.post('/chutes-recentes', authMiddleware, (req, res) => adminController.chutesRecentes(req, res));
router.post('/relatorio-usuarios', authMiddleware, (req, res) => adminController.relatorioUsuarios(req, res));
router.get('/lista-usuarios', authMiddleware, (req, res) => adminController.listaUsuarios(req, res)); // ✅ Novo endpoint GET
router.post('/logs', authMiddleware, (req, res) => adminController.logsSistema(req, res));
router.post('/usuarios-bloqueados', authMiddleware, (req, res) => adminController.usuariosBloqueados(req, res));
router.post('/suspender/:id', authMiddleware, (req, res) => adminController.suspenderUsuario(req, res));
router.post('/bloquear', authMiddleware, (req, res) => adminController.bloquearUsuario(req, res));
router.post('/desbloquear', authMiddleware, (req, res) => adminController.desbloquearUsuario(req, res));
router.post('/backup-status', authMiddleware, (req, res) => adminController.statusBackup(req, res));

// Exportações em CSV
router.get('/exportar/usuarios-csv', authMiddleware, exportController.exportarUsuariosCSV);
router.get('/exportar/chutes-csv', authMiddleware, exportController.exportarChutesCSV);
router.get('/exportar/transacoes-csv', authMiddleware, exportController.exportarTransacoesCSV);
router.get('/exportar/saques-csv', authMiddleware, exportController.exportarSaquesCSV);
router.get('/exportar/relatorio-completo-csv', authMiddleware, exportController.exportarRelatorioCompletoCSV);
router.get('/exportar/relatorio-geral-csv', authMiddleware, exportController.exportarRelatorioGeralCSV);

module.exports = router;
