/**
 * MONITOR ROUTES - Rotas de monitoramento
 */

const express = require('express');
const router = express.Router();
const MonitorController = require('./monitor.controller');

// GET /monitor - Métricas em JSON
router.get('/', MonitorController.getMonitor);

// GET /metrics - Métricas Prometheus
router.get('/metrics', MonitorController.getMetrics);

module.exports = router;

