#!/usr/bin/env node
'use strict';
/** Cria saque técnico via localhost (JWT de produção). Executar no Fly: /app */
const http = require('node:http');
const jwt = require('jsonwebtoken');

const TECH_USER_ID = process.env.P16C_TECH_USER_ID || '85872488-9e4c-42df-8978-7f9ef9f5cb00';
const EMAIL = process.env.P16C_TECH_EMAIL || 'validacao.pontaaponta.1775006321158@gmail.com';
/** P1.6ZA — default: indesconectavel@gmail.com (EMAIL). Override: P16C_PIX_KEY */
const PIX_KEY = process.env.P16C_PIX_KEY || 'indesconectavel@gmail.com';
const PIX_TYPE = process.env.P16C_PIX_TYPE || 'email';
const AMOUNT = Number(process.env.P16C_AMOUNT || 10);
const CORRELATION = process.env.P16C_CORRELATION_ID || `p16c-${require('node:crypto').randomUUID()}`;

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.log(JSON.stringify({ error: 'JWT_SECRET missing' }));
  process.exit(1);
}

const data = JSON.stringify({ valor: AMOUNT, chave_pix: PIX_KEY, tipo_chave: PIX_TYPE });
const token = jwt.sign({ userId: TECH_USER_ID, email: EMAIL }, secret, { expiresIn: '15m' });

const opts = {
  hostname: '127.0.0.1',
  port: Number(process.env.PORT || 8080),
  path: '/api/withdraw/request',
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-idempotency-key': CORRELATION,
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(opts, (res) => {
  let b = '';
  res.on('data', (c) => {
    b += c;
  });
  res.on('end', () => {
    let body = {};
    try {
      body = JSON.parse(b || '{}');
    } catch (_) {}
    console.log(JSON.stringify({ status: res.statusCode, body, correlationId: CORRELATION }));
    process.exit(res.statusCode === 200 && body.success ? 0 : 1);
  });
});
req.on('error', (e) => {
  console.log(JSON.stringify({ error: e.message }));
  process.exit(1);
});
req.write(data);
req.end();
