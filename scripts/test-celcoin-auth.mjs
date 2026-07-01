#!/usr/bin/env node
/**
 * Teste OAuth sandbox Celcoin — POST /v5/token
 *
 * Uso:
 *   ALLOW_CELCOIN_SANDBOX_AUTH=1 CELCOIN_ENABLED=true CELCOIN_HTTP_ENABLED=true \
 *     CELCOIN_CLIENT_ID=... CELCOIN_CLIENT_SECRET=... \
 *     node scripts/test-celcoin-auth.mjs
 *
 * Opcional: CELCOIN_BASE_URL=https://sandbox.openfinance.celcoin.dev
 * Carrega .env local se existir (dotenv).
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';

dotenv.config();

const require = createRequire(import.meta.url);

function fail(message, extra = {}) {
  console.error(JSON.stringify({ ok: false, error: message, ...extra }, null, 2));
  process.exit(1);
}

if (process.env.ALLOW_CELCOIN_SANDBOX_AUTH !== '1') {
  fail('Bloqueado por segurança. Defina ALLOW_CELCOIN_SANDBOX_AUTH=1 para executar auth sandbox.', {
    hint: 'Nunca habilite CELCOIN_HTTP_ENABLED em produção sem homologação.'
  });
}

if (String(process.env.CELCOIN_ENABLED || '').toLowerCase() !== 'true') {
  fail('CELCOIN_ENABLED deve ser true');
}

if (String(process.env.CELCOIN_HTTP_ENABLED || '').toLowerCase() !== 'true') {
  fail('CELCOIN_HTTP_ENABLED deve ser true');
}

if (!process.env.CELCOIN_CLIENT_ID || !process.env.CELCOIN_CLIENT_SECRET) {
  fail('CELCOIN_CLIENT_ID e CELCOIN_CLIENT_SECRET são obrigatórios');
}

const { maskTokenPreview } = require('../src/finance/providers/celcoin/celcoin-http-client');
const CelcoinProvider = require('../src/finance/providers/celcoin/CelcoinProvider');

console.log(
  JSON.stringify(
    {
      step: 'celcoin_auth_sandbox_start',
      celcoinEnabled: true,
      httpEnabled: true,
      authBaseUrl: process.env.CELCOIN_BASE_URL || 'https://sandbox.openfinance.celcoin.dev'
    },
    null,
    2
  )
);

const result = await CelcoinProvider.authenticate();

if (!result.success) {
  console.error(JSON.stringify({ ok: false, ...result }, null, 2));
  process.exit(2);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      tokenPreview: maskTokenPreview(result.accessToken),
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      cached: result.cached === true,
      authBaseUrl: result.authBaseUrl
    },
    null,
    2
  )
);
