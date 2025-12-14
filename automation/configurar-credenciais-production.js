/**
 * CONFIGURAR CREDENCIAIS PRODUCTION
 * Script auxiliar para configurar credenciais de production no .env
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ENV_FILE = path.join(__dirname, '../.env');
const ENV_EXAMPLE = path.join(__dirname, '../env.example');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function configurarCredenciais() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  CONFIGURAÇÃO DE CREDENCIAIS PRODUCTION');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Verificar se .env existe
  let envContent = '';
  if (fs.existsSync(ENV_FILE)) {
    envContent = fs.readFileSync(ENV_FILE, 'utf8');
    console.log('✅ Arquivo .env encontrado\n');
  } else {
    console.log('⚠️  Arquivo .env não encontrado. Criando novo arquivo...\n');
    // Copiar do env.example se existir
    if (fs.existsSync(ENV_EXAMPLE)) {
      envContent = fs.readFileSync(ENV_EXAMPLE, 'utf8');
    }
  }

  // Verificar credenciais existentes
  const hasStagingKey = envContent.includes('SUPABASE_STAGING_SERVICE_ROLE_KEY') || 
                       envContent.includes('SUPABASE_SERVICE_ROLE_KEY');
  const hasProductionKey = envContent.includes('SUPABASE_PRODUCTION_SERVICE_ROLE_KEY');

  console.log('Status atual:');
  console.log(`  Staging Key: ${hasStagingKey ? '✅ Configurada' : '❌ Não configurada'}`);
  console.log(`  Production Key: ${hasProductionKey ? '✅ Configurada' : '❌ Não configurada'}\n`);

  // Solicitar credenciais
  console.log('Para obter as credenciais:');
  console.log('1. Acesse: https://app.supabase.com');
  console.log('2. Selecione o projeto goldeouro-production');
  console.log('3. Vá em Settings → API');
  console.log('4. Copie a Service Role Key (secret)\n');

  const productionKey = await question('Cole a Service Role Key de PRODUCTION (ou pressione Enter para pular): ');
  
  if (!productionKey.trim()) {
    console.log('\n⚠️  Configuração cancelada. Nenhuma alteração foi feita.');
    rl.close();
    return;
  }

  // Atualizar ou adicionar credencial
  let newEnvContent = envContent;

  // Remover linha antiga se existir
  newEnvContent = newEnvContent.replace(/SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=.*/g, '');
  newEnvContent = newEnvContent.replace(/SUPABASE_STAGING_SERVICE_ROLE_KEY=.*/g, '');

  // Adicionar novas credenciais
  if (!newEnvContent.includes('SUPABASE_PRODUCTION_SERVICE_ROLE_KEY')) {
    newEnvContent += `\n# Supabase Production Credentials\n`;
    newEnvContent += `SUPABASE_PRODUCTION_SERVICE_ROLE_KEY=${productionKey.trim()}\n`;
  }

  // Se não tiver staging key, usar a mesma (se for a mesma chave)
  if (!newEnvContent.includes('SUPABASE_SERVICE_ROLE_KEY') && !newEnvContent.includes('SUPABASE_STAGING_SERVICE_ROLE_KEY')) {
    const useSameKey = await question('\nDeseja usar a mesma chave para STAGING? (s/n): ');
    if (useSameKey.toLowerCase() === 's') {
      newEnvContent += `SUPABASE_STAGING_SERVICE_ROLE_KEY=${productionKey.trim()}\n`;
    } else {
      const stagingKey = await question('Cole a Service Role Key de STAGING: ');
      if (stagingKey.trim()) {
        newEnvContent += `SUPABASE_STAGING_SERVICE_ROLE_KEY=${stagingKey.trim()}\n`;
      }
    }
  }

  // Salvar arquivo
  fs.writeFileSync(ENV_FILE, newEnvContent, 'utf8');
  console.log('\n✅ Credenciais configuradas com sucesso!');
  console.log(`   Arquivo salvo em: ${ENV_FILE}\n`);

  // Validar formato da chave
  if (productionKey.trim().startsWith('eyJ')) {
    console.log('✅ Formato da chave parece correto (JWT)\n');
  } else {
    console.log('⚠️  Formato da chave pode estar incorreto. Verifique se é uma JWT válida.\n');
  }

  // Perguntar se deseja testar
  const testar = await question('Deseja testar a conexão agora? (s/n): ');
  if (testar.toLowerCase() === 's') {
    console.log('\n🧪 Testando conexão com production...\n');
    rl.close();
    
    // Executar teste
    const { testPIXFlow } = require('./teste_pix_v19');
    testPIXFlow('production')
      .then(results => {
        if (results.success) {
          console.log('\n✅ Conexão com production funcionando!');
        } else {
          console.log('\n⚠️  Alguns testes falharam. Verifique os logs.');
        }
        process.exit(results.success ? 0 : 1);
      })
      .catch(error => {
        console.error('\n❌ Erro ao testar:', error.message);
        process.exit(1);
      });
  } else {
    rl.close();
    console.log('\n✅ Configuração concluída!');
    console.log('   Execute: node automation/teste_pix_v19.js production');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  configurarCredenciais().catch(error => {
    console.error('Erro:', error);
    rl.close();
    process.exit(1);
  });
}

module.exports = { configurarCredenciais };

