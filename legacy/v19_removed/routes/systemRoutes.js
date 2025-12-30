const express = require('express');
const router = express.Router();

const SystemController = require('../controllers/systemController');

// ✅ FASE 9: Rotas de sistema organizadas
router.get('/robots.txt', SystemController.getRobotsTxt);
router.get('/', SystemController.getRoot);
router.get('/health', SystemController.getHealth);
router.get('/api/metrics', SystemController.getMetrics);
router.get('/api/monitoring/metrics', SystemController.getMonitoringMetrics);
router.get('/api/monitoring/health', SystemController.getMonitoringHealth);
router.get('/meta', SystemController.getMeta);
router.get('/api/production-status', SystemController.getProductionStatus);

module.exports = router;


