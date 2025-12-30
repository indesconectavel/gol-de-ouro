// ETAPA 5 - Limpeza Final
// ========================
const fs = require('fs');
const path = require('path');

const rootPath = path.join(__dirname, '..', '..');
const legacyPath = path.join(rootPath, 'legacy', 'v19_removed');

console.log('🗑️  [ETAPA 5] Limpeza Final - Movendo código morto...\n');

// Criar estrutura legacy
function criarEstruturaLegacy() {
  const pastas = ['controllers', 'routes', 'services', 'utils', 'middlewares'];
  pastas.forEach(pasta => {
    const pastaPath = path.join(legacyPath, pasta);
    if (!fs.existsSync(pastaPath)) {
      fs.mkdirSync(pastaPath, { recursive: true });
    }
  });
  console.log('✅ Estrutura legacy criada');
}

// Mover arquivos antigos
function moverArquivosAntigos() {
  let movidos = 0;
  
  // Mover controllers antigos
  const controllersPath = path.join(rootPath, 'controllers');
  if (fs.existsSync(controllersPath)) {
    const controllers = fs.readdirSync(controllersPath).filter(f => f.endsWith('.js'));
    controllers.forEach(controller => {
      const origem = path.join(controllersPath, controller);
      const destino = path.join(legacyPath, 'controllers', controller);
      fs.copyFileSync(origem, destino);
      movidos++;
      console.log(`  ➡️  Movido: controllers/${controller}`);
    });
  }
  
  // Mover routes antigas
  const routesPath = path.join(rootPath, 'routes');
  if (fs.existsSync(routesPath)) {
    const routes = fs.readdirSync(routesPath).filter(f => f.endsWith('.js'));
    routes.forEach(route => {
      const origem = path.join(routesPath, route);
      const destino = path.join(legacyPath, 'routes', route);
      fs.copyFileSync(origem, destino);
      movidos++;
      console.log(`  ➡️  Movido: routes/${route}`);
    });
  }
  
  // Mover services antigos
  const servicesPath = path.join(rootPath, 'services');
  if (fs.existsSync(servicesPath)) {
    const services = fs.readdirSync(servicesPath).filter(f => f.endsWith('.js'));
    services.forEach(service => {
      const origem = path.join(servicesPath, service);
      const destino = path.join(legacyPath, 'services', service);
      fs.copyFileSync(origem, destino);
      movidos++;
      console.log(`  ➡️  Movido: services/${service}`);
    });
  }
  
  console.log(`\n✅ ${movidos} arquivos movidos para legacy/`);
  return movidos;
}

// Executar limpeza
try {
  criarEstruturaLegacy();
  const movidos = moverArquivosAntigos();
  
  console.log('\n✅ ETAPA 5 CONCLUÍDA');
  console.log(`   Arquivos movidos: ${movidos}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}

