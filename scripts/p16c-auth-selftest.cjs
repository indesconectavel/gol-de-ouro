#!/usr/bin/env node
'use strict';
/**
 * P1.6E — testes locais do módulo p16c-admin-auth (sem PIX, sem gates).
 */
const assert = require('node:assert/strict');
const {
  parseFlyJwtSecretOutput,
  parseFlyJwtSecretFromStreams,
  isKnownWindowsFlySshTeardownNoise,
  hasCriticalFlySshFailure,
  signAdminJwt,
  verifyAdminJwtLocally
} = require('./lib/p16c-admin-auth.cjs');

const MOCK_SECRET = 'a'.repeat(64);
const MOCK_FLY_OUT = `Connecting to fdaa:2b:dbd4:a7b:136:816:f1b3:2...
${MOCK_SECRET}
Error: Identificador inválido.`;

function testParseFlyOutput() {
  const parsed = parseFlyJwtSecretOutput(MOCK_FLY_OUT);
  assert.equal(parsed, MOCK_SECRET);
  assert.equal(parseFlyJwtSecretOutput('Error: fail\n'), null);
  console.log('OK parseFlyJwtSecretOutput');
}

function testSignVerify() {
  const actor = { id: '11111111-1111-1111-1111-111111111111', email: 'admin@test.local', tipo: 'admin' };
  const token = signAdminJwt(actor, MOCK_SECRET);
  assert.ok(token.length > 40);
  const claims = verifyAdminJwtLocally(token, MOCK_SECRET, actor);
  assert.equal(claims.userId, actor.id);
  console.log('OK signAdminJwt + verifyAdminJwtLocally');
}

function testRejectErrorLines() {
  assert.equal(
    parseFlyJwtSecretOutput('Error: host unavailable at JWT_SECRET: host was not found in DNS'),
    null
  );
  console.log('OK rejeita linha de erro fly ssh (DNS/host unavailable)');
}

function testStdoutWithWindowsTeardown() {
  const secret = parseFlyJwtSecretFromStreams(MOCK_SECRET, 'Error: Identificador inválido.');
  assert.equal(secret, MOCK_SECRET);
  assert.equal(
    isKnownWindowsFlySshTeardownNoise('Connecting to fdaa:…\nError: Identificador inválido.'),
    true
  );
  assert.equal(hasCriticalFlySshFailure('', 'Error: host unavailable at JWT_SECRET'), true);
  console.log('OK stdout válido + teardown Windows ignorável');
}

testParseFlyOutput();
testSignVerify();
testRejectErrorLines();
testStdoutWithWindowsTeardown();
console.log('###P16E_AUTH_SELFTEST###PASS');
