// Script de Validação de Migration V19
// ======================================
// Data: 2025-12-10
// Versão: V19.0.0

require('dotenv').config();
const { supabaseAdmin } = require('../../database/supabase-unified-config');

const TABELAS_V19 = [
  'lotes',
  'rewards',
  'webhook_events',
  'system_heartbeat'
];

async function validarTabelas() {
  console.log('🔍 Validando tabelas V19...\n');

  const resultados = {
    encontradas: [],
    faltando: []
  };

  for (const tabela of TABELAS_V19) {
    try {
      const { data, error } = await supabaseAdmin
        .from(tabela)
        .select('*')
        .limit(1);

      if (error && error.code === '42P01') {
        resultados.faltando.push(tabela);
        console.log(`❌ ${tabela} - NÃO ENCONTRADA`);
      } else {
        resultados.encontradas.push(tabela);
        console.log(`✅ ${tabela} - ENCONTRADA`);
      }
    } catch (err) {
      if (err.message && err.message.includes('does not exist')) {
        resultados.faltando.push(tabela);
        console.log(`❌ ${tabela} - NÃO ENCONTRADA`);
      } else {
        resultados.encontradas.push(tabela);
        console.log(`✅ ${tabela} - ENCONTRADA`);
      }
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`  ✅ Encontradas: ${resultados.encontradas.length}/${TABELAS_V19.length}`);
  console.log(`  ❌ Faltando: ${resultados.faltando.length}/${TABELAS_V19.length}`);

  if (resultados.faltando.length > 0) {
    console.log(`\n⚠️ Tabelas faltando:`);
    resultados.faltando.forEach(tabela => console.log(`  - ${tabela}`));
    console.log(`\n💡 Execute a Migration V19 para criar as tabelas faltantes.`);
    process.exit(1);
  } else {
    console.log(`\n✅ Todas as tabelas V19 estão presentes!`);
    process.exit(0);
  }
}

validarTabelas().catch(err => {
  console.error('\n❌ Erro na validação:', err.message);
  process.exit(1);
});

