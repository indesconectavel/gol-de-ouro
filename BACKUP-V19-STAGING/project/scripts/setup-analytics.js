/**
 * Script de Configuração do Sistema de Analytics
 * ETAPA 5 - Analytics e Monitoramento
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configurando Sistema de Analytics e Monitoramento...\n');

// Verificar se o diretório de logs existe
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
  console.log('✅ Diretório de logs criado');
} else {
  console.log('✅ Diretório de logs já existe');
}

// Criar arquivos de log iniciais
const logFiles = [
  'application.log',
  'error.log',
  'analytics.log',
  'performance.log',
  'security.log'
];

logFiles.forEach(file => {
  const filePath = path.join(logsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '');
    console.log(`✅ Arquivo de log criado: ${file}`);
  } else {
    console.log(`✅ Arquivo de log já existe: ${file}`);
  }
});

// Verificar dependências
const packageJson = require('./package.json');
const requiredDeps = [
  'winston',
  'prom-client',
  'node-cron',
  'compression'
];

console.log('\n📦 Verificando dependências...');
let allDepsInstalled = true;

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep]) {
    console.log(`✅ ${dep} está instalado`);
  } else {
    console.log(`❌ ${dep} não está instalado`);
    allDepsInstalled = false;
  }
});

if (!allDepsInstalled) {
  console.log('\n⚠️  Algumas dependências estão faltando. Execute:');
  console.log('npm install winston prom-client node-cron compression');
}

// Verificar estrutura de diretórios
const requiredDirs = [
  'src/utils',
  'middlewares',
  'routes',
  'public'
];

console.log('\n📁 Verificando estrutura de diretórios...');
requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`✅ ${dir}/ existe`);
  } else {
    console.log(`❌ ${dir}/ não existe`);
  }
});

// Verificar arquivos de configuração
const configFiles = [
  'src/utils/logger.js',
  'src/utils/metrics.js',
  'src/utils/analytics.js',
  'src/utils/monitoring.js',
  'middlewares/analyticsMiddleware.js',
  'routes/analyticsRoutes.js',
  'routes/monitoringDashboard.js',
  'public/monitoring.html'
];

console.log('\n📄 Verificando arquivos de configuração...');
configFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} existe`);
  } else {
    console.log(`❌ ${file} não existe`);
  }
});

// Criar arquivo de configuração de exemplo
const envExample = `
# Configurações de Analytics e Monitoramento
LOG_LEVEL=info
ADMIN_TOKEN=seu_token_admin_aqui
MONITORING_ENABLED=true
ANALYTICS_ENABLED=true
PROMETHEUS_ENABLED=true
`;

const envPath = path.join(__dirname, '../.env.example');
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envExample);
  console.log('\n✅ Arquivo .env.example criado com configurações de exemplo');
}

console.log('\n🎉 Configuração do Sistema de Analytics concluída!');
console.log('\n📋 Próximos passos:');
console.log('1. Instale as dependências: npm install');
console.log('2. Configure as variáveis de ambiente no arquivo .env');
console.log('3. Inicie o servidor: npm start');
console.log('4. Acesse o dashboard: http://localhost:3000/monitoring');
console.log('5. Visualize métricas: http://localhost:3000/api/analytics/metrics');

console.log('\n🔧 Endpoints disponíveis:');
console.log('- Dashboard: /monitoring');
console.log('- Métricas Prometheus: /api/analytics/metrics');
console.log('- Status do sistema: /api/analytics/status');
console.log('- Relatórios: /api/analytics/reports/daily');
console.log('- Alertas: /api/analytics/alerts');
console.log('- Health check: /health');
