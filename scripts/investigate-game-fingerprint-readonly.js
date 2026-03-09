/**
 * READ-ONLY: Fingerprint de /game e /dashboard (status, headers, HTML truncado, sha256).
 * Uso: OUT_FILE=docs/relatorios/game-fingerprint-before.json node scripts/investigate-game-fingerprint-readonly.js
 * Não imprime segredos.
 */
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const BASE = process.env.GAME_BASE_URL || 'https://www.goldeouro.lol';
const OUT_FILE = process.env.OUT_FILE || path.join(__dirname, '..', 'docs', 'relatorios', 'game-fingerprint-now.json');
const MAX_HTML_CHARS = 40000;

const HEADERS_TO_CAPTURE = [
  'server', 'cache-control', 'x-vercel-id', 'x-matched-path', 'location',
  'x-vercel-cache', 'content-type', 'x-deployment-id', 'x-request-id'
];

async function fetchUrl(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'GolDeOuro-Investigation-ReadOnly/1.0' }
  });
  const html = await res.text();
  const headers = {};
  HEADERS_TO_CAPTURE.forEach(h => {
    const v = res.headers.get(h);
    if (v) headers[h] = v;
  });
  return {
    status: res.status,
    url: res.url,
    headers,
    html_length: html.length,
    html_preview: html.slice(0, MAX_HTML_CHARS),
    sha256: crypto.createHash('sha256').update(html).digest('hex')
  };
}

async function run() {
  const report = {
    timestamp: new Date().toISOString(),
    base_url: BASE,
    endpoints: {}
  };
  for (const p of ['/game', '/dashboard']) {
    const url = BASE + p;
    try {
      report.endpoints[p] = await fetchUrl(url);
    } catch (e) {
      report.endpoints[p] = { error: e.message, status: 0 };
    }
  }
  const outDir = path.dirname(OUT_FILE);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK fingerprint -> ' + OUT_FILE);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
