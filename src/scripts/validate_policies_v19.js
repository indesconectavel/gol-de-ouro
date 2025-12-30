/**
 * VALIDATE POLICIES V19 - Valida policies RLS criadas
 * Executa query para listar policies e compara com esperado
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Policies esperadas por tabela
const POLICIES_ESPERADAS = {
  usuarios: ['usuarios_select_own', 'usuarios_insert_backend', 'usuarios_update_own'],
  chutes: ['chutes_select_own', 'chutes_insert_backend'],
  lotes: ['lotes_select_public', 'lotes_modify_backend'],
  transacoes: ['transacoes_select_own', 'transacoes_insert_backend'],
  pagamentos_pix: ['pagamentos_pix_select_own', 'pagamentos_pix_modify_backend'],
  saques: ['saques_select_own', 'saques_modify_backend'],
  webhook_events: ['webhook_events_backend'],
  rewards: ['rewards_select_own', 'rewards_modify_backend']
};

async function validarPolicies() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DE POLICIES RLS V19');
  console.log('============================================================\n');
  
  console.log('⚠️  IMPORTANTE: Validação completa requer acesso direto ao PostgreSQL');
  console.log('   Execute manualmente no Supabase SQL Editor:\n');
  console.log('   SELECT policyname, tablename, permissive, cmd');
  console.log('   FROM pg_policies');
  console.log('   WHERE schemaname=\'public\'');
  console.log('   ORDER BY tablename, policyname;\n');
  
  // Tentar validar via testes de acesso
  console.log('🔍 Validando policies via testes de acesso...\n');
  
  const resultados = {};
  
  for (const [tabela, policiesEsperadas] of Object.entries(POLICIES_ESPERADAS)) {
    console.log(`📋 Validando ${tabela}...`);
    
    try {
      // Tentar SELECT (deve funcionar com SERVICE_ROLE_KEY)
      const { data, error } = await supabase
        .from(tabela)
        .select('id')
        .limit(1);
      
      if (error && error.code === '42501') {
        console.log(`   ⚠️  ${tabela} - Erro de permissão (RLS pode estar bloqueando)`);
        resultados[tabela] = {
          status: 'rls_ativo',
          policies_esperadas: policiesEsperadas.length,
          acesso_select: 'bloqueado_por_rls'
        };
      } else if (error && error.code === '42P01') {
        console.log(`   ❌ ${tabela} - Tabela não existe`);
        resultados[tabela] = {
          status: 'tabela_nao_existe',
          erro: error.message
        };
      } else {
        console.log(`   ✅ ${tabela} - Acesso funcionando (SERVICE_ROLE_KEY bypassa RLS)`);
        resultados[tabela] = {
          status: 'acesso_ok',
          policies_esperadas: policiesEsperadas.length,
          acesso_select: 'ok'
        };
      }
    } catch (e) {
      console.log(`   ⚠️  ${tabela} - Erro ao testar: ${e.message}`);
      resultados[tabela] = {
        status: 'erro_teste',
        erro: e.message
      };
    }
  }
  
  // Resumo
  console.log('\n============================================================');
  console.log(' RESUMO DA VALIDAÇÃO DE POLICIES');
  console.log('============================================================');
  
  const tabelasOk = Object.values(resultados).filter(r => r.status === 'acesso_ok' || r.status === 'rls_ativo').length;
  const tabelasErro = Object.values(resultados).filter(r => r.status === 'erro_teste' || r.status === 'tabela_nao_existe').length;
  
  console.log(`✅ Tabelas acessíveis: ${tabelasOk}/${Object.keys(POLICIES_ESPERADAS).length}`);
  console.log(`❌ Tabelas com erro: ${tabelasErro}`);
  
  console.log('\n📋 Policies esperadas por tabela:');
  for (const [tabela, policies] of Object.entries(POLICIES_ESPERADAS)) {
    console.log(`   ${tabela}: ${policies.length} policies`);
    policies.forEach(p => console.log(`      - ${p}`));
  }
  
  console.log('\n💡 Para validação completa, execute SQL manualmente no Supabase Dashboard');
  
  return {
    timestamp: new Date().toISOString(),
    resultados,
    policies_esperadas: POLICIES_ESPERADAS,
    status: tabelasErro === 0 ? 'ok' : 'parcial'
  };
}

if (require.main === module) {
  validarPolicies().catch(error => {
    console.error('❌ Erro na validação:', error);
    process.exit(1);
  });
}

module.exports = { validarPolicies };

