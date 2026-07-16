'use strict';



/**

 * PE.2E — smoke test local WebhookPayload Extraction (não toca produção/banco).

 * Executar: node scripts/pe2e-webhook-payload-smoke.mjs

 */



import assert from 'node:assert/strict';

import { createRequire } from 'node:module';



const require = createRequire(import.meta.url);



const {

  isWebhookPayload,

  createWebhookPayload,

  inferEventFields

} = require('../src/payment-engine/types/WebhookPayload');

const {

  webhookPayloadFromExpress,

  expressLikeFromWebhookPayload,

  coerceToWebhookPayload

} = require('../src/payment-engine/compat/webhookPayloadFromExpress');

const GdoWebhookHttpBridge = require('../src/payment-engine/bridges/http/GdoWebhookHttpBridge');

const { resolveWebhookIngress } = require('../src/finance/compat/resolveWebhookIngress');

const { coerceHttpLikeWebhookInput } = require('../src/finance/compat/coerceHttpLikeWebhookInput');

const { isAdapterBoundaryEnabled } = require('../src/payment-engine/boundary/adapter-boundary-config');

const { PaymentEngine } = require('../src/payment-engine');



const prevFlag = process.env.PE_ADAPTER_BOUNDARY_ENABLED;

process.env.PE_ADAPTER_BOUNDARY_ENABLED = 'false';



assert.equal(isAdapterBoundaryEnabled(), false);



const mockReq = {

  method: 'post',

  originalUrl: '/webhooks/asaas',

  headers: {

    'asaas-access-token': 'tok',

    'content-type': 'application/json',

    'x-request-id': 'req-1',

    'x-forwarded-for': '203.0.113.10, 10.0.0.1'

  },

  query: { ref: '1' },

  params: {},

  body: { event: 'PAYMENT_RECEIVED', payment: { id: 'pay_123' }, id: 'evt_9' },

  rawBody: '{"event":"PAYMENT_RECEIVED"}',

  ip: '127.0.0.1'

};



const payload = webhookPayloadFromExpress(mockReq, { provider: 'asaas' });

assert.equal(isWebhookPayload(payload), true);

assert.equal(payload.provider, 'asaas');

assert.equal(payload.method, 'POST');

assert.equal(payload.path, '/webhooks/asaas');

assert.equal(payload.headers['asaas-access-token'], 'tok');

assert.equal(payload.eventType, 'PAYMENT_RECEIVED');

assert.ok(payload.eventId);

assert.ok(payload.receivedAt);

assert.equal(payload.requestId, 'req-1');

assert.equal(payload.body.event, 'PAYMENT_RECEIVED');

assert.equal(payload.parsedBody.event, 'PAYMENT_RECEIVED');



const roundTrip = expressLikeFromWebhookPayload(payload);

assert.equal(roundTrip.method, 'POST');

assert.equal(roundTrip.body.event, 'PAYMENT_RECEIVED');

assert.equal(roundTrip.headers['asaas-access-token'], 'tok');



const coerced = coerceHttpLikeWebhookInput(payload);

assert.equal(coerced.body.event, 'PAYMENT_RECEIVED');

assert.equal(typeof coerced.get, 'undefined');



const legacyInput = GdoWebhookHttpBridge.buildProcessInput(mockReq, { provider: 'asaas' });

assert.equal(legacyInput.pe2e, false);

assert.ok(legacyInput.req);

assert.equal(legacyInput.webhookPayload, undefined);



process.env.PE_ADAPTER_BOUNDARY_ENABLED = 'true';

assert.equal(isAdapterBoundaryEnabled(), true);



const shadowInput = GdoWebhookHttpBridge.buildProcessInput(mockReq, {

  provider: 'asaas',

  deps: { financeLog() {} }

});

assert.equal(shadowInput.pe2e, true);

assert.ok(shadowInput.webhookPayload);

assert.equal(shadowInput.webhookPayload.provider, 'asaas');

assert.equal(shadowInput.body.event, 'PAYMENT_RECEIVED');

assert.equal(shadowInput.req, undefined);



const ingress = resolveWebhookIngress(shadowInput);

assert.equal(ingress.fromPayload, true);

assert.equal(ingress.body.payment.id, 'pay_123');

assert.equal(ingress.reqLike.headers['asaas-access-token'], 'tok');



const extracted = PaymentEngine.webhooks.extractPayload(mockReq, { provider: 'asaas' });

assert.equal(extracted.provider, 'asaas');



const mpBody = { type: 'payment', data: { id: '999' } };

const inferred = inferEventFields(mpBody);

assert.equal(inferred.eventType, 'payment');

assert.equal(inferred.eventId, '999');



const created = createWebhookPayload({

  provider: 'mercadopago',

  body: mpBody,

  headers: { 'x-signature': 'ab' }

});

assert.equal(created.provider, 'mercadopago');

assert.equal(created.parsedBody.type, 'payment');

assert.equal(coerceToWebhookPayload(created).provider, 'mercadopago');



if (prevFlag === undefined) delete process.env.PE_ADAPTER_BOUNDARY_ENABLED;

else process.env.PE_ADAPTER_BOUNDARY_ENABLED = prevFlag;



console.log('PE.2E webhook payload smoke: PASS');

