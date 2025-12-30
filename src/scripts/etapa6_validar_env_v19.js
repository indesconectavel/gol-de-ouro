// ETAPA 6 - Validar Variáveis de Ambiente V19
// ============================================
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const resultados = {
  timestamp: new Date().toISOString(),
  variaveis: {},
  resumo: {
    definidas: 0,
    faltando: 0,
    corretas: 0,
    incorretas: 0
  }
};

console.log('🔍 [ETAPA 6] Validando Variáveis de Ambiente V19...\n');

// Variáveis V19 obrigatórias
const variaveisV19 = {
  'USE_ENGINE_V19': { obrigatoria: true, valor_esperado: 'true' },
  'USE_DB_QUEUE': { obrigatoria: false, valor_esperado: 'false' },
  'ENGINE_HEARTBEAT_ENABLED': { obrigatoria: true, valor_esperado: 'true' },
  'ENGINE_MONITOR_ENABLED': { obrigatoria: true, valor_esperado: 'true' },
  'SUPABASE_URL': { obrigatoria: true },
  'SUPABASE_SERVICE_ROLE_KEY': { obrigatoria: true },
  'JWT_SECRET': { obrigatoria: true }
};

// Verificar variáveis
Object.entries(variaveisV19).forEach(([variavel, config]) => {
  const valor = process.env[variavel];
  const definida = valor !== undefined;
  const correta = config.valor_esperado ? valor === config.valor_esperado : definida;
  
  resultados.variaveis[variavel] = {
    definida,
    valor: definida ? (variavel.includes('KEY') || variavel.includes('SECRET') ? '***' : valor) : undefined,
    obrigatoria: config.obrigatoria,
    valor_esperado: config.valor_esperado,
    correta: correta
  };
  
  if (definida) {
    resultados.resumo.definidas++;
    if (correta) {
      resultados.resumo.corretas++;
      console.log(`  ✅ ${variavel} = ${config.valor_esperado || 'definida'}`);
    } else {
      resultados.resumo.incorretas++;
      console.log(`  ⚠️  ${variavel} = ${valor} (esperado: ${config.valor_esperado || 'qualquer valor'})`);
    }
  } else {
    resultados.resumo.faltando++;
    if (config.obrigatoria) {
      console.log(`  ❌ ${variavel} NÃO DEFINIDA (obrigatória)`);
    } else {
      console.log(`  ⚠️  ${variavel} não definida (opcional)`);
    }
  }
});

// Salvar resultados
const jsonPath = path.join(__dirname, '..', '..', 'validacao_env_v19.json');
fs.writeFileSync(jsonPath, JSON.stringify(resultados, null, 2));
console.log(`\n✅ Resultados salvos em: ${jsonPath}`);

console.log('\n📊 RESUMO:');
console.log(`   Definidas: ${resultados.resumo.definidas}`);
console.log(`   Faltando: ${resultados.resumo.faltando}`);
console.log(`   Corretas: ${resultados.resumo.corretas}`);
console.log(`   Incorretas: ${resultados.resumo.incorretas}`);

process.exit(0);

