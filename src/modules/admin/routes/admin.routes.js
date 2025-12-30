// Admin Routes - Gol de Ouro V19
// Módulo: admin
const express = require('express');
const router = express.Router();

const AdminController = require('../controllers/admin.controller');
const { authAdminToken } = require('../../shared/middleware/authMiddleware');

// Estatísticas e relatórios (GET para melhor semântica REST)
router.get('/stats', authAdminToken, (req, res) => AdminController.getGeneralStats(req, res));
router.get('/game-stats', authAdminToken, (req, res) => AdminController.getGameStats(req, res));
router.get('/users', authAdminToken, (req, res) => AdminController.getUsers(req, res));
router.get('/financial-report', authAdminToken, (req, res) => AdminController.getFinancialReport(req, res));
router.get('/top-players', authAdminToken, (req, res) => AdminController.getTopPlayers(req, res));
router.get('/recent-transactions', authAdminToken, (req, res) => AdminController.getRecentTransactions(req, res));
router.get('/recent-shots', authAdminToken, (req, res) => AdminController.getRecentShots(req, res));
router.get('/weekly-report', authAdminToken, (req, res) => AdminController.getWeeklyReport(req, res));

// Rotas legadas (POST) - manter compatibilidade
router.post('/relatorio-semanal', authAdminToken, (req, res) => AdminController.getWeeklyReport(req, res));
router.post('/estatisticas-gerais', authAdminToken, (req, res) => AdminController.getGeneralStats(req, res));
router.post('/top-jogadores', authAdminToken, (req, res) => AdminController.getTopPlayers(req, res));
router.post('/transacoes-recentes', authAdminToken, (req, res) => AdminController.getRecentTransactions(req, res));
router.post('/chutes-recentes', authAdminToken, (req, res) => AdminController.getRecentShots(req, res));
router.get('/lista-usuarios', authAdminToken, (req, res) => AdminController.getUsers(req, res));

// ✅ Expiração de PIX stale (manual)
router.post('/fix-expired-pix', authAdminToken, (req, res) => AdminController.fixExpiredPix(req, res));
router.get('/fix-expired-pix', authAdminToken, (req, res) => AdminController.fixExpiredPix(req, res));

module.exports = router;

