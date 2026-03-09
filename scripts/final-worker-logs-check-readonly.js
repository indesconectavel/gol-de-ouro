/**
 * READ-ONLY: Logs Fly — sinais [PAYOUT][WORKER], payouts_falha, [LEDGER], insert falhou,
 * updateSaqueStatus indisponível, CHECK/violates, Erro ao registrar saque.
 * Salva docs/relatorios/final-worker-logs-check.json
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const APP = process.env.FLY_APP || 'goldeouro-backend-v2';

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 25000, maxBuffer: 2 * 1024 * 1024, ...opts });
  } catch (e) {
    return (e.stdout || e.stderr || e.message || '') + '';
  }
}

function redact(line) {
  let s = (line || '')
    .replace(/\b(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g, '[JWT]')
    .replace(/\bBearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(sk|pk)_[a-zA-Z0-9]+/g, '[KEY]');
  return s.slice(0, 500);
}

const patterns = [
  { key: 'PAYOUT_WORKER', re: /\[PAYOUT\]|\[WORKER\]/i },
  { key: 'payouts_falha', re: /payouts_falha/i },
  { key: 'LEDGER', re: /\[LEDGER\]/i },
  { key: 'insert_falhou', re: /insert falhou/i },
  { key: 'updateSaqueStatus_indisponivel', re: /updateSaqueStatus|indisponível|indisponivel/i },
  { key: 'CHECK', re: /\bCHECK\b/i },
  { key: 'violates', re: /violates/i },
  { key: 'Erro_registrar_saque', re: /Erro ao registrar saque/i }
];

const raw = run(`flyctl logs -a ${APP} --no-tail 2>&1`);
const lines = raw.split(/\r?\n/).filter(Boolean);
const lastN = lines.slice(-500);

const counts = {};
patterns.forEach(p => { counts[p.key] = 0; });
const exemplares = [];

lastN.forEach(l => {
  const redacted = redact(l);
  patterns.forEach(p => {
    if (p.re.test(l)) {
      counts[p.key]++;
      if (exemplares.length < 25 && !exemplares.some(ex => ex.slice(0, 100) === redacted.slice(0, 100))) {
        exemplares.push(redacted);
      }
    }
  });
});

const report = {
  timestamp: new Date().toISOString(),
  app: APP,
  lines_analisadas: lastN.length,
  contagens: counts,
  exemplares_redigidas: exemplares.slice(0, 25)
};

const outPath = path.join(OUT_DIR, 'final-worker-logs-check.json');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('OK final worker logs -> ' + outPath);
