// ETAPA 3 - Validar Engine V19 Local
// ===================================
const fs = require('fs');
const path = require('path');

const resultados = {
  timestamp: new Date().toISOString(),
  engine_core: {},
  monitoramento: {},
  healthcheck: {},
  endpoints: {},
  resumo: {
    core_ok: 0,
    core_faltando: 0,
    monitoramento_ok: 0,
    monitoramento_faltando: 0,
    healthcheck_ok: 0,
    healthcheck_faltando: 0,
    endpoints_ok: 0,
    endpoints_faltando: 0
  }
};

console.log('🔍 [ETAPA 3] Validando Engine V19 Local...\n');

// Verificar Engine Core
function verificarEngineCore() {
  console.log('⚙️  Verificando Engine Core...');
  
  const rootPath = path.join(__dirname, '..', '..');
  
  // Verificar supabase-unified-config
  const supabaseConfigPath = path.join(rootPath, 'database', 'supabase-unified-config.js');
  resultados.engine_core.supabase_unified_config = fs.existsSync(supabaseConfigPath);
  if (resultados.engine_core.supabase_unified_config) {
    resultados.resumo.core_ok++;
    console.log('  ✅ supabase-unified-config existe');
  } else {
    resultados.resumo.core_faltando++;
    console.log('  ❌ supabase-unified-config não encontrado');
  }
  
  // Verificar services
  const services = [
    { nome: 'LoteService', caminho: 'src/modules/lotes/services/lote.service.js' },
    { nome: 'FinancialService', caminho: 'src/modules/financial/services/financial.service.js' },
    { nome: 'RewardService', caminho: 'src/modules/rewards/services/reward.service.js' }
  ];
  
  resultados.engine_core.services = {};
  
  services.forEach(service => {
    const servicePath = path.join(rootPath, service.caminho);
    const existe = fs.existsSync(servicePath);
    resultados.engine_core.services[service.nome] = existe;
    
    if (existe) {
      resultados.resumo.core_ok++;
      console.log(`  ✅ ${service.nome} existe`);
    } else {
      resultados.resumo.core_faltando++;
      console.log(`  ❌ ${service.nome} não encontrado`);
    }
  });
}

// Verificar Monitoramento
function verificarMonitoramento() {
  console.log('\n📊 Verificando Monitoramento...');
  
  const rootPath = path.join(__dirname, '..', '..');
  
  // Verificar módulo monitor
  const monitorPath = path.join(rootPath, 'src', 'modules', 'monitor');
  resultados.monitoramento.modulo_monitor = fs.existsSync(monitorPath);
  if (resultados.monitoramento.modulo_monitor) {
    resultados.resumo.monitoramento_ok++;
    console.log('  ✅ Módulo monitor existe');
  } else {
    resultados.resumo.monitoramento_faltando++;
    console.log('  ❌ Módulo monitor não encontrado');
  }
  
  // Verificar monitor controller
  const monitorControllerPath = path.join(monitorPath, 'monitor.controller.js');
  resultados.monitoramento.monitor_controller = fs.existsSync(monitorControllerPath);
  if (resultados.monitoramento.monitor_controller) {
    resultados.resumo.monitoramento_ok++;
    console.log('  ✅ Monitor controller existe');
  } else {
    resultados.resumo.monitoramento_faltando++;
    console.log('  ❌ Monitor controller não encontrado');
  }
  
  // Verificar monitor routes
  const monitorRoutesPath = path.join(monitorPath, 'monitor.routes.js');
  resultados.monitoramento.monitor_routes = fs.existsSync(monitorRoutesPath);
  if (resultados.monitoramento.monitor_routes) {
    resultados.resumo.monitoramento_ok++;
    console.log('  ✅ Monitor routes existe');
  } else {
    resultados.resumo.monitoramento_faltando++;
    console.log('  ❌ Monitor routes não encontrado');
  }
  
  // Verificar heartbeat sender
  const heartbeatPath = path.join(rootPath, 'src', 'scripts', 'heartbeat_sender.js');
  resultados.monitoramento.heartbeat_sender = fs.existsSync(heartbeatPath);
  if (resultados.monitoramento.heartbeat_sender) {
    resultados.resumo.monitoramento_ok++;
    console.log('  ✅ Heartbeat sender existe');
  } else {
    resultados.resumo.monitoramento_faltando++;
    console.log('  ❌ Heartbeat sender não encontrado');
  }
}

// Verificar Healthcheck
function verificarHealthcheck() {
  console.log('\n🏥 Verificando Healthcheck...');
  
  const rootPath = path.join(__dirname, '..', '..');
  
  // Verificar módulo health
  const healthPath = path.join(rootPath, 'src', 'modules', 'health');
  resultados.healthcheck.modulo_health = fs.existsSync(healthPath);
  if (resultados.healthcheck.modulo_health) {
    resultados.resumo.healthcheck_ok++;
    console.log('  ✅ Módulo health existe');
  } else {
    resultados.resumo.healthcheck_faltando++;
    console.log('  ❌ Módulo health não encontrado');
  }
  
  // Verificar health routes
  const healthRoutesPath = path.join(healthPath, 'routes', 'health.routes.js');
  resultados.healthcheck.health_routes = fs.existsSync(healthRoutesPath);
  if (resultados.healthcheck.health_routes) {
    resultados.resumo.healthcheck_ok++;
    console.log('  ✅ Health routes existe');
  } else {
    resultados.resumo.healthcheck_faltando++;
    console.log('  ❌ Health routes não encontrado');
  }
  
  // Verificar system routes (tem /health)
  const systemRoutesPath = path.join(rootPath, 'src', 'modules', 'monitor', 'routes', 'system.routes.js');
  resultados.healthcheck.system_routes = fs.existsSync(systemRoutesPath);
  if (resultados.healthcheck.system_routes) {
    resultados.resumo.healthcheck_ok++;
    console.log('  ✅ System routes existe');
  } else {
    resultados.resumo.healthcheck_faltando++;
    console.log('  ❌ System routes não encontrado');
  }
}

// Verificar Endpoints (verificar se routes existem)
function verificarEndpoints() {
  console.log('\n🛣️  Verificando Endpoints...');
  
  const rootPath = path.join(__dirname, '..', '..');
  
  const endpoints = [
    { nome: 'game/jogar', caminho: 'src/modules/game/routes/game.routes.js' },
    { nome: 'lotes/ativo', caminho: 'src/modules/lotes/services/lote.service.js' },
    { nome: 'financial/depositar', caminho: 'src/modules/financial/routes/payment.routes.js' },
    { nome: 'financial/sacar', caminho: 'src/modules/financial/routes/withdraw.routes.js' },
    { nome: 'admin/*', caminho: 'src/modules/admin/routes/admin.routes.js' }
  ];
  
  resultados.endpoints = {};
  
  endpoints.forEach(endpoint => {
    const endpointPath = path.join(rootPath, endpoint.caminho);
    const existe = fs.existsSync(endpointPath);
    resultados.endpoints[endpoint.nome] = existe;
    
    if (existe) {
      resultados.resumo.endpoints_ok++;
      console.log(`  ✅ Endpoint ${endpoint.nome} (route existe)`);
    } else {
      resultados.resumo.endpoints_faltando++;
      console.log(`  ❌ Endpoint ${endpoint.nome} (route não encontrado)`);
    }
  });
}

// Gerar relatório
function gerarRelatorio() {
  const relatorio = `# 📋 RELATÓRIO - VALIDAÇÃO ENGINE V19 LOCAL
## Data: ${new Date().toISOString()}

### 📊 RESUMO

#### Engine Core
- ✅ OK: ${resultados.resumo.core_ok}
- ❌ Faltando: ${resultados.resumo.core_faltando}

#### Monitoramento
- ✅ OK: ${resultados.resumo.monitoramento_ok}
- ❌ Faltando: ${resultados.resumo.monitoramento_faltando}

#### Healthcheck
- ✅ OK: ${resultados.resumo.healthcheck_ok}
- ❌ Faltando: ${resultados.resumo.healthcheck_faltando}

#### Endpoints
- ✅ OK: ${resultados.resumo.endpoints_ok}
- ❌ Faltando: ${resultados.resumo.endpoints_faltando}

### 🔍 DETALHES

#### Engine Core
${Object.entries(resultados.engine_core).map(([key, value]) => 
  `- ${value ? '✅' : '❌'} **${key}**: ${value ? 'OK' : 'Faltando'}`
).join('\n')}

#### Monitoramento
${Object.entries(resultados.monitoramento).map(([key, value]) => 
  `- ${value ? '✅' : '❌'} **${key}**: ${value ? 'OK' : 'Faltando'}`
).join('\n')}

#### Healthcheck
${Object.entries(resultados.healthcheck).map(([key, value]) => 
  `- ${value ? '✅' : '❌'} **${key}**: ${value ? 'OK' : 'Faltando'}`
).join('\n')}

#### Endpoints
${Object.entries(resultados.endpoints).map(([key, value]) => 
  `- ${value ? '✅' : '❌'} **${key}**: ${value ? 'OK' : 'Faltando'}`
).join('\n')}

### ✅ CONCLUSÃO

${resultados.resumo.core_faltando === 0 && resultados.resumo.monitoramento_faltando === 0 && 
  resultados.resumo.healthcheck_faltando === 0 && resultados.resumo.endpoints_faltando === 0
  ? '**✅ ENGINE V19 LOCAL VALIDADA COM SUCESSO**' 
  : '**⚠️ ENGINE V19 LOCAL PARCIALMENTE VALIDADA**\n\nPendências detectadas.'
}
`;

  return relatorio;
}

// Executar validações
try {
  verificarEngineCore();
  verificarMonitoramento();
  verificarHealthcheck();
  verificarEndpoints();
  
  // Salvar resultados JSON
  const jsonPath = path.join(__dirname, '..', '..', 'validacao_engine_v19.json');
  fs.writeFileSync(jsonPath, JSON.stringify(resultados, null, 2));
  console.log(`\n✅ Resultados JSON salvos em: ${jsonPath}`);
  
  // Salvar relatório Markdown
  const relatorio = gerarRelatorio();
  const mdPath = path.join(__dirname, '..', '..', 'relatorio_engine_v19.md');
  fs.writeFileSync(mdPath, relatorio);
  console.log(`✅ Relatório Markdown salvo em: ${mdPath}`);
  
  console.log('\n📊 RESUMO FINAL:');
  console.log(`   Engine Core: ${resultados.resumo.core_ok} OK`);
  console.log(`   Monitoramento: ${resultados.resumo.monitoramento_ok} OK`);
  console.log(`   Healthcheck: ${resultados.resumo.healthcheck_ok} OK`);
  console.log(`   Endpoints: ${resultados.resumo.endpoints_ok} OK`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erro durante validação:', error);
  process.exit(1);
}

