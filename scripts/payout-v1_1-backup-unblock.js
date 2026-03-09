/**
 * PAYOUT V1.1 — Auditoria de fontes de DATABASE_URL e teste de backup.
 * NÃO imprime valores de DATABASE_URL, SUPABASE_URL, SERVICE_ROLE_KEY ou qualquer segredo.
 * Saída: apenas JSON de auditoria e resultado de backup em docs/relatorios/.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const DOCS_RELATORIOS = path.join(ROOT, 'docs', 'relatorios');
const BACKUPS_DIR = path.join(ROOT, 'backups');

function redact(s) {
  if (!s || typeof s !== 'string') return '';
  if (s.length <= 8) return '***';
  return s.slice(0, 4) + '***' + s.slice(-4);
}

function auditSources() {
  const sourceChecked = ['process.env', '.env', 'render.yaml', '.env.example'];
  let found = false;
  let kind = 'not_found';
  let safeToUseForBackup = false;
  let reason = '';

  // A) process.env (após dotenv)
  require('dotenv').config({ path: path.join(ROOT, '.env') });
  const fromEnv = process.env.DATABASE_URL;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.length > 30 && fromEnv.includes('postgresql') && !fromEnv.includes('seu_usuario') && !fromEnv.includes('sua_senha')) {
    found = true;
    kind = fs.existsSync(path.join(ROOT, '.env')) ? 'env_file' : 'env_runtime';
    safeToUseForBackup = true;
    reason = 'DATABASE_URL disponivel (origem: ' + kind + '); valor nao impresso.';
  }

  // B) arquivo .env na raiz do backend
  if (!found) {
    const envPath = path.join(ROOT, '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/^\s*DATABASE_URL\s*=\s*(.+?)\s*$/m);
      const value = match ? match[1].replace(/^["']|["']$/g, '').trim() : '';
      if (value.length > 30 && value.includes('postgresql') && !value.includes('seu_usuario') && !value.includes('sua_senha')) {
        found = true;
        kind = 'env_file';
        safeToUseForBackup = true;
        reason = 'DATABASE_URL presente em .env com valor nao-placeholder.';
      } else if (value.length > 0) {
        reason = ' .env existe mas DATABASE_URL parece placeholder ou invalido.';
      } else {
        reason = ' .env existe mas DATABASE_URL ausente ou vazio.';
      }
    } else {
      reason = ' .env nao encontrado na raiz do backend.';
    }
  }

  // C) render.yaml já verificado (apenas key, sem valor no repo)
  if (!found && !reason) reason = ' render.yaml referencia DATABASE_URL mas valor nao esta no repo (sync: false).';

  if (!found) {
    kind = 'not_found';
    safeToUseForBackup = false;
    if (!reason) reason = ' Nenhuma fonte valida de DATABASE_URL encontrada.';
  }

  const audit = {
    timestamp_utc: new Date().toISOString(),
    source_checked: sourceChecked,
    found_boolean: found,
    kind,
    safe_to_use_for_backup: safeToUseForBackup,
    reason: reason.trim(),
    env_file_exists: fs.existsSync(path.join(ROOT, '.env'))
  };
  fs.mkdirSync(DOCS_RELATORIOS, { recursive: true });
  fs.writeFileSync(path.join(DOCS_RELATORIOS, 'payout-v1_1-backup-source-audit.json'), JSON.stringify(audit, null, 2), 'utf8');
  return audit;
}

function runBackupTest() {
  require('dotenv').config({ path: path.join(ROOT, '.env') });
  const url = process.env.DATABASE_URL;
  const result = { timestamp_utc: new Date().toISOString(), success: false, error_redacted: null, path: null, size_bytes: null, sha256: null };

  if (!url || url.length < 30 || url.includes('seu_usuario')) {
    result.error_redacted = 'DATABASE_URL indisponivel ou placeholder.';
    fs.mkdirSync(DOCS_RELATORIOS, { recursive: true });
    fs.writeFileSync(path.join(DOCS_RELATORIOS, 'payout-v1_1-backup-test.json'), JSON.stringify(result, null, 2), 'utf8');
    return result;
  }

  const now = new Date();
  const YYYYMMDD = now.toISOString().slice(0, 10).replace(/-/g, '');
  const HHMM = now.toTimeString().slice(0, 5).replace(':', '');
  const outFile = path.join(BACKUPS_DIR, `PAYOUT-V1_1-prod-backup-${YYYYMMDD}-${HHMM}.sql`);

  try {
    fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    const { execSync } = require('child_process');
    const env = { ...process.env, DATABASE_URL: url };
    const outArg = outFile.replace(/"/g, '\\"');
    if (process.platform === 'win32') {
      execSync('pg_dump "%DATABASE_URL%" --no-owner --no-acl -f "' + outArg + '"', { stdio: 'pipe', shell: true, env });
    } else {
      execSync('pg_dump "$DATABASE_URL" --no-owner --no-acl -f "' + outArg + '"', { stdio: 'pipe', env });
    }
    const stat = fs.statSync(outFile);
    const buf = fs.readFileSync(outFile);
    result.success = true;
    result.path = path.relative(ROOT, outFile).replace(/\\/g, '/');
    result.size_bytes = stat.size;
    result.sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  } catch (e) {
    result.error_redacted = (e.message || String(e)).replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***@').slice(0, 200);
  }

  fs.mkdirSync(DOCS_RELATORIOS, { recursive: true });
  fs.writeFileSync(path.join(DOCS_RELATORIOS, 'payout-v1_1-backup-test.json'), JSON.stringify(result, null, 2), 'utf8');
  return result;
}

const mode = process.argv[2] || 'audit';
if (mode === 'audit') {
  auditSources();
} else if (mode === 'backup') {
  runBackupTest();
} else if (mode === 'full') {
  const audit = auditSources();
  let backupResult = { success: false };
  if (audit.safe_to_use_for_backup) {
    backupResult = runBackupTest();
  }
  const ready = {
    timestamp_utc: new Date().toISOString(),
    BACKUP_READY: audit.safe_to_use_for_backup && backupResult.success,
    source_audit_found: audit.found_boolean,
    backup_test_success: backupResult.success,
    env_updated: false
  };
  fs.writeFileSync(path.join(DOCS_RELATORIOS, 'payout-v1_1-backup-ready.json'), JSON.stringify(ready, null, 2), 'utf8');
}
