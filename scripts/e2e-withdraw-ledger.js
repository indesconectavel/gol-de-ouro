/**
 * E2E automatizado: saque/ledger em produção.
 * Gera relatório em docs/relatorios/E2E-WITHDRAW-LEDGER-AUTO-<date>-<time>.md
 * NUNCA imprime BEARER/JWT nem PIX_KEY completa.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const RUN_ID = `e2e-${Date.now()}`;
const TIMESTAMP_ISO = new Date().toISOString();
const REPORT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const DATE_PART = new Date().toISOString().slice(0, 10);
const TIME_PART = new Date().toTimeString().slice(0, 8).replace(/:/g, '');
const REPORT_FILE = path.join(REPORT_DIR, `E2E-WITHDRAW-LEDGER-AUTO-${DATE_PART}-${TIME_PART}.md`);

const sections = [];

function head(url) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { hostname: u.hostname, port: u.port || 443, path: u.pathname || '/', method: 'HEAD' };
    const req = https.request(opts, (res) => {
      resolve({ statusCode: res.statusCode, statusMessage: res.statusMessage });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function exec(cmd, opts = {}) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', timeout: 60000, ...opts });
    return { ok: true, out: (out || '').trim() };
  } catch (e) {
    return { ok: false, out: (e.stdout || '').trim(), err: (e.stderr || '').trim() };
  }
}

let flyctlSinceSupported = true;

function flyLogsWithFallback(machineId, label) {
  const app = 'goldeouro-backend-v2';
  if (!flyctlSinceSupported) {
    const r = exec(`flyctl logs -a ${app} --machine ${machineId} --no-tail`, { timeout: 20000 });
    const outRaw = (r.out || '') + (r.err || '');
    return { outRaw, usedSince: false, fallbackReason: 'unknown flag: --since' };
  }
  const r = exec(`flyctl logs -a ${app} --machine ${machineId} --no-tail --since 15m`, { timeout: 20000 });
  const combined = (r.out || '') + (r.err || '');
  if (!r.ok && /unknown flag:\s*--since/i.test(combined)) {
    flyctlSinceSupported = false;
    const fallback = exec(`flyctl logs -a ${app} --machine ${machineId} --no-tail`, { timeout: 20000 });
    const outRaw = (fallback.out || '') + (fallback.err || '');
    return { outRaw, usedSince: false, fallbackReason: 'unknown flag: --since' };
  }
  return { outRaw: combined, usedSince: true };
}

function assertEnvs() {
  const bearer = process.env.BEARER;
  const pix = process.env.PIX_KEY;
  const pixType = process.env.PIX_KEY_TYPE;
  const amount = process.env.WITHDRAW_AMOUNT;
  return {
    BEARER: bearer && String(bearer).startsWith('Bearer ') ? 'OK' : 'MISSING',
    PIX_KEY: pix ? 'OK' : 'MISSING',
    PIX_KEY_TYPE: pixType != null ? pixType : 'MISSING',
    WITHDRAW_AMOUNT: amount != null ? amount : 'MISSING'
  };
}

function parseFlyStatus(stdout) {
  const lines = (stdout || '').split('\n');
  let version = '';
  let image = '';
  const machines = [];
  for (const line of lines) {
    const m = line.match(/\b(VERSION|Image)\s*[=:\s]+\s*(.+)/i);
    if (m) {
      if (m[1].toUpperCase() === 'VERSION') version = m[2].trim();
      if (m[1].toLowerCase() === 'image') image = m[2].trim();
    }
    const tab = line.split(/\t/);
    if (tab.length >= 4 && (tab[0].includes('app') || tab[0].includes('payout_worker'))) {
      const processName = tab[0].trim();
      const id = tab[1] ? tab[1].trim() : '';
      const ver = tab[2] ? tab[2].trim() : '';
      const state = tab[3] ? tab[3].trim() : '';
      if (id) machines.push({ process: processName, id, version: ver, state });
    }
  }
  return { version, image, machines };
}

function filterLogLines(text, keywords) {
  const k = keywords.map(x => x.toLowerCase());
  return (text || '').split('\n').filter(line => {
    const l = line.toLowerCase();
    return k.some(w => l.includes(w));
  });
}

function countInText(text, phrase) {
  const t = (text || '').toLowerCase();
  const p = phrase.toLowerCase();
  let n = 0;
  let i = t.indexOf(p);
  while (i !== -1) { n++; i = t.indexOf(p, i + 1); }
  return n;
}

async function main() {
  sections.push(`# E2E Withdraw/Ledger — Automação\n\n**RunId:** ${RUN_ID}  \n**Timestamp:** ${TIMESTAMP_ISO}\n\n---\n\n## 1. Contexto e objetivo\n\nExecução automática do fluxo de saque/ledger em produção: precheck, health, fly status, env assert, execução do saque (create-test-withdraw-live.js), coleta de logs e decisão PASS/FAIL/INCONCLUSIVO.\n`);

  // A) Precheck frontend
  sections.push('## 2. Precheck frontend\n');
  let homeStatus = '';
  let gameStatus = '';
  try {
    const r1 = await head('https://www.goldeouro.lol/');
    homeStatus = `HTTP ${r1.statusCode} ${r1.statusMessage || ''}`.trim();
  } catch (e) {
    homeStatus = `Erro: ${(e.message || 'unknown')}`;
  }
  try {
    const r2 = await head('https://www.goldeouro.lol/game');
    gameStatus = `HTTP ${r2.statusCode} ${r2.statusMessage || ''}`.trim();
  } catch (e) {
    gameStatus = `Erro: ${(e.message || 'unknown')}`;
  }
  sections.push(`| URL | Status |\n|-----|--------|\n| https://www.goldeouro.lol/ | ${homeStatus} |\n| https://www.goldeouro.lol/game | ${gameStatus} |\n\n`);

  // B) Backend health
  sections.push('## 3. Health backend\n');
  let healthStatus = '';
  try {
    const r = await head('https://goldeouro-backend-v2.fly.dev/health');
    healthStatus = `HTTP ${r.statusCode} ${r.statusMessage || ''}`.trim();
  } catch (e) {
    healthStatus = `Erro: ${(e.message || 'unknown')}`;
  }
  sections.push(`| URL | Status |\n|-----|--------|\n| https://goldeouro-backend-v2.fly.dev/health | ${healthStatus} |\n\n`);

  // C) Fly status
  sections.push('## 4. Fly status\n');
  const flyResult = exec('flyctl status -a goldeouro-backend-v2');
  if (!flyResult.ok && flyResult.err && (flyResult.err.includes('not found') || flyResult.err.includes('command not found'))) {
    sections.push('flyctl não disponível. Registro: flyctl missing.\n\n');
  } else {
    const parsed = parseFlyStatus(flyResult.out + '\n' + (flyResult.err || ''));
    sections.push(`- **VERSION:** ${parsed.version || '(não parseado)'}\n`);
    sections.push(`- **IMAGE:** ${parsed.image || '(não parseado)'}\n`);
    sections.push(`- **Machines:**\n`);
    parsed.machines.forEach(m => {
      sections.push(`  - ${m.process} ${m.id} | version ${m.version} | ${m.state}\n`);
    });
    sections.push('\n');
  }

  // D) Assert envs
  const envState = assertEnvs();
  sections.push('## 5. Env assert\n');
  sections.push(`- BEARER: ${envState.BEARER}\n`);
  sections.push(`- PIX_KEY: ${envState.PIX_KEY}\n`);
  sections.push(`- PIX_KEY_TYPE: ${envState.PIX_KEY_TYPE}\n`);
  sections.push(`- WITHDRAW_AMOUNT: ${envState.WITHDRAW_AMOUNT}\n\n`);

  // E) Exec saque
  sections.push('## 6. Exec do saque\n');
  const scriptPath = path.join(__dirname, 'create-test-withdraw-live.js');
  const execResult = exec(`node "${scriptPath}"`);
  let statusCode = '';
  let success = false;
  let message = '';
  let saqueId = null;
  let noCall = false;

  const out = (execResult.out || '') + (execResult.err || '');
  if (out.includes('BEARER ausente') || out.includes('PIX_KEY ausente')) noCall = true;
  try {
    const jsonLine = out.split('\n').find(l => l.trim().startsWith('{') && l.includes('"success"'));
    if (jsonLine) {
      const j = JSON.parse(jsonLine.trim());
      success = j.success === true;
      message = (j.message || j.error || '').slice(0, 120);
      saqueId = j.saqueId != null ? j.saqueId : (j.data && j.data.id) || null;
      if (j.statusCode != null) statusCode = String(j.statusCode);
      if (j.error && (String(j.error).includes('BEARER') || String(j.error).includes('PIX_KEY'))) noCall = true;
    } else {
      message = out.slice(0, 120);
    }
  } catch (_) {
    message = out.slice(0, 120);
  }
  sections.push(`- **statusCode:** ${statusCode || '(não disponível)'}\n`);
  sections.push(`- **success:** ${success}\n`);
  sections.push(`- **message:** ${(message || '(vazio)').replace(/\|/g, ' ')}\n`);
  sections.push(`- **saqueId:** ${saqueId != null ? saqueId : '(não retornado)'}\n`);
  if (noCall) sections.push(`- **NO-CALL:** sim (falta de credenciais)\n`);
  sections.push('\n');

  // F) Logs Fly
  sections.push('## 7. Logs filtrados\n');
  const keywords = ['[SAQUE]', '[LEDGER]', 'airbag', 'correlation', 'uuid', '22P02', 'rollback', 'constraint', 'error', 'Erro ao registrar ledger', 'insert falhou (airbag)', 'insert falhou', 'ledger'];
  let machineAppId = '2874551a105768';
  let machineWorkerId = 'e82794da791108';

  if (flyResult.ok) {
    const parsed = parseFlyStatus(flyResult.out + '\n' + (flyResult.err || ''));
    const appMachines = parsed.machines.filter(m => m.process.includes('app') && m.state.toLowerCase().includes('start'));
    const workerMachines = parsed.machines.filter(m => m.process.includes('payout_worker') && m.state.toLowerCase().includes('start'));
    if (appMachines.length) machineAppId = appMachines[0].id;
    if (workerMachines.length) machineWorkerId = workerMachines[0].id;
  }

  const appLogResult = flyLogsWithFallback(machineAppId, 'App');
  const workerLogResult = flyLogsWithFallback(machineWorkerId, 'Payout worker');
  const appRaw = appLogResult.outRaw;
  const workerRaw = workerLogResult.outRaw;

  const usedSince = appLogResult.usedSince && workerLogResult.usedSince;
  const fallbackReason = appLogResult.fallbackReason || workerLogResult.fallbackReason;
  if (usedSince) {
    sections.push('Logs coletados com: --since 15m\n\n');
  } else {
    sections.push('Logs coletados com: fallback (flyctl sem --since): --no-tail\n');
    if (fallbackReason) sections.push(`Motivo fallback: ${fallbackReason}\n`);
    sections.push('\n');
  }

  const appFiltered = filterLogLines(appRaw, keywords);
  const workerFiltered = filterLogLines(workerRaw, keywords);

  sections.push('### App\n');
  if (appFiltered.length) {
    appFiltered.slice(-30).forEach(l => {
      sections.push('  ' + l.replace(/\|/g, ' ').slice(0, 200) + '\n');
    });
  } else {
    sections.push('  (nenhuma linha correspondente aos filtros)\n');
  }
  sections.push('\n### Payout worker\n');
  if (workerFiltered.length) {
    workerFiltered.slice(-30).forEach(l => {
      sections.push('  ' + l.replace(/\|/g, ' ').slice(0, 200) + '\n');
    });
  } else {
    sections.push('  (nenhuma linha correspondente aos filtros)\n');
  }

  const allLogs = appRaw + '\n' + workerRaw;
  const countUuid = countInText(allLogs, 'invalid input syntax for type uuid');
  const count22P02 = countInText(allLogs, '22P02');
  const countErroRegistrarLedger = countInText(allLogs, 'Erro ao registrar ledger');
  const countLedgerInsertFalhou = countInText(allLogs, '[LEDGER] insert falhou');
  const countInsertFalhouAirbag = countInText(allLogs, 'insert falhou (airbag)');
  const countRollbackWithdraw = countInText(allLogs, 'rollbackWithdraw');
  const countFalhaPayout = countInText(allLogs, 'falha_payout');
  sections.push('\n### Contagens\n');
  sections.push(`- "invalid input syntax for type uuid": ${countUuid}\n`);
  sections.push(`- "22P02": ${count22P02}\n`);
  sections.push(`- "Erro ao registrar ledger": ${countErroRegistrarLedger}\n`);
  sections.push(`- "[LEDGER] insert falhou": ${countLedgerInsertFalhou}\n`);
  sections.push(`- "insert falhou (airbag)": ${countInsertFalhouAirbag}\n`);
  sections.push(`- "rollbackWithdraw": ${countRollbackWithdraw}\n`);
  sections.push(`- "falha_payout": ${countFalhaPayout}\n\n`);

  // G) Decisão PASS/FAIL
  sections.push('## 8. Heurística PASS/FAIL\n');
  let verdict = 'INCONCLUSIVO (sem credenciais)';
  let justification = '';

  const hasLedgerErrors = countErroRegistrarLedger > 0 || countLedgerInsertFalhou > 0 || countInsertFalhouAirbag > 0;
  const is500 = statusCode === '500';

  if (noCall || (envState.BEARER === 'MISSING' || envState.PIX_KEY === 'MISSING')) {
    verdict = 'INCONCLUSIVO (sem credenciais)';
    justification = 'BEARER ou PIX_KEY ausentes; saque não foi chamado. Defina as envs e execute novamente.';
  } else if (count22P02 > 0 || countUuid > 0) {
    verdict = 'FAIL';
    justification = `Detectado erro 22P02 ou "invalid input syntax for type uuid" nos logs (${count22P02} + ${countUuid} ocorrências). Causa: correlation_id não-UUID no INSERT do ledger.`;
  } else if (hasLedgerErrors) {
    verdict = 'FAIL';
    justification = `Detectado "Erro ao registrar ledger" ou "[LEDGER] insert falhou" nos logs (${countErroRegistrarLedger}/${countLedgerInsertFalhou}/${countInsertFalhouAirbag}).`;
  } else if (!success && is500) {
    verdict = 'FAIL';
    justification = `Chamada ao saque retornou success=false com statusCode 500. message: ${(message || '').slice(0, 80)}`;
  } else if (saqueId && success && !hasLedgerErrors && count22P02 === 0 && countUuid === 0) {
    verdict = 'PASS';
    justification = 'saqueId retornado, success true, contagens de erro nos logs igual a zero.';
  } else if (!success && !noCall) {
    verdict = 'FAIL';
    justification = `Chamada ao saque retornou success=false. message: ${(message || '').slice(0, 80)}`;
  } else {
    verdict = 'INCONCLUSIVO';
    justification = 'Não foi possível determinar (sem credenciais ou resultado ambíguo).';
  }

  sections.push(`- **Veredito:** ${verdict}\n`);
  sections.push(`- **Justificativa:** ${justification}\n\n`);

  sections.push('## 9. Próximos passos\n');
  sections.push('- Se INCONCLUSIVO: defina BEARER e PIX_KEY no PowerShell e rode novamente `npm run test-withdraw-e2e`.\n');
  sections.push('- Se FAIL: verifique os logs filtrados e a causa (22P02, ledger, rollback).\n');
  sections.push('- Se PASS: saque/ledger E2E em produção está ok; opcional limpar envs (ver instrução abaixo).\n\n');

  sections.push('---\n\n### Higiene (PowerShell)\n\nRemover envs após o teste:\n\n```powershell\nRemove-Item Env:BEARER -ErrorAction SilentlyContinue\nRemove-Item Env:PIX_KEY -ErrorAction SilentlyContinue\nRemove-Item Env:PIX_KEY_TYPE -ErrorAction SilentlyContinue\nRemove-Item Env:WITHDRAW_AMOUNT -ErrorAction SilentlyContinue\n```\n');

  const reportContent = sections.join('');
  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_FILE, reportContent, 'utf8');

  console.log('[E2E] RunId:', RUN_ID);
  console.log('[E2E] Relatório:', REPORT_FILE);
  console.log('[E2E] Veredito:', verdict);
  console.log('[E2E] Envs: BEARER=' + envState.BEARER + ', PIX_KEY=' + envState.PIX_KEY);
  console.log('\nPara limpar envs no PowerShell, execute:');
  console.log('  Remove-Item Env:BEARER -ErrorAction SilentlyContinue');
  console.log('  Remove-Item Env:PIX_KEY -ErrorAction SilentlyContinue');
  console.log('  Remove-Item Env:PIX_KEY_TYPE -ErrorAction SilentlyContinue');
  console.log('  Remove-Item Env:WITHDRAW_AMOUNT -ErrorAction SilentlyContinue');
}

main().catch(e => {
  console.error('[E2E] Erro:', e.message);
  process.exit(1);
});
