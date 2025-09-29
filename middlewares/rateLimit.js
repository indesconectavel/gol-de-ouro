// middlewares/rateLimit.js - Rate Limit Middleware
const rateLimit = require('express-rate-limit');

module.exports = function buildRateLimit() {
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000); // 15m
  const max = Number(process.env.RATE_LIMIT_MAX || 200); // req por janela
  const message = { error: 'too_many_requests' };

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message,
    validate: { trustProxy: true },
    skipSuccessfulRequests: false,
  });
};
