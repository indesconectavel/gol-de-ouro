/**
 * VALIDATE ENVIRONMENT V19 - Validação completa do ambiente para ENGINE V19
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

const validationReport = {
  timestamp: new Date().toISOString(),
  etapa: 'VALIDACAO_AMBIENTE',
  resultados: {},
  erros: [],
  warnings: []
};

async function validarDATABASE_URL() {
  console.log('🔍 Validando DATABASE_URL...');
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    validationReport.erros.push('DATABASE_URL não configurada');
    return { success: false, error: 'DATABASE_URL não encontrada' };
  }
  
  // Validar formato
  const urlPattern = /^postgresql:\/\/[^:]+:[^@]+@([^:]+):(\d+)\/(.+)$/;
  const match = dbUrl.match(urlPattern);
  
  if (!match) {
    validationReport.erros.push('DATABASE_URL com formato inválido');
    return { success: false, error: 'Formato inválido' };
  }
  
  const [, host, port, database] = match;
  
  // Validar host Supabase
  if (!host.includes('supabase.co')) {
    validationReport.warnings.push('Host não parece ser Supabase');
  }
  
  // Validar porta Session Pooler
  const isPooler = port === '6543';
  const isDirect = port === '5432';
  
  if (!isPooler && !isDirect) {
    validationReport.warnings.push(`Porta ${port} não é padrão (5432 ou 6543)`);
  }
  
  // Validar SSL
  const hasSSL = dbUrl.includes('sslmode=require') || dbUrl.includes('ssl=true');
  
  const resultado = {
    success: true,
    host,
    port,
    database,
    isPooler,
    isDirect,
    hasSSL
  };
  
  console.log(`✅ DATABASE_URL válida:`);
  console.log(`   Host: ${host}`);
  console.log(`   Porta: ${port} ${isPooler ? '(Session Pooler)' : isDirect ? '(Direct)' : ''}`);
  console.log(`   Banco: ${database}`);
  console.log(`   SSL: ${hasSSL ? 'SIM' : 'NÃO'}`);
  
  validationReport.resultados.database_url = resultado;
  return resultado;
}

async function testarSupabaseClient() {
  console.log('\n🔍 Testando Supabase Client (REST API)...');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    validationReport.erros.push('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
    return { success: false, error: 'Credenciais Supabase não encontradas' };
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar conexão
    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') {
      validationReport.erros.push(`Erro Supabase Client: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    console.log('✅ Supabase Client funcionando');
    validationReport.resultados.supabase_client = { success: true };
    return { success: true };
  } catch (error) {
    validationReport.erros.push(`Exceção Supabase Client: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testarPooler() {
  console.log('\n🔍 Testando conexão ao Session Pooler...');
  
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    return { success: false, error: 'DATABASE_URL não configurada' };
  }
  
  try {
    const client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    
    await client.connect();
    const res = await client.query('SELECT NOW() as current_time');
    await client.end();
    
    console.log('✅ Session Pooler acessível');
    console.log(`   Timestamp: ${res.rows[0].current_time}`);
    
    validationReport.resultados.pooler = { success: true, timestamp: res.rows[0].current_time };
    return { success: true };
  } catch (error) {
    console.log(`⚠️  Session Pooler não acessível: ${error.message}`);
    console.log('   Nota: Migrations podem ser executadas via Supabase Dashboard');
    
    validationReport.warnings.push(`Pooler não acessível: ${error.message}`);
    validationReport.resultados.pooler = { success: false, error: error.message };
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DE AMBIENTE V19');
  console.log('============================================================\n');
  
  // Validar DATABASE_URL
  const dbResult = await validarDATABASE_URL();
  if (!dbResult.success) {
    console.error('\n❌ ERRO CRÍTICO: DATABASE_URL inválida');
    console.error('   Solução: Configure DATABASE_URL no .env.local');
    process.exit(1);
  }
  
  // Testar Supabase Client
  const supabaseResult = await testarSupabaseClient();
  if (!supabaseResult.success) {
    console.error('\n❌ ERRO CRÍTICO: Supabase Client não funciona');
    console.error('   Solução: Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  // Testar Pooler (não crítico)
  await testarPooler();
  
  // Resumo
  console.log('\n============================================================');
  console.log(' RESUMO DA VALIDAÇÃO');
  console.log('============================================================');
  console.log(`✅ DATABASE_URL: ${dbResult.success ? 'VÁLIDA' : 'INVÁLIDA'}`);
  console.log(`✅ Supabase Client: ${supabaseResult.success ? 'FUNCIONANDO' : 'FALHOU'}`);
  console.log(`⚠️  Pooler: ${validationReport.resultados.pooler?.success ? 'ACESSÍVEL' : 'NÃO ACESSÍVEL (não bloqueador)'}`);
  
  if (validationReport.erros.length > 0) {
    console.log('\n❌ ERROS CRÍTICOS:');
    validationReport.erros.forEach(e => console.log(`   - ${e}`));
    process.exit(1);
  }
  
  if (validationReport.warnings.length > 0) {
    console.log('\n⚠️  AVISOS:');
    validationReport.warnings.forEach(w => console.log(`   - ${w}`));
  }
  
  console.log('\n✅ Ambiente validado e pronto para ENGINE V19');
  
  // Salvar relatório
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, '..', '..', 'logs', 'validation_v19.json');
  await fs.promises.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.promises.writeFile(reportPath, JSON.stringify(validationReport, null, 2));
  
  return validationReport;
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro na validação:', error);
    process.exit(1);
  });
}

module.exports = { main, validarDATABASE_URL, testarSupabaseClient, testarPooler };

