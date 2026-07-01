#!/usr/bin/env node
/**
 * F4.2F — Validação live/sandbox de webhook Asaas (classificação only).
 *
 * Modo live: ASAAS_WEBHOOK_LIVE_TEST=1 ALLOW_ASAAS_SANDBOX_WEBHOOK=1 ASAAS_WEBHOOK_ENABLED=true
 * Payload real opcional: ASAAS_WEBHOOK_PAYLOAD_FILE=tmp/asaas-webhook-payload.json
 */
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import dotenv from 'dotenv';
import {
  bootstrapAsaasTestEnv,
  installExitRestore,
  applyWebhookLiveProfile,
  readAsaasGuards,
  clearAsaasModuleCache
} from './helpers/asaas-test-env.mjs';

const require = createRequire(import.meta.url);

const { snapshot } = bootstrapAsaasTestEnv(dotenv);
const restoreEnv = installExitRestore(snapshot);

const { DECISION, ASAAS_WEBHOOK_AUTH_HEADER, isValidDecision } = require('../src/finance/providers/asaas/asaas-webhook-validator');
const { handleAsaasWebhook } = require('../src/finance/providers/asaas/asaas-webhook-handler');

const WEBHOOK_TOKEN = 'whsec_goldeouro_sandbox_live_test';
const results = [];

function record(name, result, expectDecision = null) {
  const decisionOk =
    expectDecision == null
      ? isValidDecision(result.decision)
      : result.decision === expectDecision;
  const ok = result.financialEffect === false && decisionOk;
  results.push({ name, ok, decision: result.decision, financialEffect: result.financialEffect });
  if (!ok) {
    console.error(`FAIL ${name}`, JSON.stringify(result, null, 2));
    process.exitCode = 1;
  } else {
    console.log(`OK ${name} → ${result.decision}`);
  }
  return result;
}

function samplePaymentCreatedPayload() {
  return {
    id: 'evt_f42f_payment_created_sim',
    event: 'PAYMENT_CREATED',
    payment: {
      id: 'pay_xchnwrdb321lqggq',
      status: 'PENDING',
      value: 5,
      billingType: 'PIX',
      externalReference: 'goldeouro-f4.2e-live-sample'
    }
  };
}

function loadRealPayload() {
  const file = process.env.ASAAS_WEBHOOK_PAYLOAD_FILE;
  if (!file || !existsSync(file)) {
    return { provided: false, payload: null, source: null };
  }
  const raw = readFileSync(file, 'utf8');
  return { provided: true, payload: JSON.parse(raw), source: file };
}

clearAsaasModuleCache(require);

console.log(JSON.stringify({ step: 'asaas_webhook_live_start', phase: 'F4.2F', guards: readAsaasGuards() }, null, 2));

record(
  'disabled webhook',
  await handleAsaasWebhook({
    headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
    body: samplePaymentCreatedPayload()
  }),
  DECISION.IGNORED_DISABLED
);

applyWebhookLiveProfile({ webhookToken: WEBHOOK_TOKEN });
clearAsaasModuleCache(require);
const { handleAsaasWebhook: handleLive } = require('../src/finance/providers/asaas/asaas-webhook-handler');

record(
  'invalid payload',
  await handleLive({
    headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
    body: {}
  }),
  DECISION.INVALID_PAYLOAD
);

record(
  'invalid token',
  await handleLive({
    headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: 'whsec_wrong_token' },
    body: samplePaymentCreatedPayload()
  }),
  DECISION.INVALID_SIGNATURE_OR_TOKEN
);

record(
  'unknown event',
  await handleLive({
    headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
    body: { id: 'evt_unknown', event: 'CUSTOM_UNKNOWN_EVENT' }
  }),
  DECISION.IGNORED_UNKNOWN_EVENT
);

record(
  'payment created simulated',
  await handleLive({
    headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
    body: samplePaymentCreatedPayload()
  }),
  DECISION.VALID_SANDBOX_PAYMENT_EVENT
);

record(
  'transfer done simulated',
  await handleLive({
    headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
    body: {
      id: 'evt_f42f_transfer_done_sim',
      event: 'TRANSFER_DONE',
      transfer: { id: 'tr_sandbox_sample', status: 'DONE', value: 5 }
    }
  }),
  DECISION.VALID_SANDBOX_TRANSFER_EVENT
);

const PRIORITY_PAYMENT_EVENTS = [
  'PAYMENT_CREATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_UPDATED',
  'PAYMENT_DELETED',
  'PAYMENT_REFUNDED',
  'PAYMENT_OVERDUE'
];

const PRIORITY_TRANSFER_EVENTS = [
  'TRANSFER_CREATED',
  'TRANSFER_PENDING',
  'TRANSFER_DONE',
  'TRANSFER_FAILED',
  'TRANSFER_CANCELLED'
];

for (const event of PRIORITY_PAYMENT_EVENTS) {
  record(
    `priority payment ${event}`,
    await handleLive({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
      body: {
        id: `evt_f42f_${event.toLowerCase()}`,
        event,
        payment: { id: 'pay_priority_sample', status: 'PENDING', value: 5 }
      }
    }),
    DECISION.VALID_SANDBOX_PAYMENT_EVENT
  );
}

for (const event of PRIORITY_TRANSFER_EVENTS) {
  record(
    `priority transfer ${event}`,
    await handleLive({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
      body: {
        id: `evt_f42f_${event.toLowerCase()}`,
        event,
        transfer: { id: 'tr_priority_sample', status: event.replace('TRANSFER_', ''), value: 5 }
      }
    }),
    DECISION.VALID_SANDBOX_TRANSFER_EVENT
  );
}

const realPayload = loadRealPayload();
let realPayloadStatus = 'not provided';

if (realPayload.provided) {
  realPayloadStatus = 'loaded';
  record(
    'real payload file',
    await handleLive({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
      body: realPayload.payload
    }),
    null
  );
} else {
  record(
    'f4.2e payment pending simulated (realistic)',
    await handleLive({
      headers: { [ASAAS_WEBHOOK_AUTH_HEADER]: WEBHOOK_TOKEN },
      body: {
        id: 'evt_f42f_f4_2e_pending',
        event: 'PAYMENT_RECEIVED',
        payment: {
          id: 'pay_xchnwrdb321lqggq',
          status: 'PENDING',
          value: 5,
          billingType: 'PIX',
          externalReference: 'goldeouro-f4.2e-live-1782588872885'
        }
      }
    }),
    DECISION.VALID_SANDBOX_PAYMENT_EVENT
  );
}

const allOk = results.every((r) => r.ok);
const summary = {
  result: allOk ? 'PASS' : 'FAIL',
  ok: allOk,
  phase: 'F4.2F',
  realPayload: realPayloadStatus,
  realPayloadSource: realPayload.source,
  priorityPaymentEvents: PRIORITY_PAYMENT_EVENTS,
  priorityTransferEvents: PRIORITY_TRANSFER_EVENTS,
  scenarios: results,
  header: ASAAS_WEBHOOK_AUTH_HEADER,
  financialEffect: false,
  publicRouteEnabled: false
};

console.log(JSON.stringify(summary, null, 2));

restoreEnv();
process.exit(allOk ? 0 : 2);
