// Script para injetar informações de build no Vite (CommonJS)
// Gera automaticamente VITE_BUILD_VERSION, VITE_BUILD_DATE e VITE_BUILD_TIME
// Versão CommonJS para compatibilidade com Vercel

const { writeFileSync, readFileSync, existsSync } = require('fs');
const { join } = require('path');

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

// Tentar obter diretório atual (funciona tanto localmente quanto no Vercel)
let projectRoot;
try {
  // Tentar usar __dirname (CommonJS)
  projectRoot = __dirname.replace(/[\\/]scripts$/, '');
} catch (e) {
  // Fallback: usar process.cwd()
  projectRoot = process.cwd();
}

// Ler package.json para obter versão
const packageJsonPath = join(projectRoot, 'package.json');
if (existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    if (packageJson.version) {
      buildVersion = `v${packageJson.version}`;
    }
  } catch (error) {
    console.warn('⚠️ Não foi possível ler package.json, usando versão padrão');
  }
}

// Criar arquivo .env.local com as variáveis de build
const envPath = join(projectRoot, '.env.local');
const envContent = `# Variáveis de build injetadas automaticamente
# Gerado em: ${new Date().toISOString()}
VITE_BUILD_VERSION=${buildVersion}
VITE_BUILD_DATE=${buildDate}
VITE_BUILD_TIME=${buildTime}
`;

try {
  writeFileSync(envPath, envContent, 'utf-8');
  console.log('✅ Informações de build injetadas:');
  console.log(`   Versão: ${buildVersion}`);
  console.log(`   Data: ${buildDate}`);
  console.log(`   Hora: ${buildTime}`);
  console.log(`   Arquivo: ${envPath}`);
} catch (error) {
  console.warn('⚠️ Não foi possível criar .env.local, continuando sem ele');
  console.warn(`   Erro: ${error.message}`);
  // Não falhar o build se não conseguir criar o arquivo
  process.exit(0);
}

