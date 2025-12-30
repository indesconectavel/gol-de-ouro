// ETAPA 3 - Validar Engine V19 (Código) - COMPLETO
// =================================================
const fs = require('fs');
const path = require('path');

const resultados = {
  timestamp: new Date().toISOString(),
  estrutura_modular: {},
  imports: {},
  controllers: {},
  rotas: {},
  services: {},
  monitoramento: {},
  healthcheck: {},
  fluxos: {},
  codigo_morto: {},
  servidor: {},
  resumo: {
    estrutura_ok: 0,
    estrutura_faltando: 0,
    imports_ok: 0,
    imports_quebrados: 0,
    controllers_ok: 0,
    controllers_faltando: 0,
    rotas_ok: 0,
    rotas_faltando: 0,
    services_ok: 0,
    services_faltando: 0,
    servidor_ok: false
  }
};

console.log('🔍 [ETAPA 3] Validando Engine V19 (Código) - COMPLETO...\n');

const rootPath = path.join(__dirname, '..', '..');

// Validar estrutura modular
function validarEstruturaModular() {
  console.log('📁 Validando estrutura modular...');
  
  const modulesPath = path.join(rootPath, 'src', 'modules');
  const modulosEsperados = ['game', 'admin', 'auth', 'financial', 'rewards', 'lotes', 'monitor', 'health', 'shared'];
  
  modulosEsperados.forEach(modulo => {
    const moduloPath = path.join(modulesPath, modulo);
    const existe = fs.existsSync(moduloPath);
    
    resultados.estrutura_modular[modulo] = existe;
    
    if (existe) {
      resultados.resumo.estrutura_ok++;
      console.log(`  ✅ Módulo ${modulo} existe`);
    } else {
      resultados.resumo.estrutura_faltando++;
      console.log(`  ❌ Módulo ${modulo} não encontrado`);
    }
  });
}

// Validar imports
function validarImports() {
  console.log('\n🔗 Validando imports...');
  
  const arquivosParaVerificar = [
    'src/modules/game/controllers/game.controller.js',
    'src/modules/lotes/services/lote.service.js',
    'src/modules/financial/services/financial.service.js',
    'src/modules/rewards/services/reward.service.js',
    'server-fly.js'
  ];
  
  arquivosParaVerificar.forEach(arquivo => {
    const arquivoPath = path.join(rootPath, arquivo);
    
    if (!fs.existsSync(arquivoPath)) {
      resultados.imports[arquivo] = { valido: false, erro: 'Arquivo não encontrado' };
      resultados.resumo.imports_quebrados++;
      return;
    }
    
    const content = fs.readFileSync(arquivoPath, 'utf8');
    
    // Verificar imports de supabase-unified-config
    const temSupabaseUnified = content.includes('supabase-unified-config');
    const temSupabaseConfig = content.includes('supabase-config') && !content.includes('supabase-unified-config');
    
    // Verificar imports relativos corretos
    const temImportsRelativos = content.match(/require\(['"]\.\.\/\.\.\/\.\.\/database/g) || 
                                           content.match(/require\(['"]\.\.\/\.\.\/database/g) ||
                                           content.match(/require\(['"]\.\.\/database/g);
    
    const valido = temSupabaseUnified && !temSupabaseConfig;
    
    resultados.imports[arquivo] = {
      valido,
      temSupabaseUnified,
      temSupabaseConfig,
      temImportsRelativos: !!temImportsRelativos
    };
    
    if (valido) {
      resultados.resumo.imports_ok++;
      console.log(`  ✅ ${arquivo} - Imports OK`);
    } else {
      resultados.resumo.imports_quebrados++;
      console.log(`  ⚠️  ${arquivo} - Imports podem estar incorretos`);
    }
  });
}

// Validar controllers
function validarControllers() {
  console.log('\n🎮 Validando controllers...');
  
  const controllersEsperados = [
    { modulo: 'game', arquivo: 'game.controller.js' },
    { modulo: 'admin', arquivo: 'admin.controller.js' },
    { modulo: 'auth', arquivo: 'auth.controller.js' },
    { modulo: 'auth', arquivo: 'usuario.controller.js' },
    { modulo: 'financial', arquivo: 'payment.controller.js' },
    { modulo: 'financial', arquivo: 'withdraw.controller.js' },
    { modulo: 'monitor', arquivo: 'system.controller.js' }
  ];
  
  controllersEsperados.forEach(({ modulo, arquivo }) => {
    const controllerPath = path.join(rootPath, 'src', 'modules', modulo, 'controllers', arquivo);
    const existe = fs.existsSync(controllerPath);
    
    resultados.controllers[`${modulo}/${arquivo}`] = existe;
    
    if (existe) {
      resultados.resumo.controllers_ok++;
      console.log(`  ✅ ${modulo}/${arquivo} existe`);
    } else {
      resultados.resumo.controllers_faltando++;
      console.log(`  ❌ ${modulo}/${arquivo} não encontrado`);
    }
  });
}

// Validar rotas
function validarRotas() {
  console.log('\n🛣️  Validando rotas...');
  
  const rotasEsperadas = [
    { modulo: 'game', arquivo: 'game.routes.js' },
    { modulo: 'admin', arquivo: 'admin.routes.js' },
    { modulo: 'auth', arquivo: 'auth.routes.js' },
    { modulo: 'auth', arquivo: 'usuario.routes.js' },
    { modulo: 'financial', arquivo: 'payment.routes.js' },
    { modulo: 'financial', arquivo: 'withdraw.routes.js' },
    { modulo: 'monitor', arquivo: 'system.routes.js' },
    { modulo: 'health', arquivo: 'health.routes.js' }
  ];
  
  rotasEsperadas.forEach(({ modulo, arquivo }) => {
    const routePath = path.join(rootPath, 'src', 'modules', modulo, 'routes', arquivo);
    const existe = fs.existsSync(routePath);
    
    resultados.rotas[`${modulo}/${arquivo}`] = existe;
    
    if (existe) {
      resultados.resumo.rotas_ok++;
      console.log(`  ✅ ${modulo}/${arquivo} existe`);
    } else {
      resultados.resumo.rotas_faltando++;
      console.log(`  ❌ ${modulo}/${arquivo} não encontrado`);
    }
  });
}

// Validar services
function validarServices() {
  console.log('\n⚙️  Validando services...');
  
  const servicesEsperados = [
    { modulo: 'lotes', arquivo: 'lote.service.js' },
    { modulo: 'financial', arquivo: 'financial.service.js' },
    { modulo: 'financial', arquivo: 'webhook.service.js' },
    { modulo: 'rewards', arquivo: 'reward.service.js' }
  ];
  
  servicesEsperados.forEach(({ modulo, arquivo }) => {
    const servicePath = path.join(rootPath, 'src', 'modules', modulo, 'services', arquivo);
    const existe = fs.existsSync(servicePath);
    
    resultados.services[`${modulo}/${arquivo}`] = existe;
    
    if (existe) {
      resultados.resumo.services_ok++;
      console.log(`  ✅ ${modulo}/${arquivo} existe`);
    } else {
      resultados.resumo.services_faltando++;
      console.log(`  ❌ ${modulo}/${arquivo} não encontrado`);
    }
  });
}

// Validar monitoramento
function validarMonitoramento() {
  console.log('\n📊 Validando monitoramento...');
  
  const monitorPath = path.join(rootPath, 'src', 'modules', 'monitor');
  const heartbeatPath = path.join(rootPath, 'src', 'scripts', 'heartbeat_sender.js');
  const monitorControllerPath = path.join(monitorPath, 'monitor.controller.js');
  const monitorRoutesPath = path.join(monitorPath, 'monitor.routes.js');
  
  resultados.monitoramento.modulo_monitor = fs.existsSync(monitorPath);
  resultados.monitoramento.heartbeat_sender = fs.existsSync(heartbeatPath);
  resultados.monitoramento.monitor_controller = fs.existsSync(monitorControllerPath);
  resultados.monitoramento.monitor_routes = fs.existsSync(monitorRoutesPath);
  
  Object.entries(resultados.monitoramento).forEach(([key, existe]) => {
    console.log(`  ${existe ? '✅' : '❌'} ${key}: ${existe ? 'OK' : 'Faltando'}`);
  });
}

// Validar healthcheck
function validarHealthcheck() {
  console.log('\n🏥 Validando healthcheck...');
  
  const healthPath = path.join(rootPath, 'src', 'modules', 'health');
  const healthRoutesPath = path.join(healthPath, 'routes', 'health.routes.js');
  const systemRoutesPath = path.join(rootPath, 'src', 'modules', 'monitor', 'routes', 'system.routes.js');
  
  resultados.healthcheck.modulo_health = fs.existsSync(healthPath);
  resultados.healthcheck.health_routes = fs.existsSync(healthRoutesPath);
  resultados.healthcheck.system_routes = fs.existsSync(systemRoutesPath);
  
  Object.entries(resultados.healthcheck).forEach(([key, existe]) => {
    console.log(`  ${existe ? '✅' : '❌'} ${key}: ${existe ? 'OK' : 'Faltando'}`);
  });
}

// Verificar código morto
function verificarCodigoMorto() {
  console.log('\n🗑️  Verificando código morto...');
  
  const arquivosMortos = [];
  
  // Verificar controllers antigos
  const controllersAntigosPath = path.join(rootPath, 'controllers');
  if (fs.existsSync(controllersAntigosPath)) {
    const controllersAntigos = fs.readdirSync(controllersAntigosPath).filter(f => f.endsWith('.js'));
    arquivosMortos.push(...controllersAntigos.map(f => `controllers/${f}`));
  }
  
  // Verificar routes antigas
  const routesAntigasPath = path.join(rootPath, 'routes');
  if (fs.existsSync(routesAntigasPath)) {
    const routesAntigas = fs.readdirSync(routesAntigasPath).filter(f => f.endsWith('.js'));
    arquivosMortos.push(...routesAntigas.map(f => `routes/${f}`));
  }
  
  resultados.codigo_morto.arquivos_antigos = arquivosMortos.length;
  resultados.codigo_morto.lista = arquivosMortos;
  
  console.log(`  ⚠️  ${arquivosMortos.length} arquivos antigos encontrados (devem ser movidos para legacy/)`);
}

// Validar servidor
function validarServidor() {
  console.log('\n🖥️  Validando servidor...');
  
  const serverPath = path.join(rootPath, 'server-fly.js');
  
  if (!fs.existsSync(serverPath)) {
    resultados.servidor.existe = false;
    resultados.servidor.erro = 'server-fly.js não encontrado';
    console.log('  ❌ server-fly.js não encontrado');
    return;
  }
  
  resultados.servidor.existe = true;
  
  // Verificar se usa módulos novos
  const serverContent = fs.readFileSync(serverPath, 'utf8');
  const usaModulosNovos = serverContent.includes('src/modules/');
  const usaModulosAntigos = serverContent.includes("require('./routes/") || 
                           serverContent.includes("require('./controllers/");
  
  resultados.servidor.usa_modulos_novos = usaModulosNovos;
  resultados.servidor.usa_modulos_antigos = usaModulosAntigos;
  
  if (usaModulosNovos && !usaModulosAntigos) {
    resultados.servidor.valido = true;
    resultados.resumo.servidor_ok = true;
    console.log('  ✅ Servidor usa módulos novos');
  } else {
    resultados.servidor.valido = false;
    console.log('  ⚠️  Servidor pode estar usando módulos antigos');
  }
}

// Gerar relatório
function gerarRelatorio() {
  const relatorio = `# 📋 RELATÓRIO - VALIDAÇÃO ENGINE V19 (CÓDIGO)
## Data: ${new Date().toISOString()}

### 📊 RESUMO

#### Estrutura Modular
- ✅ OK: ${resultados.resumo.estrutura_ok}
- ❌ Faltando: ${resultados.resumo.estrutura_faltando}

#### Imports
- ✅ OK: ${resultados.resumo.imports_ok}
- ❌ Quebrados: ${resultados.resumo.imports_quebrados}

#### Controllers
- ✅ OK: ${resultados.resumo.controllers_ok}
- ❌ Faltando: ${resultados.resumo.controllers_faltando}

#### Rotas
- ✅ OK: ${resultados.resumo.rotas_ok}
- ❌ Faltando: ${resultados.resumo.rotas_faltando}

#### Services
- ✅ OK: ${resultados.resumo.services_ok}
- ❌ Faltando: ${resultados.resumo.services_faltando}

#### Servidor
- Status: ${resultados.resumo.servidor_ok ? '✅ OK' : '⚠️ Verificar'}

### 🔍 DETALHES

#### Estrutura Modular
${Object.entries(resultados.estrutura_modular).map(([modulo, existe]) => 
  `- ${existe ? '✅' : '❌'} **${modulo}**: ${existe ? 'OK' : 'Faltando'}`
).join('\n')}

#### Controllers
${Object.entries(resultados.controllers).map(([controller, existe]) => 
  `- ${existe ? '✅' : '❌'} **${controller}**: ${existe ? 'OK' : 'Faltando'}`
).join('\n')}

#### Rotas
${Object.entries(resultados.rotas).map(([rota, existe]) => 
  `- ${existe ? '✅' : '❌'} **${rota}**: ${existe ? 'OK' : 'Faltando'}`
).join('\n')}

#### Services
${Object.entries(resultados.services).map(([service, existe]) => 
  `- ${existe ? '✅' : '❌'} **${service}**: ${existe ? 'OK' : 'Faltando'}`
).join('\n')}

#### Monitoramento
${Object.entries(resultados.monitoramento).map(([item, existe]) => 
  `- ${existe ? '✅' : '❌'} **${item}**: ${existe ? 'OK' : 'Faltando'}`
).join('\n')}

#### Healthcheck
${Object.entries(resultados.healthcheck).map(([item, existe]) => 
  `- ${existe ? '✅' : '❌'} **${item}**: ${existe ? 'OK' : 'Faltando'}`
).join('\n')}

#### Código Morto
- Arquivos antigos encontrados: ${resultados.codigo_morto.arquivos_antigos}
${resultados.codigo_morto.lista.length > 0 ? `\nLista:\n${resultados.codigo_morto.lista.map(f => `- ${f}`).join('\n')}` : ''}

#### Servidor
- Existe: ${resultados.servidor.existe ? '✅' : '❌'}
- Usa módulos novos: ${resultados.servidor.usa_modulos_novos ? '✅' : '❌'}
- Usa módulos antigos: ${resultados.servidor.usa_modulos_antigos ? '⚠️ Sim' : '✅ Não'}

### ✅ CONCLUSÃO

${resultados.resumo.estrutura_faltando === 0 && resultados.resumo.imports_quebrados === 0 && 
  resultados.resumo.controllers_faltando === 0 && resultados.resumo.rotas_faltando === 0 &&
  resultados.resumo.services_faltando === 0 && resultados.resumo.servidor_ok
  ? '**✅ ENGINE V19 (CÓDIGO) VALIDADA COM SUCESSO**'
  : '**⚠️ ENGINE V19 (CÓDIGO) PARCIALMENTE VALIDADA**\n\nPendências detectadas.'
}
`;

  return relatorio;
}

// Executar validações
try {
  validarEstruturaModular();
  validarImports();
  validarControllers();
  validarRotas();
  validarServices();
  validarMonitoramento();
  validarHealthcheck();
  verificarCodigoMorto();
  validarServidor();
  
  // Salvar resultados
  const jsonPath = path.join(rootPath, 'logs', 'v19', 'validacao_engine_v19_final.json');
  fs.writeFileSync(jsonPath, JSON.stringify(resultados, null, 2));
  console.log(`\n✅ Resultados JSON salvos em: ${jsonPath}`);
  
  // Salvar relatório
  const relatorio = gerarRelatorio();
  const mdPath = path.join(rootPath, 'logs', 'v19', 'RELATORIO-ENGINE-V19.md');
  fs.writeFileSync(mdPath, relatorio);
  console.log(`✅ Relatório salvo em: ${mdPath}`);
  
  console.log('\n📊 RESUMO FINAL:');
  console.log(`   Estrutura: ${resultados.resumo.estrutura_ok} OK`);
  console.log(`   Imports: ${resultados.resumo.imports_ok} OK`);
  console.log(`   Controllers: ${resultados.resumo.controllers_ok} OK`);
  console.log(`   Rotas: ${resultados.resumo.rotas_ok} OK`);
  console.log(`   Services: ${resultados.resumo.services_ok} OK`);
  console.log(`   Servidor: ${resultados.resumo.servidor_ok ? '✅' : '⚠️'}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}

