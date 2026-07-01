/**
 * V1.2E — Snapshot operacional consolidado (read-only).
 * Runtime + financeiro + workers + drift + alertas + riscos.
 */
'use strict';

require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: false });

const fs = require('fs');
const path = require('path');
const lib = require('./lib/operational-lib');
const { runContinuousVerification } = require('./continuous-verification');
const { runMonitor } = require('./heartbeat-worker-monitor');

const MISSION = 'V1.2E-GENERATE-OPERATIONAL-SNAPSHOT';

function buildMarkdown(snapshot) {
  const s = snapshot.summary;
  return [
    '# Snapshot operacional consolidado',
    '',
    `**Timestamp UTC:** ${snapshot.timestamp}`,
    `**Missão:** ${MISSION}`,
    `**Modo:** read-only`,
    '',
    '---',
    '',
    '## Resumo',
    '',
    '| Campo | Valor |',
    '|-------|-------|',
    `| Score operacional | **${s.operational_score}** |`,
    `| Status | **${s.status}** |`,
    `| Veredito | **${s.verdict}** |`,
    `| Issues | ${s.issue_count} |`,
    '',
    '## Domínios',
    '',
    '| Domínio | Status | Score |',
    '|---------|--------|------:|',
    `| Runtime | ${snapshot.domains.runtime?.status || '—'} | ${snapshot.domains.runtime?.score ?? '—'} |`,
    `| Financeiro | ${snapshot.domains.financial?.status || '—'} | ${snapshot.domains.financial?.score ?? '—'} |`,
    `| Segurança | ${snapshot.domains.security?.status || '—'} | ${snapshot.domains.security?.score ?? '—'} |`,
    `| Workers | ${snapshot.heartbeat?.status || '—'} | — |`,
    '',
    '## Riscos principais',
    '',
    ...(snapshot.risks.length
      ? snapshot.risks.map((r) => `- **${r.id || r.severity}** — ${r.message}`)
      : ['_Nenhum risco crítico na coleta._']),
    '',
    '## Artefatos',
    '',
    `- JSON: \`${path.basename(snapshot.files.json)}\``,
    `- Markdown: \`${path.basename(snapshot.files.markdown)}\``,
    '',
    '---',
    '',
    '_Gerado por `scripts/operational/generate-operational-snapshot.js` — não ativo em CI por padrão._',
    '',
  ].join('\n');
}

async function generateSnapshot() {
  const verification = await runContinuousVerification();
  const heartbeat = await runMonitor();

  const risks = verification.top_issues || [];
  const snapshot = {
    timestamp: new Date().toISOString(),
    mission: MISSION,
    mode: 'read-only',
    release: {
      fly_version: verification.domains?.runtime?.runtime?.fly?.latest_version,
      runtime_sha: verification.domains?.runtime?.runtime?.meta?.gitCommit,
      certified: lib.CERTIFIED_BASELINE,
    },
    domains: {
      runtime: {
        status: verification.domains.runtime?.status,
        score: verification.domains.runtime?.score,
      },
      financial: {
        status: verification.domains.financial?.status,
        score: verification.domains.financial?.score,
        metrics: verification.domains.financial?.metrics,
      },
      security: {
        status: verification.domains.security?.status,
        score: verification.domains.security?.score,
      },
      drift: verification.domains.drift,
    },
    heartbeat,
    alerts: {
      issue_count: verification.issue_count,
      top: verification.top_issues,
    },
    consolidated: verification.consolidated,
    risks,
    summary: {
      operational_score: verification.operational_score,
      status: verification.status,
      verdict: verification.verdict,
      issue_count: verification.issue_count,
    },
    full_verification: verification,
  };

  const snapDir = lib.rel('docs', 'operational', 'snapshots', 'consolidated');
  fs.mkdirSync(snapDir, { recursive: true });
  const ts = snapshot.timestamp.replace(/[:.]/g, '-');
  const jsonPath = path.join(snapDir, `operational-snapshot-${ts}.json`);
  const mdPath = path.join(snapDir, `operational-snapshot-${ts}.md`);
  snapshot.files = { json: jsonPath, markdown: mdPath };
  fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2), 'utf8');
  fs.writeFileSync(mdPath, buildMarkdown(snapshot), 'utf8');

  const latestJson = path.join(snapDir, 'LATEST.json');
  const latestMd = path.join(snapDir, 'LATEST.md');
  fs.writeFileSync(latestJson, JSON.stringify(snapshot, null, 2), 'utf8');
  fs.writeFileSync(latestMd, buildMarkdown(snapshot), 'utf8');

  return snapshot;
}

async function main() {
  const snap = await generateSnapshot();
  console.log(
    JSON.stringify(
      {
        score: snap.summary.operational_score,
        status: snap.summary.status,
        verdict: snap.summary.verdict,
        json: snap.files.json,
        markdown: snap.files.markdown,
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { generateSnapshot, MISSION };
