// ETAPA 0 - Reconstruir Contexto Completo do Projeto
// ===================================================
const fs = require('fs');
const path = require('path');

const contexto = {
  timestamp: new Date().toISOString(),
  projeto: 'Gol de Ouro Backend',
  versao: 'V19.0.0',
  arquitetura: {
    modulos: {},
    rotas: {},
    controllers: {},
    services: {},
    libs: {},
    configs: {}
  },
  estrutura_arquivos: {}
};

console.log('🔍 [ETAPA 0] Reconstruindo contexto completo do projeto...\n');

const rootPath = path.join(__dirname, '..', '..');

// Mapear módulos
function mapearModulos() {
  console.log('📁 Mapeando módulos...');
  const modulesPath = path.join(rootPath, 'src', 'modules');
  
  if (fs.existsSync(modulesPath)) {
    const modulos = fs.readdirSync(modulesPath);
    
    modulos.forEach(modulo => {
      const moduloPath = path.join(modulesPath, modulo);
      if (fs.statSync(moduloPath).isDirectory()) {
        contexto.arquitetura.modulos[modulo] = {
          controllers: [],
          routes: [],
          services: [],
          middlewares: [],
          validators: []
        };
        
        // Controllers
        const controllersPath = path.join(moduloPath, 'controllers');
        if (fs.existsSync(controllersPath)) {
          contexto.arquitetura.modulos[modulo].controllers = 
            fs.readdirSync(controllersPath).filter(f => f.endsWith('.js'));
        }
        
        // Routes
        const routesPath = path.join(moduloPath, 'routes');
        if (fs.existsSync(routesPath)) {
          contexto.arquitetura.modulos[modulo].routes = 
            fs.readdirSync(routesPath).filter(f => f.endsWith('.js'));
        }
        
        // Services
        const servicesPath = path.join(moduloPath, 'services');
        if (fs.existsSync(servicesPath)) {
          contexto.arquitetura.modulos[modulo].services = 
            fs.readdirSync(servicesPath).filter(f => f.endsWith('.js'));
        }
        
        console.log(`  ✅ ${modulo}: ${contexto.arquitetura.modulos[modulo].controllers.length} controllers, ${contexto.arquitetura.modulos[modulo].routes.length} routes, ${contexto.arquitetura.modulos[modulo].services.length} services`);
      }
    });
  }
}

// Mapear rotas no servidor
function mapearRotas() {
  console.log('\n🛣️  Mapeando rotas...');
  const serverPath = path.join(rootPath, 'server-fly.js');
  
  if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    
    // Extrair rotas registradas
    const routeMatches = serverContent.matchAll(/app\.use\(['"]([^'"]+)['"],\s*(\w+Routes)/g);
    for (const match of routeMatches) {
      contexto.arquitetura.rotas[match[1]] = match[2];
      console.log(`  ✅ ${match[1]} → ${match[2]}`);
    }
  }
}

// Mapear controllers
function mapearControllers() {
  console.log('\n🎮 Mapeando controllers...');
  Object.entries(contexto.arquitetura.modulos).forEach(([modulo, info]) => {
    info.controllers.forEach(controller => {
      const controllerPath = `src/modules/${modulo}/controllers/${controller}`;
      contexto.arquitetura.controllers[controller] = {
        modulo,
        caminho: controllerPath
      };
    });
  });
  console.log(`  ✅ ${Object.keys(contexto.arquitetura.controllers).length} controllers mapeados`);
}

// Mapear services
function mapearServices() {
  console.log('\n⚙️  Mapeando services...');
  Object.entries(contexto.arquitetura.modulos).forEach(([modulo, info]) => {
    info.services.forEach(service => {
      const servicePath = `src/modules/${modulo}/services/${service}`;
      contexto.arquitetura.services[service] = {
        modulo,
        caminho: servicePath
      };
    });
  });
  console.log(`  ✅ ${Object.keys(contexto.arquitetura.services).length} services mapeados`);
}

// Mapear libs e configs
function mapearLibsConfigs() {
  console.log('\n📚 Mapeando libs e configs...');
  
  // Database
  const dbPath = path.join(rootPath, 'database');
  if (fs.existsSync(dbPath)) {
    contexto.arquitetura.libs.database = fs.readdirSync(dbPath)
      .filter(f => f.endsWith('.js'))
      .map(f => `database/${f}`);
  }
  
  // Config
  const configPath = path.join(rootPath, 'config');
  if (fs.existsSync(configPath)) {
    contexto.arquitetura.configs = fs.readdirSync(configPath)
      .filter(f => f.endsWith('.js'))
      .map(f => `config/${f}`);
  }
  
  console.log(`  ✅ ${contexto.arquitetura.libs.database?.length || 0} arquivos database`);
  console.log(`  ✅ ${contexto.arquitetura.configs?.length || 0} arquivos config`);
}

// Executar mapeamento
try {
  mapearModulos();
  mapearRotas();
  mapearControllers();
  mapearServices();
  mapearLibsConfigs();
  
  // Salvar contexto
  const outputPath = path.join(rootPath, 'logs', 'v19', 'mapa_contexto_completo.json');
  fs.writeFileSync(outputPath, JSON.stringify(contexto, null, 2));
  
  console.log(`\n✅ Contexto salvo em: ${outputPath}`);
  console.log(`\n📊 Resumo:`);
  console.log(`   - Módulos: ${Object.keys(contexto.arquitetura.modulos).length}`);
  console.log(`   - Rotas: ${Object.keys(contexto.arquitetura.rotas).length}`);
  console.log(`   - Controllers: ${Object.keys(contexto.arquitetura.controllers).length}`);
  console.log(`   - Services: ${Object.keys(contexto.arquitetura.services).length}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}

