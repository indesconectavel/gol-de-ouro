const express = require('express');
const router = express.Router();

const AdminController = require('../controllers/adminController');
// const exportController = require('../controllers/exportController'); // ⚠️ Temporariamente desabilitado
const { authAdminToken } = require('../middlewares/authMiddleware');

// Estatísticas e relatórios (GET para melhor semântica REST)
router.get('/stats', authAdminToken, AdminController.getGeneralStats);
router.get('/game-stats', authAdminToken, AdminController.getGameStats);
router.get('/users', authAdminToken, AdminController.getUsers);
router.get('/financial-report', authAdminToken, AdminController.getFinancialReport);
router.get('/top-players', authAdminToken, AdminController.getTopPlayers);
router.get('/recent-transactions', authAdminToken, AdminController.getRecentTransactions);
router.get('/recent-shots', authAdminToken, AdminController.getRecentShots);
router.get('/weekly-report', authAdminToken, AdminController.getWeeklyReport);

// Rotas legadas (POST) - manter compatibilidade
router.post('/relatorio-semanal', authAdminToken, AdminController.getWeeklyReport);
router.post('/estatisticas-gerais', authAdminToken, AdminController.getGeneralStats);
router.post('/top-jogadores', authAdminToken, AdminController.getTopPlayers);
router.post('/transacoes-recentes', authAdminToken, AdminController.getRecentTransactions);
router.post('/chutes-recentes', authAdminToken, AdminController.getRecentShots);
router.get('/lista-usuarios', authAdminToken, AdminController.getUsers);

// ✅ Expiração de PIX stale (manual)
router.post('/fix-expired-pix', authAdminToken, AdminController.fixExpiredPix);
router.get('/fix-expired-pix', authAdminToken, AdminController.fixExpiredPix);

// ⚠️ Exportações em CSV - Temporariamente desabilitadas (exportController não implementado)
// router.get('/exportar/usuarios-csv', authAdminToken, exportController.exportarUsuariosCSV);
// router.get('/exportar/chutes-csv', authAdminToken, exportController.exportarChutesCSV);
// router.get('/exportar/transacoes-csv', authAdminToken, exportController.exportarTransacoesCSV);
// router.get('/exportar/saques-csv', authAdminToken, exportController.exportarSaquesCSV);
// router.get('/exportar/relatorio-completo-csv', authAdminToken, exportController.exportarRelatorioCompletoCSV);
// router.get('/exportar/relatorio-geral-csv', authAdminToken, exportController.exportarRelatorioGeralCSV);

module.exports = router;
