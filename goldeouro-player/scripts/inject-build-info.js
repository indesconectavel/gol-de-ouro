// Script para injetar informações de build no Vite
// Gera automaticamente VITE_BUILD_VERSION, VITE_BUILD_DATE e VITE_BUILD_TIME

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Obter data e hora atual no fuso horário de São Paulo
const now = new Date();
const saoPauloTime = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}).formatToParts(now);

const buildDate = `${saoPauloTime.find(p => p.type === 'day').value}/${saoPauloTime.find(p => p.type === 'month').value}/${saoPauloTime.find(p => p.type === 'year').value}`;
const buildTime = `${saoPauloTime.find(p => p.type === 'hour').value}:${saoPauloTime.find(p => p.type === 'minute').value}`;
let buildVersion = 'v1.2.0';

// Ler package.json para obter versão
const packageJsonPath = join(__dirname, '..', 'package.json');
let version = buildVersion;
if (existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    if (packageJson.version) {
      version = `v${packageJson.version}`;
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível ler package.json, usando versão padrão');
  }
}

// Criar arquivo .env.local com as variáveis de build
const envPath = join(__dirname, '..', '.env.local');
const envContent = `# Variáveis de build injetadas automaticamente
# Gerado em: ${new Date().toISOString()}
VITE_BUILD_VERSION=${version}
VITE_BUILD_DATE=${buildDate}
VITE_BUILD_TIME=${buildTime}
`;

writeFileSync(envPath, envContent, 'utf-8');

console.log('✅ Informações de build injetadas:');
console.log(`   Versão: ${version}`);
console.log(`   Data: ${buildDate}`);
console.log(`   Hora: ${buildTime}`);
console.log(`   Arquivo: ${envPath}`);

