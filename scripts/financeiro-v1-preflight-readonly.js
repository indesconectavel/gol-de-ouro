/**
 * READ-ONLY: Preflight final antes do deploy V1.2.
 * Congela estado: frontend, Fly, financeiro, git.
 * Gera: financeiro-v1-preflight-*.json em docs/relatorios.
 * Não imprime segredos.
 */
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'relatorios');
const APP_FLY = 'goldeouro-backend-v2';
const COMMIT_V12_ESPERADO = '73de7a39efafe58e643f1e10207108da9098a63d';

function out(name, data) {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2), 'utf8');
}

function httpsGet(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 12000 }, (res) => {
      const headers = {};
      const safe = ['content-type', 'server', 'x-vercel-id', 'x-vercel-cache', 'content-length'];
      safe.forEach(h => {
        if (res.headers[h]) headers[h] = res.headers[h];
      });
      let body = '';
      res.on('data', (ch) => { body += ch; });
      res.on('end', () => {
        const hash = crypto.createHash('sha256').update(body, 'utf8').digest('hex');
        resolve({
          statusCode: res.statusCode,
          headers,
          bodyLength: body.length,
          sha256: hash,
          server: res.headers.server || null
        });
      });
    });
    req.on('error', (err) => resolve({ statusCode: null, error: err.message }));
    req.setTimeout(12000, () => { req.destroy(); resolve({ statusCode: null, error: 'timeout' }); });
  });
}

function run(cmd, silent) {
  try {
    const out = execSync(cmd, { encoding: 'utf8', timeout: 30000, maxBuffer: 2 * 1024 * 1024 });
    return { ok: true, output: out.trim() };
  } catch (e) {
    return { ok: false, error: e.message || String(e), stderr: e.stderr ? String(e.stderr).slice(0, 500) : null };
  }
}

async function main() {
  const now = new Date().toISOString();

  // ----- PASSO A — Frontend -----
  const gameUrl = 'https://www.goldeouro.lol/game';
  const dashUrl = 'https://www.goldeouro.lol/dashboard';
  const gameRes = await httpsGet(gameUrl);
  const dashRes = await httpsGet(dashUrl);
  const frontendOut = {
    timestamp_utc: now,
    game: {
      url: gameUrl,
      statusCode: gameRes.statusCode,
      headers: gameRes.headers,
      bodyLength: gameRes.bodyLength,
      sha256: gameRes.sha256,
      server: gameRes.server || (gameRes.headers && gameRes.headers.server)
    },
    dashboard: {
      url: dashUrl,
      statusCode: dashRes.statusCode,
      headers: dashRes.headers,
      bodyLength: dashRes.bodyLength,
      sha256: dashRes.sha256,
      server: dashRes.server || (dashRes.headers && dashRes.headers.server)
    },
    preservado: gameRes.statusCode === 200 && dashRes.statusCode === 200
  };
  if (gameRes.error) frontendOut.game.error = gameRes.error;
  if (dashRes.error) frontendOut.dashboard.error = dashRes.error;
  out('financeiro-v1-preflight-frontend.json', frontendOut);

  // ----- PASSO B — Fly -----
  const statusRun = run(`flyctl status -a ${APP_FLY} 2>&1`);
  const machinesRun = run(`flyctl machines list -a ${APP_FLY} 2>&1`);
  const scaleRun = run(`flyctl scale show -a ${APP_FLY} 2>&1`);
  const releasesRun = run(`flyctl releases -a ${APP_FLY} 2>&1`);
  const flyOut = {
    timestamp_utc: now,
    app: APP_FLY,
    status: statusRun.ok ? statusRun.output : { error: statusRun.error, output: statusRun.output },
    machines_list: machinesRun.ok ? machinesRun.output : { error: machinesRun.error },
    scale_show: scaleRun.ok ? scaleRun.output : { error: scaleRun.error },
    releases_raw: releasesRun.ok ? releasesRun.output : { error: releasesRun.error }
  };
  out('financeiro-v1-preflight-fly.json', flyOut);

  let releasesParsed = { timestamp_utc: now, releases: [], latest_version: null, error: null };
  if (releasesRun.ok && releasesRun.output) {
    const lines = releasesRun.output.split('\n').filter(Boolean);
    releasesParsed.releases = lines.slice(0, 15);
    const firstLine = lines[0] || '';
    const versionMatch = firstLine.match(/v(\d+)/);
    releasesParsed.latest_version = versionMatch ? 'v' + versionMatch[1] : (lines[0] || null);
  } else {
    releasesParsed.error = releasesRun.error;
  }
  out('financeiro-v1-preflight-releases.json', releasesParsed);

  // ----- PASSO C — Estado financeiro -----
  const validacaoRun = run('node scripts/financeiro-v1-final-validacao-readonly.js 2>&1');
  const presosRun = run('node scripts/prova-saques-presos-detalhe-readonly.js 2>&1');
  let financeOut = {
    timestamp_utc: now,
    validacao_script_ok: validacaoRun.ok,
    presos_script_ok: presosRun.ok,
    resumo: {}
  };
  const saquesPath = path.join(OUT, 'financeiro-v1-final-saques.json');
  const saldosPath = path.join(OUT, 'financeiro-v1-final-saldos.json');
  const ledgerPath = path.join(OUT, 'financeiro-v1-final-ledger.json');
  const cicloPath = path.join(OUT, 'ciclo1-saques-presos.json');
  if (fs.existsSync(saquesPath)) {
    const saques = JSON.parse(fs.readFileSync(saquesPath, 'utf8'));
    financeOut.resumo.saques_total_rejeitados = saques.total_rejeitados || 0;
    financeOut.resumo.saques_com_rollback = saques.resumo?.com_rollback ?? 0;
    financeOut.resumo.saques_sem_rollback = saques.resumo?.sem_rollback ?? 0;
    financeOut.resumo.rejeitados_pelo_reconciler = saques.resumo?.rejeitados_pelo_reconciler ?? 0;
  }
  if (fs.existsSync(saldosPath)) {
    const saldos = JSON.parse(fs.readFileSync(saldosPath, 'utf8'));
    financeOut.resumo.conclusao_rollback = saldos.conclusao_rollback;
  }
  if (fs.existsSync(ledgerPath)) {
    const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    financeOut.resumo.conclusao_ledger = ledger.conclusao_ledger;
  }
  if (fs.existsSync(cicloPath)) {
    const ciclo = JSON.parse(fs.readFileSync(cicloPath, 'utf8'));
    financeOut.resumo.saques_presos_mais_30min = ciclo.total_presos ?? 0;
  }
  financeOut.resumo.bloqueios_remanescentes = financeOut.resumo.saques_sem_rollback > 0 ? 'historicos_ou_inconclusivos' : 'nenhum';
  out('financeiro-v1-preflight-finance.json', financeOut);

  // ----- PASSO D — Git -----
  const branchRun = run('git rev-parse --abbrev-ref HEAD 2>&1');
  const headRun = run('git rev-parse HEAD 2>&1');
  const statusRunGit = run('git status --short 2>&1');
  const logRun = run(`git log -1 --oneline 2>&1`);
  const isV12 = headRun.ok && headRun.output && (headRun.output.startsWith(COMMIT_V12_ESPERADO.slice(0, 7)) || headRun.output === COMMIT_V12_ESPERADO);
  const gitOut = {
    timestamp_utc: now,
    branch_atual: branchRun.ok ? branchRun.output : null,
    head_atual: headRun.ok ? headRun.output : null,
    status_limpo: statusRunGit.ok && statusRunGit.output === '',
    status_output_lines: statusRunGit.output ? statusRunGit.output.split('\n').length : 0,
    commit_v1_2_esperado: COMMIT_V12_ESPERADO,
    head_eh_v1_2: isV12,
    ultimo_commit: logRun.ok ? logRun.output : null
  };
  out('financeiro-v1-preflight-git.json', gitOut);
}

main().catch(err => {
  const payload = { timestamp_utc: new Date().toISOString(), erro: err.message };
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'financeiro-v1-preflight-fly.json'), JSON.stringify(payload, null, 2), 'utf8');
  process.exit(1);
});
