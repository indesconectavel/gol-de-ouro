// System Routes - Gol de Ouro V19
// Módulo: monitor
const express = require('express');
const router = express.Router();

const SystemController = require('../controllers/system.controller');

// ✅ FASE 9: Rotas de sistema organizadas
router.get('/robots.txt', (req, res) => SystemController.getRobotsTxt(req, res));
router.get('/', (req, res) => SystemController.getRoot(req, res));
router.get('/health', (req, res) => SystemController.getHealth(req, res));
router.get('/api/metrics', (req, res) => SystemController.getMetrics(req, res));
router.get('/api/monitoring/metrics', (req, res) => SystemController.getMonitoringMetrics(req, res));
router.get('/api/monitoring/health', (req, res) => SystemController.getMonitoringHealth(req, res));
router.get('/meta', (req, res) => SystemController.getMeta(req, res));
router.get('/api/production-status', (req, res) => SystemController.getProductionStatus(req, res));

module.exports = router;

