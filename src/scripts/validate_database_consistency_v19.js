/**
 * VALIDATE DATABASE CONSISTENCY V19 - Valida consistência do banco após V19
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validarConsistencia() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DE CONSISTÊNCIA DO BANCO APÓS V19');
  console.log('============================================================\n');
  
  const resultados = {
    timestamp: new Date().toISOString(),
    validacoes: {},
    erros: [],
    warnings: []
  };
  
  // 1. Validar lotes ativos
  console.log('1️⃣ Validando lotes ativos...\n');
  try {
    const { data: lotes, error } = await supabase
      .from('lotes')
      .select('id, status, persisted_global_counter, posicao_atual, tamanho')
      .order('id', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error(`   ❌ Erro: ${error.message}`);
      resultados.erros.push(`Lotes: ${error.message}`);
    } else {
      console.log(`   ✅ ${lotes.length} lote(s) encontrado(s)`);
      if (lotes.length > 0) {
        console.log('\n   📊 Últimos 5 lotes:');
        lotes.slice(0, 5).forEach(lote => {
          console.log(`      - ID: ${lote.id}, Status: ${lote.status}, Posição: ${lote.posicao_atual}/${lote.tamanho || 'N/A'}, Counter: ${lote.persisted_global_counter || 0}`);
        });
        
        // Validar consistência
        const lotesInconsistentes = lotes.filter(l => 
          l.posicao_atual > (l.tamanho || 999999) ||
          l.persisted_global_counter < 0
        );
        
        if (lotesInconsistentes.length > 0) {
          console.log(`   ⚠️  ${lotesInconsistentes.length} lote(s) com inconsistências`);
          resultados.warnings.push(`${lotesInconsistentes.length} lotes inconsistentes`);
        } else {
          console.log('   ✅ Nenhuma inconsistência encontrada');
        }
      }
      
      resultados.validacoes.lotes = {
        total: lotes.length,
        ok: lotesInconsistentes?.length === 0
      };
    }
  } catch (e) {
    console.error(`   ❌ Exceção: ${e.message}`);
    resultados.erros.push(`Lotes: ${e.message}`);
  }
  
  // 2. Contadores globais
  console.log('\n2️⃣ Validando contadores globais...\n');
  
  const tabelas = ['lotes', 'chutes', 'transacoes'];
  const contadores = {};
  
  for (const tabela of tabelas) {
    try {
      const { count, error } = await supabase
        .from(tabela)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`   ❌ ${tabela}: ${error.message}`);
        resultados.erros.push(`${tabela}: ${error.message}`);
      } else {
        contadores[tabela] = count;
        console.log(`   ✅ ${tabela}: ${count} registro(s)`);
      }
    } catch (e) {
      console.error(`   ❌ ${tabela}: ${e.message}`);
      resultados.erros.push(`${tabela}: ${e.message}`);
    }
  }
  
  resultados.validacoes.contadores = contadores;
  
  // 3. Validar integridade referencial
  console.log('\n3️⃣ Validando integridade referencial...\n');
  
  try {
    // Verificar chutes órfãos (sem lote)
    const { data: chutesOrfaos, error: erroChutes } = await supabase
      .from('chutes')
      .select('id, lote_id')
      .limit(100);
    
    if (!erroChutes && chutesOrfaos) {
      // Verificar se lotes existem
      const loteIds = [...new Set(chutesOrfaos.map(c => c.lote_id))];
      const { data: lotesExistentes } = await supabase
        .from('lotes')
        .select('id')
        .in('id', loteIds);
      
      const lotesExistentesIds = new Set(lotesExistentes?.map(l => l.id) || []);
      const chutesOrfaosCount = chutesOrfaos.filter(c => !lotesExistentesIds.has(c.lote_id)).length;
      
      if (chutesOrfaosCount > 0) {
        console.log(`   ⚠️  ${chutesOrfaosCount} chute(s) órfão(s) encontrado(s)`);
        resultados.warnings.push(`${chutesOrfaosCount} chutes órfãos`);
      } else {
        console.log('   ✅ Nenhum chute órfão encontrado');
      }
    }
  } catch (e) {
    console.log(`   ⚠️  Não foi possível validar integridade: ${e.message}`);
  }
  
  // Resumo
  console.log('\n============================================================');
  console.log(' RESUMO DA VALIDAÇÃO');
  console.log('============================================================');
  
  const temErros = resultados.erros.length > 0;
  const temWarnings = resultados.warnings.length > 0;
  
  if (temErros) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    resultados.erros.forEach(e => console.log(`   - ${e}`));
  }
  
  if (temWarnings) {
    console.log('\n⚠️  AVISOS:');
    resultados.warnings.forEach(w => console.log(`   - ${w}`));
  }
  
  if (!temErros && !temWarnings) {
    console.log('\n✅ Banco de dados consistente!');
  }
  
  // Salvar relatório
  const fs = require('fs').promises;
  const reportPath = require('path').join(__dirname, '..', '..', 'logs', 'database_consistency_v19.json');
  await fs.mkdir(require('path').dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(resultados, null, 2));
  
  console.log(`\n📄 Relatório salvo: ${reportPath}`);
  
  return resultados;
}

if (require.main === module) {
  validarConsistencia()
    .then(result => {
      const temErros = result.erros.length > 0;
      process.exit(temErros ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { validarConsistencia };

