/**
 * PRÉ-DEPLOY READ-ONLY: Validação por string checks do patch V1 (withdraw/ledger).
 * Não executa writes; apenas lê arquivos e verifica padrões.
 * Salva docs/relatorios/predeploy-simulate-logic-checks.json
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_PATH = path.join(ROOT, 'docs', 'relatorios', 'predeploy-simulate-logic-checks.json');

const checks = [
  {
    id: 'server_ledger_withdraw_request',
    name: "server-fly.js: tipo 'withdraw_request' no ledger",
    file: path.join(ROOT, 'server-fly.js'),
    pattern: /withdraw_request|'withdraw_request'/,
    pass: false
  },
  {
    id: 'server_ledger_valor_negativo',
    name: 'server-fly.js: valor negativo no ledger (-requestedAmount)',
    file: path.join(ROOT, 'server-fly.js'),
    pattern: /valor:\s*-\s*requestedAmount|-requestedAmount/,
    pass: false
  },
  {
    id: 'server_rollback_on_ledger_fail',
    name: 'server-fly.js: rollback quando ledger falha',
    file: path.join(ROOT, 'server-fly.js'),
    pattern: /!ledgerRequest\.success|rollbackWithdraw.*ledger|Erro ao registrar ledger/,
    pass: false
  },
  {
    id: 'worker_select_processando',
    name: 'processPendingWithdrawals: select inclui processando',
    file: path.join(ROOT, 'src', 'domain', 'payout', 'processPendingWithdrawals.js'),
    pattern: /PROCESSING|'processando'|processando/,
    pass: false
  },
  {
    id: 'worker_success_concluido',
    name: 'processPendingWithdrawals: sucesso -> concluido + processed_at + transacao_id',
    file: path.join(ROOT, 'src', 'domain', 'payout', 'processPendingWithdrawals.js'),
    pattern: /COMPLETED|concluido|processed_at|transacao_id/,
    pass: false
  },
  {
    id: 'worker_error_rejeitado',
    name: 'processPendingWithdrawals: erro -> rejeitado + motivo_rejeicao',
    file: path.join(ROOT, 'src', 'domain', 'payout', 'processPendingWithdrawals.js'),
    pattern: /REJECTED|rejeitado|motivo_rejeicao|rollbackWithdraw/,
    pass: false
  },
  {
    id: 'worker_idempotencia',
    name: 'processPendingWithdrawals: idempotência (ignora concluido/rejeitado)',
    file: path.join(ROOT, 'src', 'domain', 'payout', 'processPendingWithdrawals.js'),
    pattern: /COMPLETED|REJECTED|concluido|rejeitado|already_final|skipped/,
    pass: false
  },
  {
    id: 'logs_payout_saqueid',
    name: 'Log [PAYOUT] saqueId presente',
    file: path.join(ROOT, 'src', 'domain', 'payout', 'processPendingWithdrawals.js'),
    pattern: /\[PAYOUT\].*saqueId|saqueId.*slice/,
    pass: false
  },
  {
    id: 'logs_ledger_referencia',
    name: 'Log [LEDGER] referencia presente',
    file: path.join(ROOT, 'src', 'domain', 'payout', 'processPendingWithdrawals.js'),
    pattern: /\[LEDGER\].*referencia|referencia.*slice/,
    pass: false
  },
  {
    id: 'server_log_ledger_referencia',
    name: 'server-fly.js: log [LEDGER] referencia',
    file: path.join(ROOT, 'server-fly.js'),
    pattern: /\[LEDGER\].*referencia|referencia.*slice/,
    pass: false
  }
];

for (const c of checks) {
  try {
    const content = fs.readFileSync(c.file, 'utf8');
    c.pass = c.pattern.test(content);
  } catch (e) {
    c.pass = false;
    c.error = e.message;
  }
}

const allPass = checks.every(c => c.pass);
const report = {
  timestamp: new Date().toISOString(),
  overall: allPass ? 'pass' : 'fail',
  checks: checks.map(({ id, name, pass, error }) => ({ id, name, pass, error: error || null }))
};

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2), 'utf8');
console.log('OK predeploy logic checks -> ' + OUT_PATH);
process.exit(0);
