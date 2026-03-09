/**
 * READ-ONLY: Logs Fly correlacionados a PAYOUT/WORKER e sinais de falha.
 * Salva docs/relatorios/payout-rootcause-worker-logs.json
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const APP = process.env.FLY_APP || 'goldeouro-backend-v2';

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 25000, maxBuffer: 3 * 1024 * 1024, ...opts });
  } catch (e) {
    return (e.stdout || e.stderr || e.message || '') + '';
  }
}

function redact(line) {
  return (line || '')
    .replace(/\b(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/g, '[JWT]')
    .replace(/\bBearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(sk|pk|APP_USR)[^\s]*/gi, '[TOKEN]')
    .slice(0, 600);
}

const patterns = [
  { key: 'PAYOUT_WORKER', re: /\[PAYOUT\]|\[WORKER\]/i },
  { key: 'payouts_falha', re: /payouts_falha/i },
  { key: 'erro_mp', re: /erro.*mercadopago|mercadopago.*erro|api\.mercadopago|v1\/transfers/i },
  { key: 'timeout', re: /timeout|ETIMEDOUT/i },
  { key: 'LEDGER', re: /\[LEDGER\]/i },
  { key: 'insert_falhou', re: /insert falhou/i },
  { key: 'CHECK', re: /\bCHECK\b/i },
  { key: 'violates', re: /violates/i },
  { key: 'processando', re: /processando/i },
  { key: 'concluido', re: /concluido|concluído/i },
  { key: 'rejeitado', re: /rejeitado/i },
  { key: 'updateSaqueStatus', re: /updateSaqueStatus|atualizar status/i },
  { key: 'transacao_id', re: /transacao_id|transacao id/i },
  { key: 'processed_at', re: /processed_at/i },
  { key: 'ROLLBACK', re: /ROLLBACK|rollback/i },
  { key: 'FALHOU', re: /FALHOU|falhou/i },
  { key: 'Nenhum saque', re: /Nenhum saque/i },
  { key: 'Payout iniciado', re: /Payout iniciado/i },
  { key: 'Saque selecionado', re: /Saque selecionado/i }
];

const raw = run(`flyctl logs -a ${APP} --no-tail 2>&1`);
const lines = raw.split(/\r?\n/).filter(Boolean);
const lastN = lines.slice(-800);

const counts = {};
patterns.forEach(p => { counts[p.key] = 0; });
const relevantLines = [];

lastN.forEach(l => {
  patterns.forEach(p => {
    if (p.re.test(l)) {
      counts[p.key]++;
      if (relevantLines.length < 50 && !relevantLines.some(ex => ex.raw?.slice(0, 80) === l.slice(0, 80))) {
        relevantLines.push({ raw: redact(l), ts: l.match(/^\s*\[?(\d{4}-\d{2}-\d{2}T[^\s]+)/)?.[1] || null });
      }
    }
  });
});

let conclusaoFalha = 'indefinida';
if (counts['payouts_falha'] > 0 && counts['Nenhum saque'] > 0) {
  conclusaoFalha = 'worker_roda_mas_nao_processa_ou_retorna_sem_saque';
} else if (counts['ROLLBACK'] > 0 || counts['FALHOU'] > 0) {
  conclusaoFalha = 'payout_falha_ou_rollback_acionado';
} else if (counts['erro_mp'] > 0 || counts['timeout'] > 0) {
  conclusaoFalha = 'erro_mp_ou_timeout';
} else if (counts['insert_falhou'] > 0 || counts['violates'] > 0 || counts['CHECK'] > 0) {
  conclusaoFalha = 'falha_banco_ledger_ou_constraint';
}

const report = {
  timestamp: new Date().toISOString(),
  app: APP,
  lines_analisadas: lastN.length,
  contagens: counts,
  linhas_relevantes: relevantLines.slice(0, 30),
  conclusao_falha_mais_provavel: conclusaoFalha
};

const outPath = path.join(OUT_DIR, 'payout-rootcause-worker-logs.json');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('OK payout rootcause worker logs -> ' + outPath);
