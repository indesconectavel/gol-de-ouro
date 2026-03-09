/**
 * PAYOUT V1.1 — Configuração segura de DATABASE_URL para destravar o backup.
 * NÃO imprime DATABASE_URL, senha, SUPABASE_URL, SERVICE_ROLE_KEY nem qualquer segredo.
 * Lê fontes: .env, .env.production (local e pai); copia DATABASE_URL para .env se faltar.
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const PARENT = path.join(ROOT, '..');
const DOCS = path.join(ROOT, 'docs', 'relatorios');
const BACKUPS = path.join(ROOT, 'backups');

function safeReadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function extractDatabaseUrl(content) {
  if (!content) return null;
  const m = content.match(/^\s*DATABASE_URL\s*=\s*(.+?)\s*$/m);
  if (!m) return null;
  const val = m[1].replace(/^["']|["']$/g, '').trim();
  if (val.length < 30 || !val.includes('postgresql') || val.includes('seu_usuario') || val.includes('sua_senha')) return null;
  return val;
}

function hasValidFormat(url) {
  return /^postgresql:\/\/[^:]+:[^@]+@[^/]+\/\w+/.test(url);
}

function detectSupabaseKeys(content) {
  if (!content) return { url: false, serviceRole: false };
  const hasUrl = /^\s*SUPABASE_URL\s*=\s*.+$/m.test(content) && !content.match(/SUPABASE_URL\s*=\s*https:\/\/your-project\.supabase\.co/m);
  const hasKey = /^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*.+$/m.test(content) && !content.match(/SUPABASE_SERVICE_ROLE_KEY\s*=\s*your-service/m);
  return { url: !!hasUrl, serviceRole: !!hasKey };
}

function gateEnvSecurity() {
  const gitignorePath = path.join(ROOT, '.gitignore');
  const envPath = path.join(ROOT, '.env');
  const hasGitignore = fs.existsSync(gitignorePath);
  const gitignoreContent = hasGitignore ? fs.readFileSync(gitignorePath, 'utf8') : '';
  const envListed = /^\s*\.env\s*$/m.test(gitignoreContent);
  const envExists = fs.existsSync(envPath);
  return { env_exists: envExists, env_in_gitignore: envListed, safe_to_write: envExists && envListed };
}

function run() {
  fs.mkdirSync(DOCS, { recursive: true });

  // --- PASSO 0 ---
  const gate = gateEnvSecurity();
  if (!gate.env_in_gitignore) {
    const out0 = { step: 'gate', safe: false, reason: '.env nao listado em .gitignore', abort: true };
    fs.writeFileSync(path.join(DOCS, 'payout-v1_1-dburl-write.json'), JSON.stringify({ ...gate, ...out0 }, null, 2), 'utf8');
    return;
  }
  if (!gate.env_exists) {
    fs.writeFileSync(path.join(ROOT, '.env'), '', 'utf8');
  }

  // --- PASSO 1 ---
  const envContent = safeReadEnvFile(path.join(ROOT, '.env'));
  const envProdLocal = safeReadEnvFile(path.join(ROOT, '.env.production'));
  const envProdParent = safeReadEnvFile(path.join(PARENT, '.env.production'));
  const supabaseFromEnv = detectSupabaseKeys(envContent || '');
  const supabaseFromProd = detectSupabaseKeys(envProdLocal || envProdParent || '');
  const sourceReport = {
    timestamp_utc: new Date().toISOString(),
    supabase_detected: supabaseFromEnv.url || supabaseFromProd.url || supabaseFromEnv.serviceRole || supabaseFromProd.serviceRole,
    source_type: envContent && extractDatabaseUrl(envContent) ? 'env' : (envProdLocal && extractDatabaseUrl(envProdLocal) ? 'env_production_local' : (envProdParent && extractDatabaseUrl(envProdParent) ? 'env_production_parent' : null))
  };
  fs.writeFileSync(path.join(DOCS, 'payout-v1_1-dburl-source.json'), JSON.stringify(sourceReport, null, 2), 'utf8');

  // --- PASSO 2 + 3: obter e escrever ---
  let databaseUrl = extractDatabaseUrl(envContent);
  let sourceUsed = 'env';
  if (!databaseUrl) {
    databaseUrl = extractDatabaseUrl(envProdLocal) || extractDatabaseUrl(envProdParent);
    sourceUsed = envProdLocal && extractDatabaseUrl(envProdLocal) ? 'env_production_local' : 'env_production_parent';
  }
  const detected = !!databaseUrl;
  const formatValid = databaseUrl ? hasValidFormat(databaseUrl) : false;

  let envUpdated = false;
  let writeReason = '';

  if (databaseUrl && formatValid && gate.safe_to_write) {
    const currentEnv = safeReadEnvFile(path.join(ROOT, '.env')) || '';
    const hasExisting = /^\s*DATABASE_URL\s*=/m.test(currentEnv);
    if (!hasExisting) {
      const line = 'DATABASE_URL=' + databaseUrl + '\n';
      fs.appendFileSync(path.join(ROOT, '.env'), line, 'utf8');
      envUpdated = true;
      writeReason = 'DATABASE_URL adicionada a partir de ' + sourceUsed + '. Valor nao impresso.';
    } else {
      writeReason = 'DATABASE_URL ja presente em .env.';
    }
  } else if (!databaseUrl) {
    writeReason = 'Nenhuma connection string valida encontrada em .env ou .env.production.';
  } else if (!formatValid) {
    writeReason = 'Formato da connection string invalido.';
  }

  const writeReport = {
    timestamp_utc: new Date().toISOString(),
    env_updated: envUpdated,
    reason: writeReason,
    source_used: databaseUrl ? sourceUsed : null,
    gate_safe_to_write: gate.safe_to_write,
    detected,
    format_valid: formatValid
  };
  fs.writeFileSync(path.join(DOCS, 'payout-v1_1-dburl-write.json'), JSON.stringify(writeReport, null, 2), 'utf8');

  // --- PASSO 4: backup ---
  if (!databaseUrl) {
    require('dotenv').config({ path: path.join(ROOT, '.env') });
    databaseUrl = process.env.DATABASE_URL;
  }
  const backupResult = { timestamp_utc: new Date().toISOString(), success: false, path: null, size_bytes: null, sha256: null, error_redacted: null };

  if (databaseUrl && databaseUrl.length > 30 && hasValidFormat(databaseUrl)) {
    const now = new Date();
    const YYYYMMDD = now.toISOString().slice(0, 10).replace(/-/g, '');
    const HHMM = now.toTimeString().slice(0, 5).replace(':', '');
    const outFile = path.join(BACKUPS, `PAYOUT-V1_1-prod-backup-${YYYYMMDD}-${HHMM}.sql`);
    try {
      fs.mkdirSync(BACKUPS, { recursive: true });
      const { execSync } = require('child_process');
      const env = { ...process.env, DATABASE_URL: databaseUrl };
      const outArg = outFile.replace(/"/g, '\\"');
      if (process.platform === 'win32') {
        execSync('pg_dump "%DATABASE_URL%" --no-owner --no-acl -f "' + outArg + '"', { stdio: 'pipe', shell: true, env });
      } else {
        execSync('pg_dump "$DATABASE_URL" --no-owner --no-acl -f "' + outArg + '"', { stdio: 'pipe', env });
      }
      const stat = fs.statSync(outFile);
      const buf = fs.readFileSync(outFile);
      backupResult.success = true;
      backupResult.path = path.relative(ROOT, outFile).replace(/\\/g, '/');
      backupResult.size_bytes = stat.size;
      backupResult.sha256 = crypto.createHash('sha256').update(buf).digest('hex');
    } catch (e) {
      backupResult.error_redacted = (e.message || String(e)).replace(/postgresql:\/\/[^@]+@/g, 'postgresql://***@').slice(0, 200);
    }
  } else {
    backupResult.error_redacted = 'DATABASE_URL indisponivel ou formato invalido.';
  }

  fs.writeFileSync(path.join(DOCS, 'payout-v1_1-backup-validation.json'), JSON.stringify(backupResult, null, 2), 'utf8');
}

run();
