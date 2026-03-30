/**
 * POST público para ingestão mínima de eventos do player (sendBeacon).
 * Não reutilizar routes/analyticsRoutes.js (legado/admin).
 */
const express = require('express');

let logger;
try {
  logger = require('../logging/sistema-logs-avancado').logger;
} catch (e) {
  logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args)
  };
}

const router = express.Router();

router.post('/', (req, res) => {
  const body = req.body;
  if (body == null || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ success: false, message: 'Corpo inválido' });
  }
  const ev = body.event;
  if (typeof ev !== 'string' || ev.trim() === '') {
    return res.status(400).json({ success: false, message: 'event inválido' });
  }

  try {
    logger.info('[client_analytics_event]', JSON.stringify(body));
  } catch (e) {
    console.error('[client_analytics_event] falha ao registrar:', e.message);
  }

  return res.status(200).json({ ok: true });
});

module.exports = router;
