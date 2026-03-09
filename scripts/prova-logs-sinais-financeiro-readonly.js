/**
 * CICLO 1 READ-ONLY: Logs Fly — padrões [PAYOUT][WORKER], [RECON], [LEDGER], erros.
 * flyctl logs (fallback sem --since). Contagens + 20 linhas exemplares (sem tokens).
 * Salva docs/relatorios/ciclo1-logs-sinais.json
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const APP = process.env.FLY_APP || 'goldeouro-backend-v2';

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 20000, maxBuffer: 2 * 1024 * 1024, ...opts });
  } catch (e) {
    return (e.stdout || e.stderr || e.message || '') + '';
  }
}

function redact(line) {
  let s = (line || '')
    .replace(/\b(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g, '[JWT]')
    .replace(/\bBearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/\bAuthorization:\s*[^\s]+/gi, 'Authorization: [REDACTED]')
    .replace(/https?:\/\/[^\s"']+/g, '[URL]')
    .replace(/\b(sk|pk)_[a-zA-Z0-9]+/g, '[KEY]');
  return s.slice(0, 500);
}

const patterns = [
  { key: 'PAYOUT_WORKER', re: /\[PAYOUT\]|\[WORKER\]/i },
  { key: 'RECON', re: /\[RECON\]/i },
  { key: 'LEDGER', re: /\[LEDGER\]/i },
  { key: 'Erro_registrar_saque', re: /Erro ao registrar saque/i },
  { key: 'insert_falhou', re: /insert falhou/i },
  { key: 'updateSaqueStatus_indisponivel', re: /updateSaqueStatus|indisponível|indisponivel/i },
  { key: 'CHECK', re: /\bCHECK\b/i },
  { key: 'violates', re: /violates/i }
];

const raw = run(`flyctl logs -a ${APP} --no-tail 2>&1`);
const lines = raw.split(/\r?\n/).filter(Boolean);
const lastN = lines.slice(-300);

const counts = {};
patterns.forEach(p => { counts[p.key] = 0; });
const exemplares = [];

lastN.forEach(l => {
  const redacted = redact(l);
  patterns.forEach(p => {
    if (p.re.test(l)) {
      counts[p.key]++;
      if (exemplares.length < 20 && !exemplares.some(ex => ex.slice(0, 100) === redacted.slice(0, 100))) {
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
  exemplares_redigidas: exemplares.slice(0, 20)
};

const outPath = path.join(OUT_DIR, 'ciclo1-logs-sinais.json');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('OK ciclo1 logs sinais -> ' + outPath);
