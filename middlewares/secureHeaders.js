// middlewares/secureHeaders.js - Secure Headers Middleware
const helmet = require('helmet');

// Ajuste de CSP simples para SPA/API (relaxe se precisar carregar de CDNs)
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"], // ajuste se remover inline
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", "data:", "https:"],
  connectSrc: ["'self'", "https:"], // inclua seu backend se necessário
  fontSrc: ["'self'", "data:"],
  objectSrc: ["'none'"],
  frameAncestors: ["'self'"],
  baseUri: ["'self'"],
};

module.exports = helmet({
  contentSecurityPolicy: { useDefaults: true, directives: cspDirectives },
  frameguard: { action: 'sameorigin' },
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
  noSniff: true,
  hidePoweredBy: true,
  crossOriginResourcePolicy: { policy: 'same-origin' },
});
