// ETAPA 6 - Refactor Final Automático
// ====================================
const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, '..', '..');

console.log('🔧 [ETAPA 6] Refactor Final Automático...\n');

// Criar index.js em cada módulo
function criarIndexModules() {
  console.log('📦 Criando index.js nos módulos...');
  
  const modulesPath = path.join(rootPath, 'src', 'modules');
  const modulos = fs.readdirSync(modulesPath);
  
  modulos.forEach(modulo => {
    const moduloPath = path.join(modulesPath, modulo);
    if (!fs.statSync(moduloPath).isDirectory()) return;
    
    const indexPath = path.join(moduloPath, 'index.js');
    
    if (!fs.existsSync(indexPath)) {
      const indexContent = `// Módulo ${modulo} - Gol de Ouro V19
// Exportações do módulo ${modulo}

// Controllers
${fs.existsSync(path.join(moduloPath, 'controllers')) ? 
  `const controllers = require('./controllers');` : ''}

// Routes
${fs.existsSync(path.join(moduloPath, 'routes')) ? 
  `const routes = require('./routes');` : ''}

// Services
${fs.existsSync(path.join(moduloPath, 'services')) ? 
  `const services = require('./services');` : ''}

module.exports = {
${fs.existsSync(path.join(moduloPath, 'controllers')) ? '  ...controllers,' : ''}
${fs.existsSync(path.join(moduloPath, 'routes')) ? '  routes,' : ''}
${fs.existsSync(path.join(moduloPath, 'services')) ? '  ...services,' : ''}
};
`;
      
      fs.writeFileSync(indexPath, indexContent);
      console.log(`  ✅ Criado: ${modulo}/index.js`);
    }
  });
}

// Padronizar nomenclatura (verificar)
function verificarNomenclatura() {
  console.log('\n📝 Verificando nomenclatura...');
  
  const modulesPath = path.join(rootPath, 'src', 'modules');
  const modulos = fs.readdirSync(modulesPath);
  
  let padronizados = 0;
  let naoPadronizados = 0;
  
  modulos.forEach(modulo => {
    const moduloPath = path.join(modulesPath, modulo);
    if (!fs.statSync(moduloPath).isDirectory()) return;
    
    // Verificar controllers
    const controllersPath = path.join(moduloPath, 'controllers');
    if (fs.existsSync(controllersPath)) {
      const controllers = fs.readdirSync(controllersPath);
      controllers.forEach(controller => {
        const padrao = controller.endsWith('.controller.js');
        if (padrao) {
          padronizados++;
        } else {
          naoPadronizados++;
          console.log(`  ⚠️  ${modulo}/controllers/${controller} não segue padrão`);
        }
      });
    }
    
    // Verificar routes
    const routesPath = path.join(moduloPath, 'routes');
    if (fs.existsSync(routesPath)) {
      const routes = fs.readdirSync(routesPath);
      routes.forEach(route => {
        const padrao = route.endsWith('.routes.js');
        if (padrao) {
          padronizados++;
        } else {
          naoPadronizados++;
          console.log(`  ⚠️  ${modulo}/routes/${route} não segue padrão`);
        }
      });
    }
    
    // Verificar services
    const servicesPath = path.join(moduloPath, 'services');
    if (fs.existsSync(servicesPath)) {
      const services = fs.readdirSync(servicesPath);
      services.forEach(service => {
        const padrao = service.endsWith('.service.js');
        if (padrao) {
          padronizados++;
        } else {
          naoPadronizados++;
          console.log(`  ⚠️  ${modulo}/services/${service} não segue padrão`);
        }
      });
    }
  });
  
  console.log(`\n📊 Nomenclatura: ${padronizados} padronizados, ${naoPadronizados} não padronizados`);
}

// Verificar consistência de imports no servidor
function verificarConsistenciaServidor() {
  console.log('\n🖥️  Verificando consistência do servidor...');
  
  const serverPath = path.join(rootPath, 'server-fly.js');
  if (!fs.existsSync(serverPath)) {
    console.log('  ❌ server-fly.js não encontrado');
    return;
  }
  
  const content = fs.readFileSync(serverPath, 'utf8');
  
  // Verificar se usa apenas módulos novos
  const usaModulosNovos = content.includes('src/modules/');
  const usaModulosAntigos = content.includes("require('./routes/") || 
                           content.includes("require('./controllers/") ||
                           content.includes("require('./services/");
  
  if (usaModulosNovos && !usaModulosAntigos) {
    console.log('  ✅ Servidor usa apenas módulos novos');
  } else {
    console.log('  ⚠️  Servidor pode estar usando módulos antigos');
  }
}

// Executar refactor
try {
  criarIndexModules();
  verificarNomenclatura();
  verificarConsistenciaServidor();
  
  console.log('\n✅ ETAPA 6 CONCLUÍDA');
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}

