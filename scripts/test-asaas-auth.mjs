#!/usr/bin/env node
/**
 * Teste de autenticação/conectividade Asaas Sandbox — GET /myAccount
 *
 * Modo live (HTTP real): ASAAS_TEST_LIVE=1 no .env ou shell + ASAAS_API_KEY.
 * Default determinístico: baseline seguro → SKIP.
 */
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyAuthLiveProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);

const { snapshot, liveMode } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

function printResult(result, extra = {}) {
  console.log(JSON.stringify({ ...result, ...extra }, null, 2));
}

function finishSkip(message, extra = {}) {
  printResult(
    {
      result: 'SKIP',
      ok: false,
      httpCalled: false,
      message,
      liveMode
    },
    extra
  );
  restoreEnv();
  process.exit(0);
}

if (liveMode) {
  applyAuthLiveProfile();
}

clearAsaasModuleCache(require);

const guards = readAsaasGuards();

if (!liveMode) {
  finishSkip(
    'Modo determinístico: ASAAS_TEST_LIVE≠1. Baseline seguro aplicado; nenhuma chamada HTTP.',
    { guards }
  );
}

if (!guards.asaasEnabled) {
  finishSkip('Asaas desabilitado (ASAAS_ENABLED=false). Nenhuma chamada HTTP foi executada.', {
    guards
  });
}

if (!guards.sandboxAuthAllowed) {
  finishSkip(
    'Bloqueado por segurança (ALLOW_ASAAS_SANDBOX_AUTH=0). Nenhuma chamada HTTP foi executada.',
    { guards, hint: 'Defina ALLOW_ASAAS_SANDBOX_AUTH=1 apenas em ambiente local/homologação.' }
  );
}

if (!guards.sandboxEnv) {
  finishSkip('Ambiente não é sandbox (ASAAS_ENV≠sandbox). Nenhuma chamada HTTP foi executada.', {
    guards
  });
}

if (!guards.hasApiKey) {
  finishSkip('ASAAS_API_KEY ausente. Nenhuma chamada HTTP foi executada.', { guards });
}

if (guards.pixInEnabled || guards.sandboxPixInAllowed) {
  finishSkip('PIX IN flags devem estar desligadas neste script.', { guards });
}

const { fetchMyAccount, maskApiKeyPreview } = require('../src/finance/providers/asaas/asaas-http-client');
const { getAsaasBaseUrl } = require('../src/finance/providers/asaas/asaas-config');

printResult({
  step: 'asaas_auth_sandbox_start',
  guards,
  liveMode,
  baseUrl: getAsaasBaseUrl(),
  apiKeyPreview: maskApiKeyPreview(process.env.ASAAS_API_KEY)
});

const result = await fetchMyAccount();

if (!result.success) {
  printResult({
    result: 'FAIL',
    ok: false,
    httpCalled: true,
    error: result.error,
    message: result.message,
    httpStatus: result.httpStatus ?? null,
    errorCode: result.errorCode ?? null
  });
  restoreEnv();
  process.exit(2);
}

printResult({
  result: 'PASS',
  ok: true,
  httpCalled: true,
  httpStatus: result.httpStatus,
  baseUrl: result.baseUrl,
  account: result.account,
  apiKeyPreview: maskApiKeyPreview(process.env.ASAAS_API_KEY)
});

restoreEnv();
