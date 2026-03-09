/**
 * AUDITORIA READ-ONLY: Mapa de todas as escritas em saldo/saques/ledger/pagamentos_pix/transacoes.
 * Scan por regex nos arquivos .js (exceto node_modules e scripts de auditoria).
 * Gera docs/relatorios/auditoria-map-escritas-financeiro-YYYY-MM-DD.json
 */
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'docs', 'relatorios');
const TS = new Date().toISOString().slice(0, 10);

const TABLES = ['usuarios', 'users', 'pagamentos_pix', 'saques', 'ledger_financeiro', 'transacoes'];
const COLS = ['saldo', 'balance', 'status', 'amount', 'valor', 'updated_at', 'processed_at', 'transacao_id', 'payment_id', 'external_id', 'correlation_id', 'referencia'];

function* walk(dir, ext = '.js') {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name === '.git' || e.name.startsWith('.')) continue;
    if (path.basename(dir) === 'goldeouro-player') continue;
    if (e.isDirectory()) yield* walk(full, ext);
    else if (e.isFile() && full.endsWith(ext)) yield full;
  }
}

const patterns = [
  { re: /\.from\s*\(\s*['"]usuarios['"]\s*\)[\s\S]*?\.(update|insert|upsert)\s*\(/gi, tipo: 'usuarios', tabela: 'usuarios' },
  { re: /\.from\s*\(\s*['"]pagamentos_pix['"]\s*\)[\s\S]*?\.(update|insert|upsert)\s*\(/gi, tipo: 'pagamentos_pix', tabela: 'pagamentos_pix' },
  { re: /\.from\s*\(\s*['"]saques['"]\s*\)[\s\S]*?\.(update|insert|upsert)\s*\(/gi, tipo: 'saques', tabela: 'saques' },
  { re: /\.from\s*\(\s*['"]ledger_financeiro['"]\s*\)[\s\S]*?\.(update|insert|upsert)\s*\(/gi, tipo: 'ledger', tabela: 'ledger_financeiro' },
  { re: /\.from\s*\(\s*['"]transacoes['"]\s*\)[\s\S]*?\.(update|insert|upsert)\s*\(/gi, tipo: 'transacoes', tabela: 'transacoes' },
  { re: /\.update\s*\(\s*[^)]*saldo/gi, tipo: 'saldo_update', tabela: 'usuarios' },
  { re: /\.update\s*\(\s*[^)]*balance/gi, tipo: 'balance_update', tabela: 'users' },
];

const tipoLabels = {
  deposito: 'depósito',
  saque: 'saque',
  premio: 'prêmio',
  login: 'login',
  registro: 'registro',
  reconcile: 'reconcile',
  webhook: 'webhook',
  worker: 'worker',
  rollback: 'rollback',
  payout: 'payout'
};

function inferTipo(filePath, line) {
  const lower = (filePath + ' ' + line).toLowerCase();
  if (lower.includes('webhook')) return 'webhook';
  if (lower.includes('reconcil') || lower.includes('recon ')) return 'reconcile';
  if (lower.includes('payout') || lower.includes('processpending') || lower.includes('payout-worker')) return 'worker';
  if (lower.includes('rollback')) return 'rollback';
  if (lower.includes('pagamentos_pix') && lower.includes('insert')) return 'depósito';
  if (lower.includes('saques') && lower.includes('update')) return 'saque';
  if (lower.includes('ledger_financeiro') && lower.includes('insert')) return 'saque';
  if (lower.includes('saldo') && lower.includes('usuarios')) return 'depósito';
  if (lower.includes('transacoes') && lower.includes('insert')) return 'premio';
  if (lower.includes('register') || lower.includes('registro')) return 'registro';
  return 'outro';
}

const results = [];

for (const file of walk(ROOT)) {
  const rel = path.relative(ROOT, file);
  if (rel.includes('audit-') && rel.includes('readonly')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const p of patterns) {
    p.re.lastIndex = 0;
    let m;
    while ((m = p.re.exec(content)) !== null) {
      const lineNum = content.slice(0, m.index).split(/\r?\n/).length;
      const line = lines[lineNum - 1] || '';
      results.push({
        arquivo: rel,
        linha_aproximada: lineNum,
        tipo: inferTipo(file, line),
        tabela_coluna: p.tabela,
        operacao: m[1] || 'update/insert'
      });
    }
  }
}

const uniq = [];
const seen = new Set();
for (const r of results) {
  const key = `${r.arquivo}:${r.linha_aproximada}:${r.tabela_coluna}`;
  if (seen.has(key)) continue;
  seen.add(key);
  uniq.push(r);
}

const report = {
  timestamp: new Date().toISOString(),
  total_escritas: uniq.length,
  por_tipo: {},
  por_tabela: {},
  escritas: uniq
};

uniq.forEach(r => {
  report.por_tipo[r.tipo] = (report.por_tipo[r.tipo] || 0) + 1;
  report.por_tabela[r.tabela_coluna] = (report.por_tabela[r.tabela_coluna] || 0) + 1;
});

const outPath = path.join(OUT_DIR, `auditoria-map-escritas-financeiro-${TS}.json`);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log('OK map escritas -> ' + outPath);
