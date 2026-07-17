#!/usr/bin/env node
/**
 * RE.6S / RE.6S.1 — Official Release Certification Verifier™
 * Indesconectável Payment Engine™ / Gol de Ouro™ V1
 *
 * Patrimônio permanente do Pipeline Release Engineering.
 * Correção semântica RE.6S.1 (modelo RE.6.8):
 *   L = L_delta ∪ L_baseline
 *   PositiveDeltaRC = L_delta
 *   TreeRCFinal contém L
 *   MissingReal ≠ (L − PositiveDelta)
 *
 * Uso (HITL):
 *   node scripts/verify-release-candidate.mjs
 *
 * Exit: 0 = PASS · 1 = FAIL
 * Git: somente leitura. Zero commit/tag/push/deploy.
 */
'use strict';

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const TOKEN = 'token-real.txt';
const MANIFEST = 'docs/payment-engine/staging/release-manifest.json';
const SELF = 'scripts/verify-release-candidate.mjs';
const MANIFEST_DEFAULTS = JSON.parse(fs.readFileSync(path.join(ROOT, MANIFEST), 'utf8'));
const EXPECTED_BRANCH =
  process.env.RC_EXPECTED_BRANCH || MANIFEST_DEFAULTS.release?.branch || '';
const EXPECTED_HEAD =
  process.env.RC_EXPECTED_HEAD || MANIFEST_DEFAULTS.release?.sha || '';

const PE_FLAGS = [
  'PE_ADAPTER_BOUNDARY_ENABLED',
  'PE_DEPOSIT_CLAIM_PORT_ENABLED',
  'PE_IDEMPOTENCY_PORT_ENABLED',
  'PE_WEBHOOK_STORE_PORT_ENABLED',
  'PE_CORE_FINANCE_BOUNDARY_ENABLED',
  'PE_PAYOUT_BOUNDARY_ENABLED',
  'PE_RUNTIME_BOUNDARY_ENABLED',
  'PE_PROVIDER_BOUNDARY_ENABLED'
];

const ALLOWED_WORKFLOWS = new Set([
  '.github/workflows/backend-deploy-staging.yml',
  '.github/workflows/pe2f1-automated-certification.yml'
]);

/** Artefatos de Engenharia de Release — nunca no payload RC / freeze */
const ENGINEERING = new Set([
  SELF,
  'scripts/re6-7-automated-allowlist-certification.mjs',
  'scripts/re7-freeze-execute.mjs',
  'docs/relatorios/RE.7-CONTROLLED-RELEASE-FREEZE-EXECUTION.md',
  'docs/relatorios/snapshots/re7-freeze-execution.json'
]);

/** Prefixos/scripts de Engineering futuros sob scripts/ */
const ENGINEERING_SCRIPT_PREFIXES = [
  'scripts/re6-',
  'scripts/re7-',
  'scripts/verify-release-candidate'
];

const LOT_EXPECTED = {
  A1: 85,
  A3: 21,
  B1: 3,
  B2: 1,
  C1: 135,
  C2C3: 128
};

function norm(p) {
  return String(p || '')
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .trim();
}

function resolveRe4Dir() {
  const candidates = [
    path.join(ROOT, 'docs', 'release-engineering', 're4'),
    path.resolve(ROOT, '..', 'goldeouro-backend', 'docs', 'release-engineering', 're4')
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'technical-allowlist-final.json'))) return dir;
  }
  throw new Error(
    `Allowlists RE.4 não encontradas. Tentou:\n${candidates.map((c) => `  - ${c}`).join('\n')}`
  );
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function git(...args) {
  const r = spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(
      `git ${args.join(' ')} failed (${r.status}): ${(r.stderr || r.stdout || '').trim()}`
    );
  }
  return (r.stdout || '').replace(/\r\n/g, '\n').trimEnd();
}

function gitOk(...args) {
  const r = spawnSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false
  });
  return {
    ok: r.status === 0 && !r.error,
    out: ((r.stdout || '') + (r.stderr || '')).replace(/\r\n/g, '\n').trimEnd(),
    status: r.status
  };
}

function flattenEvidence(ev) {
  const out = [];
  for (const key of ['c2_paths', 'c3_paths']) {
    const block = ev[key];
    if (!block) continue;
    if (Array.isArray(block)) {
      out.push(...block.map(norm));
    } else {
      for (const arr of Object.values(block)) {
        if (Array.isArray(arr)) out.push(...arr.map(norm));
      }
    }
  }
  return [...new Set(out)];
}

function assertValidPath(lot, p) {
  if (!p || path.isAbsolute(p) || p.includes('..') || p.startsWith('/')) {
    throw new Error(`path inválido em ${lot}: ${p}`);
  }
}

function loadAllowlists(re4Dir) {
  const required = [
    'technical-allowlist-final.json',
    'scripts-allowlist.json',
    'infra-allowlist.json',
    'documentation-allowlist.json',
    'evidence-allowlist.json'
  ];
  for (const f of required) {
    const full = path.join(re4Dir, f);
    if (!fs.existsSync(full)) throw new Error(`allowlist ausente: ${full}`);
  }

  const tech = readJson(path.join(re4Dir, 'technical-allowlist-final.json'));
  const scripts = readJson(path.join(re4Dir, 'scripts-allowlist.json'));
  const infra = readJson(path.join(re4Dir, 'infra-allowlist.json'));
  const docs = readJson(path.join(re4Dir, 'documentation-allowlist.json'));
  const evidence = readJson(path.join(re4Dir, 'evidence-allowlist.json'));

  const lots = {
    A1: (tech.entries_mandatory || []).map((e) => norm(e.path)),
    A3: (scripts.entries || []).map((e) => norm(e.path)),
    B1: (infra.entries || []).map((e) => norm(e.path)),
    B2: ['.env.example'],
    C1: (docs.paths || []).map(norm),
    C2C3: flattenEvidence(evidence)
  };

  for (const [lot, arr] of Object.entries(lots)) {
    const expected = LOT_EXPECTED[lot];
    if (arr.length !== expected) {
      throw new Error(`${lot}: esperado ${expected}, obtido ${arr.length}`);
    }
    for (const p of arr) assertValidPath(lot, p);
  }

  const all = Object.values(lots).flat();
  const L = new Set(all);
  if (L.size !== all.length) {
    throw new Error('duplicidade entre lotes da allowlist RE.4');
  }

  return { lots, L, re4Dir };
}

function parsePorcelain(text) {
  const Modified = new Set();
  const Added = new Set();
  const Deleted = new Set();
  const Renamed = new Set();
  const Copied = new Set();
  const Unmerged = new Set();
  const Staged = new Set();

  for (const line of text.split('\n').filter(Boolean)) {
    if (line.length < 4) continue;
    const xy = line.slice(0, 2);
    const rest = line.slice(3);
    let pathA = null;
    let pathB = null;

    if (rest.includes(' -> ')) {
      const parts = rest.split(' -> ');
      pathA = norm(parts[0].replace(/^"|"$/g, ''));
      pathB = norm(parts[1].replace(/^"|"$/g, ''));
    } else {
      pathB = norm(rest.replace(/^"|"$/g, ''));
    }

    const x = xy[0];
    const y = xy[1];

    if (x !== ' ' && x !== '?') Staged.add(pathB);
    if (x === 'U' || y === 'U' || xy === 'AA' || xy === 'DD') Unmerged.add(pathB);

    if (xy === '??') {
      Added.add(pathB);
      continue;
    }
    if (x === 'A' || y === 'A') Added.add(pathB);
    if (x === 'M' || y === 'M') Modified.add(pathB);
    if (x === 'D' || y === 'D') Deleted.add(pathA || pathB);
    if (x === 'R' || y === 'R') {
      Renamed.add(pathB);
      if (pathA) Deleted.add(pathA);
    }
    if (x === 'C' || y === 'C') Copied.add(pathB);
  }

  return { Modified, Added, Deleted, Renamed, Copied, Unmerged, Staged };
}

function setDiff(a, b) {
  return [...a].filter((x) => !b.has(x)).sort();
}

function setInter(a, b) {
  return [...a].filter((x) => b.has(x)).sort();
}

function isEngineeringPath(p) {
  const n = norm(p);
  if (ENGINEERING.has(n)) return true;
  if (n.startsWith('scripts/')) {
    return ENGINEERING_SCRIPT_PREFIXES.some((pref) => n.startsWith(pref));
  }
  return false;
}

function sha256File(abs) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(abs));
  return h.digest('hex');
}

function headBlobSha(rel) {
  const r = gitOk('ls-tree', 'HEAD', '--', rel);
  if (!r.ok || !r.out) return null;
  // format: <mode> <type> <sha>\t<path>
  const m = r.out.match(/\s([0-9a-f]{40})\t/);
  return m ? m[1] : null;
}

function worktreeBlobSha(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) return null;
  const r = gitOk('hash-object', '--', rel);
  if (r.ok && /^[0-9a-f]{40}$/.test(r.out.trim())) return r.out.trim();
  // fallback content hash (not git blob) — still useful for equality of bytes
  return sha256File(abs);
}

/**
 * RE.6.8 / RE.6S.1:
 * BASELINE_PRESENT quando allowlisted, no tree, tracked no HEAD,
 * e blob atual == blob HEAD (sem alteração no working tree).
 */
function classifyAllowlistPath(rel, positiveDelta, deleted) {
  const abs = path.join(ROOT, rel);
  const inDelta = positiveDelta.has(rel);
  const inDeleted = deleted.has(rel);
  const onDisk = fs.existsSync(abs) && fs.statSync(abs).isFile();
  const headSha = headBlobSha(rel);
  const trackedInHead = Boolean(headSha);

  if (inDelta) {
    return {
      path: rel,
      category: 'L_DELTA',
      in_delta: true,
      on_disk: onDisk,
      tracked_in_head: trackedInHead
    };
  }

  if (inDeleted) {
    return {
      path: rel,
      category: 'MISSING_REAL',
      reason: 'allowlisted mas deletado no working tree',
      on_disk: onDisk,
      tracked_in_head: trackedInHead
    };
  }

  if (onDisk && trackedInHead) {
    const wtSha = worktreeBlobSha(rel);
    // Compare via git diff --quiet path (exit 0 = identical to HEAD)
    const diff = gitOk('diff', '--quiet', 'HEAD', '--', rel);
    const identicalToHead = diff.status === 0;
    if (identicalToHead || (wtSha && headSha && wtSha === headSha)) {
      return {
        path: rel,
        category: 'BASELINE_PRESENT',
        on_disk: true,
        tracked_in_head: true,
        blob_equals_head: true
      };
    }
    // on disk + tracked but dirty without porcelain entry is anomalous
    return {
      path: rel,
      category: 'MISSING_REAL',
      reason: 'tracked no HEAD mas conteúdo diverge e não consta no PositiveDelta',
      on_disk: true,
      tracked_in_head: true,
      blob_equals_head: false
    };
  }

  if (!onDisk && !trackedInHead) {
    return {
      path: rel,
      category: 'MISSING_REAL',
      reason: 'ausente do tree e do baseline HEAD',
      on_disk: false,
      tracked_in_head: false
    };
  }

  if (!onDisk && trackedInHead) {
    return {
      path: rel,
      category: 'MISSING_REAL',
      reason: 'tracked no HEAD mas ausente do filesystem',
      on_disk: false,
      tracked_in_head: true
    };
  }

  // on disk but not in HEAD → should appear as Added; if not, missing-from-delta anomaly
  return {
    path: rel,
    category: 'MISSING_REAL',
    reason: 'presente no tree mas não tracked no HEAD e não no PositiveDelta',
    on_disk: true,
    tracked_in_head: false
  };
}

function auditEnvExample() {
  const unstaged = git('diff', '--', '.env.example');
  const staged = git('diff', '--cached', '--', '.env.example');
  const text = `${unstaged}\n${staged}`.trim();
  const result = {
    hasDiff: Boolean(text),
    flagsPresent: [],
    anyTrue: false,
    unauthorizedLines: [],
    secretsSuspected: false,
    verdict: 'PASS'
  };

  const contentPath = path.join(ROOT, '.env.example');
  if (fs.existsSync(contentPath)) {
    const content = fs.readFileSync(contentPath, 'utf8');
    for (const f of PE_FLAGS) {
      if (content.includes(f)) result.flagsPresent.push(f);
      if (new RegExp(`${f}\\s*=\\s*true`).test(content)) result.anyTrue = true;
    }
  }

  if (text) {
    for (const line of text.split('\n')) {
      if (!(line.startsWith('+') || line.startsWith('-'))) continue;
      if (line.startsWith('+++') || line.startsWith('---')) continue;
      const body = line.slice(1);
      if (!body.trim()) continue;
      const flag = PE_FLAGS.find((f) => body.includes(f));
      if (flag) {
        if (body.includes('=true')) result.anyTrue = true;
        continue;
      }
      if (body.trim().startsWith('#') && /Payment Engine|PE\.2|feature flags/i.test(body)) {
        continue;
      }
      if (body.trim().startsWith('# ---')) continue;
      result.unauthorizedLines.push(line);
    }
    if (
      /eyJ[A-Za-z0-9_-]{10,}|BEGIN (RSA |EC )?PRIVATE KEY|sk_live|APP_USR-/i.test(text)
    ) {
      result.secretsSuspected = true;
    }
  }

  if (
    result.flagsPresent.length !== 8 ||
    result.anyTrue ||
    result.unauthorizedLines.length > 0 ||
    result.secretsSuspected
  ) {
    result.verdict = 'FAIL';
  }
  return result;
}

function auditWorkflows(positiveDeltaRc) {
  const inDelta = [...positiveDeltaRc].filter((p) => p.startsWith('.github/workflows/'));
  const unexpected = inDelta.filter((p) => !ALLOWED_WORKFLOWS.has(p));
  return {
    inDelta,
    unexpected,
    verdict: unexpected.length === 0 ? 'PASS' : 'FAIL'
  };
}

/**
 * Secret scan — RE.6S.1:
 * - nunca varre ferramentas de Engineering
 * - padrões literais no próprio verificador = CODE_PATTERN
 * - somente SECRET real/possível em payload RC
 */
function scanSecrets(paths) {
  const findings = [];
  const patterns = [
    { name: 'jwt', re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
    { name: 'private_key', re: /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/ },
    {
      name: 'supabase_service',
      re: /SUPABASE_SERVICE_ROLE[^\n]{0,40}=\s*[^\s#'"]+/i
    },
    { name: 'fly_token', re: /FLY_API_TOKEN\s*=\s*[^\s#'"]+/ },
    { name: 'asaas_key', re: /\$aact_[A-Za-z0-9_]+/ },
    { name: 'mp_token', re: /APP_USR-[A-Za-z0-9-]+/ },
    {
      name: 'password_assign',
      re: /(password|passwd|secret)\s*[:=]\s*['"][^'"]{8,}/i
    }
  ];

  for (const rel of paths) {
    if (rel === TOKEN) continue;
    if (isEngineeringPath(rel)) continue;
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) continue;
    let content;
    try {
      content = fs.readFileSync(full, 'utf8');
    } catch {
      continue;
    }
    for (const p of patterns) {
      if (!p.re.test(content)) continue;
      // Heurística: definição de regex/scanner no próprio arquivo = CODE_PATTERN
      const looksLikeCodePattern =
        /new RegExp|re:\s*\/|pattern:\s*['"]|name:\s*['"]supabase_service|name:\s*['"]fly_token/.test(
          content
        ) &&
        (rel.endsWith('.mjs') || rel.endsWith('.js') || rel.endsWith('.ts'));
      findings.push({
        path: rel,
        pattern: p.name,
        classification: looksLikeCodePattern ? 'CODE_PATTERN' : 'possível_secret',
        note: 'valor não exibido'
      });
    }
  }

  const unresolved = findings.filter(
    (f) => f.classification === 'possível_secret' || f.classification === 'secret_confirmado'
  );

  return {
    findings,
    unresolved_count: unresolved.length,
    verdict: unresolved.length === 0 ? 'PASS' : 'FAIL'
  };
}

function lotRows(lots, L_delta, L_baseline, MissingReal) {
  const rows = {};
  const missingRealSet = new Set(MissingReal);
  for (const [name, arr] of Object.entries(lots)) {
    const inDelta = arr.filter((p) => L_delta.has(p)).sort();
    const inBaseline = arr.filter((p) => L_baseline.has(p)).sort();
    const missingReal = arr.filter((p) => missingRealSet.has(p)).sort();
    const covered = inDelta.length + inBaseline.length;
    rows[name] = {
      expected: arr.length,
      in_delta: inDelta.length,
      baseline_present: inBaseline.length,
      covered,
      missing_real: missingReal,
      status: missingReal.length === 0 && covered === arr.length ? 'PASS' : 'FAIL'
    };
  }
  return rows;
}

function main() {
  process.chdir(ROOT);

  const branch = git('branch', '--show-current').trim();
  const head = git('rev-parse', 'HEAD').trim();
  const re4Dir = resolveRe4Dir();
  const { lots, L } = loadAllowlists(re4Dir);

  const porcelain = git('status', '--porcelain=v1', '-uall');
  const diffNames = git('diff', '--name-only')
    .split('\n')
    .map(norm)
    .filter(Boolean);
  const cachedNames = git('diff', '--cached', '--name-only')
    .split('\n')
    .map(norm)
    .filter(Boolean);
  const others = git('ls-files', '--others', '--exclude-standard')
    .split('\n')
    .map(norm)
    .filter(Boolean);

  const parsed = parsePorcelain(porcelain);
  const S = new Set([TOKEN]);

  const PositiveDeltaRaw = new Set([
    ...parsed.Modified,
    ...parsed.Added,
    ...parsed.Renamed,
    ...parsed.Copied
  ]);

  // CORREÇÃO 5 — Engineering fora do payload RC
  const EngineeringInWorkingTree = [...PositiveDeltaRaw, ...parsed.Deleted, ...parsed.Staged]
    .filter((p, i, arr) => arr.indexOf(p) === i && isEngineeringPath(p))
    .sort();

  const PositiveDeltaRC = new Set(
    [...PositiveDeltaRaw].filter((p) => !isEngineeringPath(p))
  );
  const CurrentDeltaRC = new Set([
    ...PositiveDeltaRC,
    ...[...parsed.Deleted].filter((p) => !isEngineeringPath(p))
  ]);

  // Classificar cada path allowlisted
  const classifications = [];
  const L_delta = new Set();
  const L_baseline = new Set();
  const MissingReal = [];
  const MissingBaseline = [];
  const MissingOutOfScope = [];

  for (const rel of [...L].sort()) {
    const c = classifyAllowlistPath(rel, PositiveDeltaRC, parsed.Deleted);
    classifications.push(c);
    if (c.category === 'L_DELTA') L_delta.add(rel);
    else if (c.category === 'BASELINE_PRESENT') {
      L_baseline.add(rel);
      MissingBaseline.push(rel);
    } else if (c.category === 'OUT_OF_SCOPE') {
      MissingOutOfScope.push(rel);
    } else if (c.category === 'MISSING_REAL') {
      MissingReal.push(rel);
    }
  }

  // Unexpected real = PositiveDeltaRC − L
  const UnexpectedReal = setDiff(PositiveDeltaRC, L);
  // Unexpected engineering = engineering paths in raw delta (informational, not FAIL for payload)
  const UnexpectedEngineering = EngineeringInWorkingTree.filter((p) =>
    PositiveDeltaRaw.has(p)
  );

  const UnexpectedDeleted = setDiff(
    new Set([...parsed.Deleted].filter((p) => !isEngineeringPath(p))),
    S
  );
  const MissingSanitization = setDiff(S, parsed.Deleted);
  const UnexpectedStaged = [...parsed.Staged]
    .filter((p) => !isEngineeringPath(p))
    .sort();
  const EngineeringStaged = [...parsed.Staged].filter((p) => isEngineeringPath(p)).sort();

  // TreeRCFinal contém L?
  const TreeMissingAllowlist = [...L]
    .filter((p) => {
      const abs = path.join(ROOT, p);
      return !(fs.existsSync(abs) && fs.statSync(abs).isFile());
    })
    .sort();

  const envExample = auditEnvExample();
  const workflows = auditWorkflows(PositiveDeltaRC);
  const secretScan = scanSecrets([...PositiveDeltaRC]);
  const lotsReport = lotRows(lots, L_delta, L_baseline, MissingReal);

  lotsReport.SECURITY = {
    expected: 1,
    present: parsed.Deleted.has(TOKEN) ? 1 : 0,
    missing: MissingSanitization,
    unexpected: UnexpectedDeleted,
    status:
      UnexpectedDeleted.length === 0 && MissingSanitization.length === 0
        ? 'PASS'
        : 'FAIL'
  };

  const tokenOnDisk = fs.existsSync(path.join(ROOT, TOKEN));
  let manifestFrozen = null;
  let pinOk = false;
  try {
    const manifest = readJson(path.join(ROOT, MANIFEST));
    manifestFrozen = manifest.release?.frozen === true;
    pinOk = manifest.release?.frozen === true;
  } catch {
    pinOk = false;
  }

  const branchOk = branch === EXPECTED_BRANCH;
  const headOk = head === EXPECTED_HEAD;

  // Modelo RE.6.8:
  // PositiveDeltaRC == L_delta
  // Tree contém L
  // CurrentDeltaRC == L_delta ∪ S
  const positiveDeltaEqualsLDelta =
    setDiff(PositiveDeltaRC, L_delta).length === 0 &&
    setDiff(L_delta, PositiveDeltaRC).length === 0;

  const currentDeltaEqualsExpected =
    positiveDeltaEqualsLDelta &&
    UnexpectedDeleted.length === 0 &&
    MissingSanitization.length === 0;

  const treeContainsAllowlist = TreeMissingAllowlist.length === 0;

  const pass =
    branchOk &&
    headOk &&
    MissingReal.length === 0 &&
    UnexpectedReal.length === 0 &&
    UnexpectedDeleted.length === 0 &&
    MissingSanitization.length === 0 &&
    UnexpectedStaged.length === 0 &&
    EngineeringStaged.length === 0 &&
    parsed.Unmerged.size === 0 &&
    treeContainsAllowlist &&
    positiveDeltaEqualsLDelta &&
    tokenOnDisk === false &&
    parsed.Deleted.has(TOKEN) &&
    !parsed.Modified.has(TOKEN) &&
    !parsed.Added.has(TOKEN) &&
    !parsed.Staged.has(TOKEN) &&
    pinOk &&
    envExample.verdict === 'PASS' &&
    workflows.verdict === 'PASS' &&
    secretScan.verdict === 'PASS' &&
    Object.values(lotsReport).every((r) => r.status === 'PASS');

  const report = {
    gate: 'RE.6S.1',
    verifier: SELF,
    model: 'RE.6.8',
    timestamp: new Date().toISOString(),
    worktree: ROOT,
    re4Dir,
    preflight: {
      branch,
      head,
      expectedBranch: EXPECTED_BRANCH,
      expectedHead: EXPECTED_HEAD,
      branch_ok: branchOk,
      head_ok: headOk
    },
    git_reads: {
      porcelain_lines: porcelain.split('\n').filter(Boolean).length,
      diff_name_only: diffNames,
      cached_name_only: cachedNames,
      others_exclude_standard: others
    },
    sets: {
      Modified: [...parsed.Modified].sort(),
      Added: [...parsed.Added].sort(),
      Deleted: [...parsed.Deleted].sort(),
      Renamed: [...parsed.Renamed].sort(),
      Copied: [...parsed.Copied].sort(),
      Unmerged: [...parsed.Unmerged].sort(),
      Staged: [...parsed.Staged].sort(),
      PositiveDeltaRaw: [...PositiveDeltaRaw].sort(),
      PositiveDeltaRC: [...PositiveDeltaRC].sort(),
      CurrentDeltaRC: [...CurrentDeltaRC].sort(),
      L_delta: [...L_delta].sort(),
      L_baseline: [...L_baseline].sort()
    },
    categories: {
      BASELINE_PRESENT: MissingBaseline,
      MISSING_REAL: MissingReal,
      MISSING_BASELINE_FALSE: MissingBaseline,
      MISSING_OUT_OF_SCOPE: MissingOutOfScope,
      UNEXPECTED_REAL: UnexpectedReal,
      ENGINEERING: UnexpectedEngineering,
      OUT_OF_SCOPE: MissingOutOfScope
    },
    calculations: {
      MissingReal,
      MissingBaseline,
      MissingOutOfScope,
      UnexpectedReal,
      UnexpectedEngineering,
      UnexpectedDeleted,
      MissingSanitization,
      UnexpectedStaged,
      EngineeringStaged,
      TreeMissingAllowlist,
      positiveDeltaEqualsLDelta,
      currentDeltaEqualsExpected,
      treeContainsAllowlist,
      formula: {
        L: 'L_delta ∪ L_baseline',
        PositiveDeltaRC_expected: 'L_delta',
        TreeRCFinal_contains: 'L',
        CurrentDeltaRC_expected: 'L_delta ∪ S',
        S: [TOKEN],
        P: 'release.frozen=true no manifest canônico'
      }
    },
    classifications_sample: {
      baseline_present_count: L_baseline.size,
      l_delta_count: L_delta.size,
      missing_real_count: MissingReal.length
    },
    lots: lotsReport,
    token: {
      on_disk: tokenOnDisk,
      deleted: parsed.Deleted.has(TOKEN),
      classification: 'sanitização oficial S'
    },
    pin: {
      path: MANIFEST,
      frozen: manifestFrozen,
      expected_pre_freeze: false,
      ok: pinOk
    },
    envExample,
    workflows,
    secretScan,
    engineering: {
      known: [...ENGINEERING],
      in_working_tree: EngineeringInWorkingTree,
      staged: EngineeringStaged,
      excluded_from_payload: true,
      staged_empty: EngineeringStaged.length === 0
    },
    verdict: pass ? 'PASS' : 'FAIL',
    exit_code: pass ? 0 : 1
  };

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(pass ? 0 : 1);
}

try {
  main();
} catch (err) {
  const fail = {
    gate: 'RE.6S.1',
    verifier: SELF,
    verdict: 'FAIL',
    exit_code: 1,
    error: String(err?.stack || err)
  };
  process.stderr.write(`${JSON.stringify(fail, null, 2)}\n`);
  process.exit(1);
}
