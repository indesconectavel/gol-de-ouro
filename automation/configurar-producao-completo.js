// Configurar Produção Completo - Engine V19
// Configura credenciais e executa próximos passos críticos

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SUPABASE_URL_PROD = 'https://gayopagjdrkcmkirmfvy.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY_PROD = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjk4ODExOCwiZXhwIjoyMDc4MzQ4MTE4fQ.rbKsVW3reCCXDnAwM8S2BPAc_xl9SEVheqUODIlnNLQ';
const SUPABASE_ANON_KEY_PROD = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5ODgxMTgsImV4cCI6MjA3ODM0ODExOH0.-a77burppAn_9-QtkDpI2TrZrKKECSKyqwbsP7uG3Wc';

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env');

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const icon = level === 'SUCCESS' ? '✅' : level === 'ERROR' ? '❌' : level === 'WARN' ? '⚠️' : 'ℹ️';
  console.log(`${icon} [${timestamp}] ${message}`);
}

function configurarCredenciais() {
  log('=== CONFIGURANDO CREDENCIAIS PRODUCTION ===', 'INFO');
  
  let envContent = '';
  const envLines = [];
  
  // Ler .env existente se houver
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    // Remover linhas antigas de produção
    for (const line of lines) {
      if (!line.trim() || 
          line.startsWith('#') ||
          line.includes('SUPABASE_URL_PROD') ||
          line.includes('SUPABASE_SERVICE_ROLE_KEY_PROD') ||
          line.includes('SUPABASE_ANON_KEY_PROD') ||
          line.includes('SUPABASE_PRODUCTION_URL') ||
          line.includes('SUPABASE_PRODUCTION_SERVICE_ROLE_KEY') ||
          line.includes('SUPABASE_PRODUCTION_ANON_KEY')) {
        continue;
      }
      envLines.push(line);
    }
  } else {
    // Criar .env básico se não existir
    envLines.push('# Gol de Ouro - Configurações de Ambiente');
    envLines.push('# Engine V19');
    envLines.push('');
  }
  
  // Adicionar credenciais de produção
  envLines.push('# Supabase Production (goldeouro-production)');
  envLines.push(`SUPABASE_URL_PROD=${SUPABASE_URL_PROD}`);
  envLines.push(`SUPABASE_SERVICE_ROLE_KEY_PROD=${SUPABASE_SERVICE_ROLE_KEY_PROD}`);
  envLines.push(`SUPABASE_ANON_KEY_PROD=${SUPABASE_ANON_KEY_PROD}`);
  envLines.push('');
  
  // Adicionar fallbacks
  envLines.push('# Fallbacks (usados se variáveis específicas não estiverem definidas)');
  envLines.push(`SUPABASE_URL=${SUPABASE_URL_PROD}`);
  envLines.push(`SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY_PROD}`);
  envLines.push(`SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY_PROD}`);
  envLines.push('');
  
  // Salvar .env
  fs.writeFileSync(envPath, envLines.join('\n'), 'utf8');
  log(`Credenciais salvas em: ${envPath}`, 'SUCCESS');
  
  // Validar formato
  if (SUPABASE_URL_PROD.startsWith('https://') && SUPABASE_SERVICE_ROLE_KEY_PROD.length > 100) {
    log('Formato das credenciais válido', 'SUCCESS');
  } else {
    log('Formato das credenciais pode estar incorreto', 'WARN');
  }
}

async function testarConexaoSupabase() {
  log('=== TESTANDO CONEXÃO SUPABASE PRODUCTION ===', 'INFO');
  
  try {
    // Carregar .env
    require('dotenv').config({ path: envPath });
    
    const { getClient } = require('./lib/supabase-client');
    const client = getClient('PROD');
    
    // Testar conexão básica
    const { data, error } = await client
      .from('system_heartbeat')
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      log('Conexão OK, mas tabela system_heartbeat não encontrada (pode ser normal)', 'WARN');
      return true;
    } else if (error) {
      log(`Erro na conexão: ${error.message}`, 'ERROR');
      return false;
    } else {
      log('Conexão com Supabase Production estabelecida com sucesso!', 'SUCCESS');
      return true;
    }
  } catch (error) {
    log(`Erro ao testar conexão: ${error.message}`, 'ERROR');
    return false;
  }
}

function verificarDependenciasApp() {
  log('=== VERIFICANDO DEPENDÊNCIAS DO APP ===', 'INFO');
  
  const mobileDir = path.join(rootDir, 'goldeouro-mobile');
  
  if (!fs.existsSync(mobileDir)) {
    log('Diretório goldeouro-mobile não encontrado', 'WARN');
    return false;
  }
  
  const nodeModulesPath = path.join(mobileDir, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    log('node_modules não encontrado. Instalando dependências...', 'INFO');
    try {
      execSync('npm install', { 
        cwd: mobileDir, 
        stdio: 'inherit',
        shell: true
      });
      log('Dependências instaladas com sucesso!', 'SUCCESS');
      return true;
    } catch (error) {
      log(`Erro ao instalar dependências: ${error.message}`, 'ERROR');
      return false;
    }
  } else {
    log('Dependências já instaladas', 'SUCCESS');
    return true;
  }
}

async function verificarMigrationsV19() {
  log('=== VERIFICANDO MIGRATIONS V19 ===', 'INFO');
  
  try {
    const { getClient } = require('./lib/supabase-client');
    const client = getClient('PROD');
    
    // Verificar tabelas V19
    const tabelasV19 = ['lotes', 'rewards', 'webhook_events', 'system_heartbeat'];
    let todasExistem = true;
    
    for (const tabela of tabelasV19) {
      const { data, error } = await client
        .from(tabela)
        .select('*')
        .limit(1);
      
      if (error && error.code === 'PGRST116') {
        log(`Tabela ${tabela} não encontrada`, 'WARN');
        todasExistem = false;
      } else if (error) {
        log(`Erro ao verificar ${tabela}: ${error.message}`, 'WARN');
      } else {
        log(`Tabela ${tabela} existe`, 'SUCCESS');
      }
    }
    
    // Verificar RPCs críticas
    const rpcsCriticas = ['rpc_get_balance', 'rpc_add_balance', 'rpc_get_or_create_lote'];
    
    for (const rpc of rpcsCriticas) {
      try {
        // Tentar chamar com parâmetros inválidos (esperamos erro de validação, não "não existe")
        const { error } = await client.rpc(rpc, { p_user_id: '00000000-0000-0000-0000-000000000000' });
        
        if (error && error.message.includes('does not exist')) {
          log(`RPC ${rpc} não encontrada`, 'WARN');
          todasExistem = false;
        } else {
          log(`RPC ${rpc} existe`, 'SUCCESS');
        }
      } catch (rpcError) {
        // Se não conseguir chamar, pode ser que não exista
        log(`RPC ${rpc} pode não existir: ${rpcError.message}`, 'WARN');
      }
    }
    
    if (!todasExistem) {
      log('Algumas migrations V19 podem não estar aplicadas', 'WARN');
      log('Consulte: docs/GUIA-PRODUCAO-V19.md para aplicar migrations', 'INFO');
    } else {
      log('Migrations V19 parecem estar aplicadas', 'SUCCESS');
    }
    
    return todasExistem;
  } catch (error) {
    log(`Erro ao verificar migrations: ${error.message}`, 'ERROR');
    return false;
  }
}

async function executarValidacao() {
  log('=== EXECUTANDO VALIDAÇÃO COMPLETA ===', 'INFO');
  
  try {
    const { executarValidacaoCompleta } = require('./validar_fluxo_jogador_v19');
    const results = await executarValidacaoCompleta();
    
    if (results.summary.failed === 0) {
      log('✅ VALIDAÇÃO COMPLETA: Sistema 100% pronto!', 'SUCCESS');
      return true;
    } else {
      log(`⚠️ Validação encontrou ${results.summary.failed} falhas`, 'WARN');
      return false;
    }
  } catch (error) {
    log(`Erro ao executar validação: ${error.message}`, 'ERROR');
    return false;
  }
}

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  CONFIGURAÇÃO COMPLETA PRODUCTION - ENGINE V19');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  
  try {
    // Passo 1: Configurar credenciais
    configurarCredenciais();
    
    // Passo 2: Testar conexão
    const conexaoOK = await testarConexaoSupabase();
    if (!conexaoOK) {
      log('Conexão falhou, mas continuando...', 'WARN');
    }
    
    // Passo 3: Verificar dependências do app
    verificarDependenciasApp();
    
    // Passo 4: Verificar migrations V19
    await verificarMigrationsV19();
    
    // Passo 5: Executar validação completa
    console.log('');
    log('Executando validação completa...', 'INFO');
    await executarValidacao();
    
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  CONFIGURAÇÃO CONCLUÍDA');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 PRÓXIMOS PASSOS:');
    console.log('   1. Revisar relatório de validação');
    console.log('   2. Corrigir itens que falharam (se houver)');
    console.log('   3. Iniciar app: cd goldeouro-mobile && npx expo start');
    console.log('');
    
  } catch (error) {
    log(`Erro crítico: ${error.message}`, 'ERROR');
    console.error(error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

module.exports = { main, configurarCredenciais, testarConexaoSupabase };

