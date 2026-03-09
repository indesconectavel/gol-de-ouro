/**
 * AUDITORIA READ-ONLY: Snapshot de produção Fly.io.
 * Executa flyctl status, machines list, scale show, releases (últimas 10).
 * Salva JSON em docs/relatorios/auditoria-fly-snapshot-YYYY-MM-DD.json
 * NÃO imprime tokens/credenciais.
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const APP = 'goldeouro-backend-v2';
const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const TS = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

function run(cmd, opts = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      timeout: 60000,
      ...opts
    });
  } catch (e) {
    return e.stdout || e.stderr || e.message || String(e);
  }
}

const out = {
  app_name: APP,
  timestamp: new Date().toISOString(),
  machines: { raw: null, parsed: [] },
  scale: { raw: null },
  releases: { raw: null, last10: [] },
  observacoes: []
};

// PowerShell-compatible: flyctl está no PATH
const statusCmd = `flyctl status -a ${APP}`;
const machinesCmd = `flyctl machines list -a ${APP}`;
const scaleCmd = `flyctl scale show -a ${APP}`;
const releasesCmd = `flyctl releases -a ${APP}`;

out.status_raw = run(statusCmd);
out.machines.raw = run(machinesCmd);
out.scale.raw = run(scaleCmd);
out.releases.raw = run(releasesCmd);

// Parse releases: últimas 10 linhas que parecem versões (número ou hash)
const releaseLines = (out.releases.raw || '').split(/\r?\n/).filter(Boolean);
out.releases.last10 = releaseLines.slice(0, 10).map(l => l.trim());

if (out.status_raw && out.status_raw.toLowerCase().includes('stop')) {
  out.observacoes.push('1 app stopped ou máquina stopped');
}
if (out.machines.raw && out.machines.raw.toLowerCase().includes('destroyed')) {
  out.observacoes.push('Máquina(s) destroyed listadas');
}

const outPath = path.join(OUT_DIR, `auditoria-fly-snapshot-${TS}.json`);
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('OK snapshot fly -> ' + outPath);
