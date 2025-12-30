// ETAPA 1 - Reconstruir Contexto Completo V19
// ============================================
const fs = require('fs');
const path = require('path');

const contexto = {
  timestamp: new Date().toISOString(),
  projeto: 'Gol de Ouro Backend',
  versao: 'V19.0.0',
  estrutura: {},
  arquivos: {},
  variaveis_ambiente: {},
  engine_v19: {}
};

console.log('🔍 [ETAPA 1] Reconstruindo contexto completo...\n');

// Mapear estrutura de módulos
function mapearModulos() {
  console.log('📁 Mapeando módulos...');
  const modulesPath = path.join(__dirname, '..', 'modules');
  
  if (fs.existsSync(modulesPath)) {
    const modulos = fs.readdirSync(modulesPath);
    contexto.estrutura.modulos = {};
    
    modulos.forEach(modulo => {
      const moduloPath = path.join(modulesPath, modulo);
      if (fs.statSync(moduloPath).isDirectory()) {
        contexto.estrutura.modulos[modulo] = {
          controllers: [],
          routes: [],
          services: []
        };
        
        // Controllers
        const controllersPath = path.join(moduloPath, 'controllers');
        if (fs.existsSync(controllersPath)) {
          contexto.estrutura.modulos[modulo].controllers = 
            fs.readdirSync(controllersPath).filter(f => f.endsWith('.js'));
        }
        
        // Routes
        const routesPath = path.join(moduloPath, 'routes');
        if (fs.existsSync(routesPath)) {
          contexto.estrutura.modulos[modulo].routes = 
            fs.readdirSync(routesPath).filter(f => f.endsWith('.js'));
        }
        
        // Services
        const servicesPath = path.join(moduloPath, 'services');
        if (fs.existsSync(servicesPath)) {
          contexto.estrutura.modulos[modulo].services = 
            fs.readdirSync(servicesPath).filter(f => f.endsWith('.js'));
        }
        
        console.log(`  ✅ Módulo ${modulo}: ${contexto.estrutura.modulos[modulo].controllers.length} controllers, ${contexto.estrutura.modulos[modulo].routes.length} routes, ${contexto.estrutura.modulos[modulo].services.length} services`);
      }
    });
  }
}

// Identificar arquivo do servidor
function identificarServidor() {
  console.log('\n🖥️  Identificando servidor...');
  const rootPath = path.join(__dirname, '..', '..');
  const servidoresPossiveis = ['server-fly.js', 'server.js', 'index.js'];
  
  for (const servidor of servidoresPossiveis) {
    const servidorPath = path.join(rootPath, servidor);
    if (fs.existsSync(servidorPath)) {
      contexto.arquivos.servidor = servidor;
      contexto.arquivos.servidor_path = servidorPath;
      console.log(`  ✅ Servidor encontrado: ${servidor}`);
      return;
    }
  }
  
  console.log('  ❌ Servidor não encontrado');
}

// Mapear arquivos importantes
function mapearArquivos() {
  console.log('\n📄 Mapeando arquivos importantes...');
  const rootPath = path.join(__dirname, '..', '..');
  
  const arquivosImportantes = [
    'package.json',
    'database/supabase-unified-config.js',
    'config/system-config.js',
    'config/required-env.js'
  ];
  
  contexto.arquivos.importantes = {};
  
  arquivosImportantes.forEach(arquivo => {
    const arquivoPath = path.join(rootPath, arquivo);
    contexto.arquivos.importantes[arquivo] = fs.existsSync(arquivoPath);
    console.log(`  ${fs.existsSync(arquivoPath) ? '✅' : '❌'} ${arquivo}`);
  });
}

// Identificar Engine V19
function identificarEngineV19() {
  console.log('\n⚙️  Identificando Engine V19...');
  const rootPath = path.join(__dirname, '..', '..');
  
  // Verificar scripts V19
  const scriptsPath = path.join(rootPath, 'src', 'scripts');
  if (fs.existsSync(scriptsPath)) {
    const scripts = fs.readdirSync(scriptsPath)
      .filter(f => f.includes('v19') || f.includes('V19') || f.includes('heartbeat') || f.includes('monitor'));
    
    contexto.engine_v19.scripts = scripts;
    console.log(`  ✅ ${scripts.length} scripts V19 encontrados`);
  }
  
  // Verificar módulo monitor
  const monitorPath = path.join(rootPath, 'src', 'modules', 'monitor');
  contexto.engine_v19.monitor_existe = fs.existsSync(monitorPath);
  console.log(`  ${contexto.engine_v19.monitor_existe ? '✅' : '❌'} Módulo monitor`);
  
  // Verificar heartbeat
  const heartbeatPath = path.join(rootPath, 'src', 'scripts', 'heartbeat_sender.js');
  contexto.engine_v19.heartbeat_existe = fs.existsSync(heartbeatPath);
  console.log(`  ${contexto.engine_v19.heartbeat_existe ? '✅' : '❌'} Heartbeat sender`);
}

// Identificar variáveis de ambiente
function identificarVariaveisAmbiente() {
  console.log('\n🔐 Identificando variáveis de ambiente...');
  
  const variaveisV19 = [
    'USE_ENGINE_V19',
    'USE_DB_QUEUE',
    'ENGINE_HEARTBEAT_ENABLED',
    'ENGINE_MONITOR_ENABLED',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ];
  
  variaveisV19.forEach(variavel => {
    contexto.variaveis_ambiente[variavel] = {
      definida: process.env[variavel] !== undefined,
      valor: process.env[variavel] ? '***' : undefined
    };
    console.log(`  ${process.env[variavel] ? '✅' : '❌'} ${variavel}`);
  });
}

// Executar mapeamento
try {
  mapearModulos();
  identificarServidor();
  mapearArquivos();
  identificarEngineV19();
  identificarVariaveisAmbiente();
  
  // Salvar contexto
  const outputPath = path.join(__dirname, '..', '..', 'mapa_contexto_v19.json');
  fs.writeFileSync(outputPath, JSON.stringify(contexto, null, 2));
  
  console.log(`\n✅ Contexto salvo em: ${outputPath}`);
  console.log(`\n📊 Resumo:`);
  console.log(`   - Módulos: ${Object.keys(contexto.estrutura.modulos || {}).length}`);
  console.log(`   - Servidor: ${contexto.arquivos.servidor || 'Não encontrado'}`);
  console.log(`   - Scripts V19: ${contexto.engine_v19.scripts?.length || 0}`);
  
  process.exit(0);
} catch (error) {
  console.error('❌ Erro:', error);
  process.exit(1);
}

