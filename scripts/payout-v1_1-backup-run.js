/**
 * One-off: backup DB para deploy seguro V1.1. Usa DATABASE_URL do .env sem imprimir.
 * Escreve backups/PAYOUT-V1_1-prod-backup-YYYYMMDD-HHMM.sql e docs/relatorios/payout-v1_1-backup.json
 */
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const crypto = require('crypto');

require('dotenv').config();
const url = process.env.DATABASE_URL;
if (!url || typeof url !== 'string') {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const now = new Date();
const YYYYMMDD = now.toISOString().slice(0, 10).replace(/-/g, '');
const HHMM = now.toTimeString().slice(0, 5).replace(':', '');
const dir = path.join(__dirname, '..', 'backups');
const outFile = path.join(dir, `PAYOUT-V1_1-prod-backup-${YYYYMMDD}-${HHMM}.sql`);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const env = { ...process.env, DATABASE_URL: url };
const outArg = outFile.replace(/"/g, '\\"');
try {
  if (process.platform === 'win32') {
    execSync('pg_dump "%DATABASE_URL%" --no-owner --no-acl -f "' + outArg + '"', { stdio: 'pipe', shell: true, env });
  } else {
    execSync('pg_dump "$DATABASE_URL" --no-owner --no-acl -f "' + outArg + '"', { stdio: 'pipe', env });
  }
} catch (e) {
  console.error('pg_dump failed');
  process.exit(1);
}

const stat = fs.statSync(outFile);
const size = stat.size;
const buf = fs.readFileSync(outFile);
const sha256 = crypto.createHash('sha256').update(buf).digest('hex');

const relPath = path.relative(path.join(__dirname, '..'), outFile);
const jsonPath = path.join(__dirname, '..', 'docs', 'relatorios', 'payout-v1_1-backup.json');
const json = {
  backup_path: relPath.replace(/\\/g, '/'),
  backup_path_absolute: outFile,
  size_bytes: size,
  sha256,
  timestamp_utc: now.toISOString()
};
fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf8');
console.log('OK');
