// Script para Criar Arquivo .env Interativamente
// FASE 2.5 - Setup de Ambiente

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function createEnvFile() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔧 CRIAÇÃO DE ARQUIVO .env PARA TESTES');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log('⚠️ IMPORTANTE: Use credenciais de usuário EXISTENTE no staging');
  console.log('   Ou crie manualmente via UI antes de continuar');
  console.log('');

  const env = {
    STAGING_BASE_URL: 'https://goldeouro-backend-v2.fly.dev'
  };

  // Player Email
  const playerEmail = await question('📧 Email do Player de teste: ');
  env.TEST_PLAYER_EMAIL = playerEmail || 'teste.player@example.com';

  // Player Password
  const playerPassword = await question('🔑 Senha do Player de teste: ');
  env.TEST_PLAYER_PASSWORD = playerPassword || 'senha123';

  console.log('');

  // Admin Email
  const adminEmail = await question('📧 Email do Admin de teste (ou Enter para usar padrão): ');
  env.TEST_ADMIN_EMAIL = adminEmail || 'admin@example.com';

  // Admin Password
  const adminPassword = await question('🔑 Senha do Admin de teste (ou Enter para usar padrão): ');
  env.TEST_ADMIN_PASSWORD = adminPassword || 'admin123';

  // Admin Token
  const adminToken = await question('🔐 Token Admin (ou Enter para usar padrão): ');
  env.TEST_ADMIN_TOKEN = adminToken || 'goldeouro123';

  // Verbose
  const verbose = await question('📝 Modo verbose? (s/N): ');
  env.VERBOSE = verbose.toLowerCase() === 's' ? 'true' : 'false';

  rl.close();

  // Criar conteúdo do arquivo .env
  const envContent = Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Salvar arquivo
  const envPath = path.join(__dirname, '../.env');
  fs.writeFileSync(envPath, envContent, 'utf-8');

  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('✅ Arquivo .env criado com sucesso!');
  console.log(`📄 Localização: ${envPath}`);
  console.log('');
  console.log('⚠️ LEMBRE-SE: NÃO COMMITAR O ARQUIVO .env NO GIT');
  console.log('═══════════════════════════════════════════════════════');

  return envPath;
}

// Executar se chamado diretamente
if (require.main === module) {
  createEnvFile()
    .then(() => {
      console.log('');
      console.log('🚀 Próximo passo: Executar testes com "npm test"');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = createEnvFile;

