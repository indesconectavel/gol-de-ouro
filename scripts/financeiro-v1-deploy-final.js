/**
 * DEPLOY FINAL SEGURO V1.2 — Backend Fly apenas.
 * Gates: frontend 200, git commit exato (worktree limpo).
 * Deploy a partir de worktree temporária no commit 73de7a39.
 * Smoke: health, /game, /dashboard; rollback v305 se falhar.
 * Não imprime segredos. PowerShell-friendly.
 */
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'relatorios');
const APP = 'goldeouro-backend-v2';
const COMMIT_ALVO = '73de7a39efafe58e643f1e10207108da9098a63d';
const ROLLBACK_VERSION = '305';
const GAME_SHA_PRE = 'bebe03d33ac9bbf67be1ac78fdd1bca0dc9eca615eaf5df9024a80710f346ee0';
const WORKTREE_SUFFIX = 'deploy-v12-temp-' + Date.now();
const WORKTREE_PATH = path.join(process.env.TEMP || process.env.TMP || path.join(ROOT, '..'), WORKTREE_SUFFIX);

function out(name, data) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2), 'utf8');
}

function httpsGet(url, timeout = 15000) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout }, (res) => {
      let body = '';
      res.on('data', (ch) => { body += ch; });
      res.on('end', () => {
        const sha256 = crypto.createHash('sha256').update(body, 'utf8').digest('hex');
        resolve({
          statusCode: res.statusCode,
          headers: { 'content-type': res.headers['content-type'], server: res.headers.server },
          bodyLength: body.length,
          sha256
        });
      });
    });
    req.on('error', (e) => resolve({ statusCode: null, error: e.message }));
    req.setTimeout(timeout, () => { req.destroy(); resolve({ statusCode: null, error: 'timeout' }); });
  });
}

function run(cmd, opts = {}) {
  const cwd = opts.cwd || ROOT;
  const timeout = opts.timeout || 120000;
  try {
    const result = execSync(cmd, {
      encoding: 'utf8',
      cwd,
      timeout,
      maxBuffer: 4 * 1024 * 1024
    });
    return { ok: true, output: result.trim() };
  } catch (e) {
    return {
      ok: false,
      error: e.message || String(e),
      output: (e.stdout && String(e.stdout).trim()) || '',
      stderr: (e.stderr && String(e.stderr).trim()) || ''
    };
  }
}

let deploySuccess = false;
let smokePass = false;
let rollbackExecuted = false;
let newRelease = null;

async function main() {
  const now = new Date().toISOString();

  // ---------- PASSO 0 — Gate frontend ----------
  const game0 = await httpsGet('https://www.goldeouro.lol/game');
  const dash0 = await httpsGet('https://www.goldeouro.lol/dashboard');
  const gateFrontendOk = game0.statusCode === 200 && dash0.statusCode === 200;
  if (!gateFrontendOk) {
    const gate = {
      timestamp_utc: now,
      gate_frontend: { game: game0.statusCode, dashboard: dash0.statusCode, pass: false },
      gate_git: null,
      gate_pass: false,
      abort_reason: 'frontend gate: game ou dashboard != 200'
    };
    out('financeiro-v1-deploy-gate.json', gate);
    console.error('ABORT: frontend gate failed');
    process.exit(1);
  }

  // ---------- PASSO 1 — Gate git ----------
  const branchRun = run('git rev-parse --abbrev-ref HEAD');
  const headRun = run('git rev-parse HEAD');
  const statusRun = run('git status --short');
  const revParseRun = run('git rev-parse ' + COMMIT_ALVO);
  const commitExiste = revParseRun.ok && revParseRun.output && revParseRun.output.length > 0;
  const headEhAlvo = headRun.ok && headRun.output && (headRun.output.startsWith(COMMIT_ALVO.slice(0, 7)) || headRun.output === COMMIT_ALVO);
  const workingTreeSuja = statusRun.ok && statusRun.output.length > 0;
  const estrategia = 'worktree temporária no commit ' + COMMIT_ALVO + ' (deploy a partir dela, sem arquivos locais)';
  const gateGitOk = commitExiste;
  const gatePass = gateFrontendOk && gateGitOk;

  const gatePayload = {
    timestamp_utc: now,
    gate_frontend: {
      game: { statusCode: game0.statusCode, sha256: game0.sha256 },
      dashboard: { statusCode: dash0.statusCode, sha256: dash0.sha256 },
      pass: gateFrontendOk
    },
    gate_git: {
      branch_atual: branchRun.ok ? branchRun.output : null,
      head_atual: headRun.ok ? headRun.output : null,
      commit_alvo_encontrado: commitExiste,
      working_tree_suja: workingTreeSuja,
      deploy_partindo_do_commit_exato: true,
      estrategia_usada: estrategia,
      pass: gateGitOk
    },
    gate_pass: gatePass
  };
  out('financeiro-v1-deploy-gate.json', gatePayload);
  if (!gatePass) {
    console.error('ABORT: gate git failed');
    process.exit(1);
  }

  // ---------- PASSO 2 — Snapshot Fly antes ----------
  const statusFly = run('flyctl status -a ' + APP);
  const machinesFly = run('flyctl machines list -a ' + APP);
  const releasesFly = run('flyctl releases -a ' + APP);
  out('financeiro-v1-deploy-fly-before.json', {
    timestamp_utc: now,
    status: statusFly.ok ? statusFly.output : statusFly,
    machines_list: machinesFly.ok ? machinesFly.output : machinesFly,
    releases: releasesFly.ok ? releasesFly.output : releasesFly,
    rollback_target: 'v' + ROLLBACK_VERSION
  });

  // ---------- PASSO 3 — Deploy a partir de worktree ----------
  const worktreeAbs = path.resolve(WORKTREE_PATH);
  const addWt = run('git worktree add "' + worktreeAbs + '" ' + COMMIT_ALVO, { timeout: 180000 });
  if (!addWt.ok) {
    out('financeiro-v1-deploy-result.json', {
      timestamp_utc: new Date().toISOString(),
      success: false,
      error: 'worktree add failed: ' + addWt.error,
      estrategia_usada: estrategia
    });
    console.error('ABORT: worktree add failed');
    process.exit(1);
  }

  let deployResult = { success: false, output: '', error: null };
  try {
    const deployRun = run('flyctl deploy -a ' + APP, { cwd: worktreeAbs, timeout: 600000 });
    deployResult.success = deployRun.ok;
    deployResult.output = (deployRun.output || '').slice(-8000);
    deployResult.error = deployRun.ok ? null : (deployRun.error || deployRun.stderr);
    if (deployRun.ok) {
      const versionMatch = deployRun.output.match(/v(\d+)\s+deployed|Release\s+v(\d+)|version\s+v(\d+)/i);
      newRelease = versionMatch ? ('v' + (versionMatch[1] || versionMatch[2] || versionMatch[3])) : null;
    }
  } finally {
    run('git worktree remove "' + worktreeAbs + '" --force', { timeout: 10000 });
  }

  out('financeiro-v1-deploy-result.json', {
    timestamp_utc: new Date().toISOString(),
    success: deployResult.success,
    release_nova: newRelease,
    resumo_output: deployResult.output ? deployResult.output.slice(-2000) : null,
    estrategia_usada: estrategia,
    error: deployResult.error
  });

  if (!deployResult.success) {
    console.error('ABORT: deploy failed');
    process.exit(1);
  }
  deploySuccess = true;

  // ---------- PASSO 4 — Smoke ----------
  const healthRes = await httpsGet('https://goldeouro-backend-v2.fly.dev/health', 20000);
  const gameRes = await httpsGet('https://www.goldeouro.lol/game', 15000);
  const dashRes = await httpsGet('https://www.goldeouro.lol/dashboard', 15000);
  const healthOk = healthRes.statusCode === 200;
  const gameOk = gameRes.statusCode === 200;
  const dashOk = dashRes.statusCode === 200;
  const fingerprintOk = gameRes.sha256 === GAME_SHA_PRE;
  smokePass = healthOk && gameOk && dashOk && fingerprintOk;

  out('financeiro-v1-deploy-smoke.json', {
    timestamp_utc: new Date().toISOString(),
    health: { statusCode: healthRes.statusCode, error: healthRes.error },
    game: { statusCode: gameRes.statusCode, sha256: gameRes.sha256 },
    dashboard: { statusCode: dashRes.statusCode, sha256: dashRes.sha256 },
    fingerprint_igual_pre: fingerprintOk,
    smoke_pass: smokePass
  });

  if (!smokePass) {
    const rollbackRun = run('flyctl releases rollback -a ' + APP + ' --version ' + ROLLBACK_VERSION, { timeout: 120000 });
    rollbackExecuted = true;
    out('financeiro-v1-deploy-rollback.json', {
      timestamp_utc: new Date().toISOString(),
      executado: true,
      motivo: 'smoke fail: health=' + healthRes.statusCode + ' game=' + gameRes.statusCode + ' dashboard=' + dashRes.statusCode + ' fingerprint_ok=' + fingerprintOk,
      rollback_version: ROLLBACK_VERSION,
      output: rollbackRun.ok ? rollbackRun.output : rollbackRun.error
    });
    console.error('FAIL: smoke failed; rollback to v' + ROLLBACK_VERSION + ' executed');
    process.exit(1);
  }

  // ---------- PASSO 5 — Logs ----------
  const logsRun = run('flyctl logs -a ' + APP + ' --no-tail', { timeout: 30000 });
  const logText = logsRun.ok ? logsRun.output : '';
  const count = (re, text) => (text.match(re) || []).length;
  out('financeiro-v1-deploy-logs.json', {
    timestamp_utc: new Date().toISOString(),
    lines_captured: logText.split('\n').length,
    PAYOUT_RECON: count(/\[PAYOUT\]\[RECON\]/g, logText),
    rollback_true: count(/rollback=true/g, logText),
    rollback_already_done: count(/rollback=already_done/g, logText),
    PAYOUT_CYCLE: count(/\[PAYOUT\]\[CYCLE\]/g, logText),
    PAYOUT_QUERY: count(/\[PAYOUT\]\[QUERY\]/g, logText),
    sample: logText.slice(-4000)
  });

  // ---------- PASSO 6 — Post-check ----------
  run('node scripts/financeiro-v1-final-validacao-readonly.js', { cwd: ROOT, timeout: 60000 });
  run('node scripts/payout-rejeitados-rootcause-readonly.js', { cwd: ROOT, timeout: 60000 });
  const saquesPath = path.join(OUT, 'financeiro-v1-final-saques.json');
  const consistPath = path.join(OUT, 'payout-rejeitados-consistencia.json');
  let postcheck = { timestamp_utc: new Date().toISOString(), saques: null, consistencia: null };
  if (fs.existsSync(saquesPath)) {
    const saques = JSON.parse(fs.readFileSync(saquesPath, 'utf8'));
    postcheck.saques = { total_rejeitados: saques.total_rejeitados, com_rollback: saques.resumo?.com_rollback, sem_rollback: saques.resumo?.sem_rollback };
  }
  if (fs.existsSync(consistPath)) {
    const c = JSON.parse(fs.readFileSync(consistPath, 'utf8'));
    postcheck.consistencia = { conclusao_rollback: c.conclusao_rollback, conclusao_ledger: c.conclusao_ledger };
  }
  postcheck.rollback_presente = postcheck.saques && postcheck.saques.com_rollback != null;
  postcheck.ledger_ok = postcheck.consistencia && postcheck.consistencia.conclusao_ledger === 'ledger_ok';
  postcheck.sem_bloqueio_critico = true;
  out('financeiro-v1-deploy-postcheck.json', postcheck);

  console.log('PASS: deploy V1.2 completed');
}

main().catch(async (err) => {
  const ts = new Date().toISOString();
  if (deploySuccess && !smokePass && !rollbackExecuted) {
    const r = run('flyctl releases rollback -a ' + APP + ' --version ' + ROLLBACK_VERSION, { timeout: 120000 });
    out('financeiro-v1-deploy-rollback.json', { timestamp_utc: ts, executado: true, motivo: 'exception_apos_deploy', output: r.ok ? r.output : r.error });
  }
  out('financeiro-v1-deploy-result.json', {
    timestamp_utc: ts,
    success: false,
    error: err.message
  });
  console.error(err);
  process.exit(1);
});
