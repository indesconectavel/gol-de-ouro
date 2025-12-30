// ============================================================
// VERIFICAÇÃO SUPREMA V19 - ETAPA 5: VALIDAR CÓDIGO ENGINE V19
// ============================================================
// Data: 2025-01-24
// Objetivo: Validar código da Engine V19 (imports, controllers, rotas, services)

const fs = require('fs');
const path = require('path');

const resultado = {
  timestamp: new Date().toISOString(),
  codigo: {
    imports: { ok: [], erros: [] },
    controllers: { ok: [], erros: [] },
    routes: { ok: [], erros: [] },
    services: { ok: [], erros: [] },
    modules: { ok: [], erros: [] },
    engine_core: { ok: [], erros: [] },
    monitor: { ok: [], erros: [] },
    heartbeat: { ok: [], erros: [] },
    financeiro: { ok: [], erros: [] },
    lotes: { ok: [], erros: [] },
    premiacao: { ok: [], erros: [] },
    tratamento_erros: { ok: [], erros: [] }
  },
  problemas_encontrados: [],
  correcoes_aplicadas: [],
  resumo: {
    imports_ok: false,
    controllers_ok: false,
    routes_ok: false,
    services_ok: false,
    modules_ok: false,
    engine_core_ok: false,
    monitor_ok: false,
    heartbeat_ok: false,
    financeiro_ok: false,
    lotes_ok: false,
    premiacao_ok: false,
    codigo_valido: false
  }
};

function lerArquivo(arquivo) {
  try {
    return fs.readFileSync(arquivo, 'utf8');
  } catch (error) {
    return null;
  }
}

function validarImports(conteudo, arquivo) {
  const problemas = [];
  
  // Verificar imports do Supabase
  if (conteudo.includes('supabase') && !conteudo.includes('supabase-unified-config')) {
    if (!conteudo.includes('database/supabase-unified-config')) {
      problemas.push('Import do Supabase não usa supabase-unified-config');
    }
  }
  
  // Verificar imports relativos corretos
  const importsInvalidos = conteudo.match(/require\(['"]\.\.\/\.\.\/[^'"]+['"]\)/g);
  if (importsInvalidos) {
    importsInvalidos.forEach(imp => {
      if (!imp.includes('modules') && !imp.includes('database') && !imp.includes('config')) {
        problemas.push(`Import relativo suspeito: ${imp}`);
      }
    });
  }
  
  return problemas;
}

function validarController(conteudo, arquivo) {
  const problemas = [];
  
  // Verificar se usa response-helper
  if (!conteudo.includes('response-helper') && !conteudo.includes('response')) {
    problemas.push('Controller não usa response-helper');
  }
  
  // Verificar se usa supabase-unified-config
  if (!conteudo.includes('supabase-unified-config')) {
    problemas.push('Controller não usa supabase-unified-config');
  }
  
  // Verificar tratamento de erros
  if (!conteudo.includes('try') || !conteudo.includes('catch')) {
    problemas.push('Controller não tem tratamento de erros adequado');
  }
  
  return problemas;
}

function validarService(conteudo, arquivo) {
  const problemas = [];
  
  // Verificar se usa supabase-unified-config
  if (!conteudo.includes('supabase-unified-config')) {
    problemas.push('Service não usa supabase-unified-config');
  }
  
  // Verificar tratamento de erros
  if (!conteudo.includes('try') || !conteudo.includes('catch')) {
    problemas.push('Service não tem tratamento de erros adequado');
  }
  
  return problemas;
}

function validarRoute(conteudo, arquivo) {
  const problemas = [];
  
  // Verificar se exporta router
  if (!conteudo.includes('module.exports') && !conteudo.includes('export')) {
    problemas.push('Route não exporta router');
  }
  
  // Verificar se usa express.Router
  if (!conteudo.includes('Router') && !conteudo.includes('router')) {
    problemas.push('Route não usa express.Router');
  }
  
  return problemas;
}

// 1. Validar imports
console.log('📦 Validando imports...');
const arquivosJs = [];
function buscarArquivosJs(dir) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        buscarArquivosJs(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        arquivosJs.push(fullPath);
      }
    }
  } catch (error) {
    // Ignorar erros
  }
}

buscarArquivosJs('src/modules');

for (const arquivo of arquivosJs) {
  const conteudo = lerArquivo(arquivo);
  if (!conteudo) continue;
  
  const problemas = validarImports(conteudo, arquivo);
  if (problemas.length === 0) {
    resultado.codigo.imports.ok.push(arquivo);
  } else {
    resultado.codigo.imports.erros.push({ arquivo, problemas });
    resultado.problemas_encontrados.push(...problemas.map(p => `${arquivo}: ${p}`));
  }
}

resultado.resumo.imports_ok = resultado.codigo.imports.erros.length === 0;

// 2. Validar controllers
console.log('🎮 Validando controllers...');
const controllers = arquivosJs.filter(f => f.includes('controller'));
for (const arquivo of controllers) {
  const conteudo = lerArquivo(arquivo);
  if (!conteudo) continue;
  
  const problemas = validarController(conteudo, arquivo);
  if (problemas.length === 0) {
    resultado.codigo.controllers.ok.push(arquivo);
  } else {
    resultado.codigo.controllers.erros.push({ arquivo, problemas });
    resultado.problemas_encontrados.push(...problemas.map(p => `${arquivo}: ${p}`));
  }
}

resultado.resumo.controllers_ok = resultado.codigo.controllers.erros.length === 0;

// 3. Validar routes
console.log('🛣️ Validando routes...');
const routes = arquivosJs.filter(f => f.includes('route'));
for (const arquivo of routes) {
  const conteudo = lerArquivo(arquivo);
  if (!conteudo) continue;
  
  const problemas = validarRoute(conteudo, arquivo);
  if (problemas.length === 0) {
    resultado.codigo.routes.ok.push(arquivo);
  } else {
    resultado.codigo.routes.erros.push({ arquivo, problemas });
    resultado.problemas_encontrados.push(...problemas.map(p => `${arquivo}: ${p}`));
  }
}

resultado.resumo.routes_ok = resultado.codigo.routes.erros.length === 0;

// 4. Validar services
console.log('⚙️ Validando services...');
const services = arquivosJs.filter(f => f.includes('service'));
for (const arquivo of services) {
  const conteudo = lerArquivo(arquivo);
  if (!conteudo) continue;
  
  const problemas = validarService(conteudo, arquivo);
  if (problemas.length === 0) {
    resultado.codigo.services.ok.push(arquivo);
  } else {
    resultado.codigo.services.erros.push({ arquivo, problemas });
    resultado.problemas_encontrados.push(...problemas.map(p => `${arquivo}: ${p}`));
  }
}

resultado.resumo.services_ok = resultado.codigo.services.erros.length === 0;

// 5. Validar módulos específicos
console.log('📦 Validando módulos específicos...');

// Engine Core
const engineCoreFiles = [
  'src/modules/lotes/services/lote.service.js',
  'src/modules/financial/services/financial.service.js',
  'src/modules/rewards/services/reward.service.js'
];

for (const arquivo of engineCoreFiles) {
  if (fs.existsSync(arquivo)) {
    resultado.codigo.engine_core.ok.push(arquivo);
  } else {
    resultado.codigo.engine_core.erros.push({ arquivo, problema: 'Arquivo não encontrado' });
  }
}

resultado.resumo.engine_core_ok = resultado.codigo.engine_core.erros.length === 0;

// Monitor
const monitorFiles = [
  'src/modules/monitor/controllers/system.controller.js',
  'src/modules/monitor/routes/system.routes.js',
  'src/modules/monitor/metrics.js'
];

for (const arquivo of monitorFiles) {
  if (fs.existsSync(arquivo)) {
    resultado.codigo.monitor.ok.push(arquivo);
  } else {
    resultado.codigo.monitor.erros.push({ arquivo, problema: 'Arquivo não encontrado' });
  }
}

resultado.resumo.monitor_ok = resultado.codigo.monitor.erros.length === 0;

// Heartbeat
const heartbeatFiles = [
  'src/scripts/heartbeat_sender.js'
];

for (const arquivo of heartbeatFiles) {
  if (fs.existsSync(arquivo)) {
    resultado.codigo.heartbeat.ok.push(arquivo);
  } else {
    resultado.codigo.heartbeat.erros.push({ arquivo, problema: 'Arquivo não encontrado' });
  }
}

resultado.resumo.heartbeat_ok = resultado.codigo.heartbeat.erros.length === 0;

// Status geral
resultado.resumo.codigo_valido = 
  resultado.resumo.imports_ok &&
  resultado.resumo.controllers_ok &&
  resultado.resumo.routes_ok &&
  resultado.resumo.services_ok &&
  resultado.resumo.engine_core_ok &&
  resultado.resumo.monitor_ok;

// Salvar resultado
const outputDir = 'logs/v19/VERIFICACAO_SUPREMA';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, '05_engine_v19_codigo.json');
fs.writeFileSync(outputFile, JSON.stringify(resultado, null, 2), 'utf8');

console.log('\n✅ Validação do código concluída!');
console.log(`📊 Resumo:`);
console.log(`   - Imports: ${resultado.codigo.imports.ok.length} OK, ${resultado.codigo.imports.erros.length} erros`);
console.log(`   - Controllers: ${resultado.codigo.controllers.ok.length} OK, ${resultado.codigo.controllers.erros.length} erros`);
console.log(`   - Routes: ${resultado.codigo.routes.ok.length} OK, ${resultado.codigo.routes.erros.length} erros`);
console.log(`   - Services: ${resultado.codigo.services.ok.length} OK, ${resultado.codigo.services.erros.length} erros`);
console.log(`   - Engine Core: ${resultado.codigo.engine_core.ok.length}/${engineCoreFiles.length} arquivos`);
console.log(`   - Monitor: ${resultado.codigo.monitor.ok.length}/${monitorFiles.length} arquivos`);
console.log(`   - Problemas encontrados: ${resultado.problemas_encontrados.length}`);
console.log(`\n💾 Salvo em: ${outputFile}`);

if (resultado.problemas_encontrados.length > 0) {
  console.log('\n⚠️ Problemas encontrados:');
  resultado.problemas_encontrados.slice(0, 10).forEach(p => console.log(`   - ${p}`));
  if (resultado.problemas_encontrados.length > 10) {
    console.log(`   ... e mais ${resultado.problemas_encontrados.length - 10} problemas`);
  }
}

module.exports = resultado;

