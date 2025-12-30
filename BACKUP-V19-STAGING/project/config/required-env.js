// Validação de variáveis de ambiente obrigatórias
// Uso: assertRequiredEnv(['JWT_SECRET', 'SUPABASE_URL', ...], { onlyInProduction: ['MERCADOPAGO_ACCESS_TOKEN'] })

'use strict';

function isProduction() {
  return (process.env.NODE_ENV || '').toLowerCase() === 'production';
}

function assertRequiredEnv(requiredKeys = [], options = {}) {
  const { onlyInProduction = [] } = options || {};

  const missing = [];

  for (const key of requiredKeys) {
    if (!process.env[key] || String(process.env[key]).trim() === '') {
      missing.push(key);
    }
  }

  if (isProduction()) {
    for (const key of onlyInProduction) {
      if (!process.env[key] || String(process.env[key]).trim() === '') {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente ausentes: ${missing.join(', ')}`);
  }
}

module.exports = { assertRequiredEnv, isProduction };


