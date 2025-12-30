// ============================================================
// VERIFICAÇÃO SUPREMA V19 - ETAPA 1: RECONSTRUIR CONTEXTO
// ============================================================
// Data: 2025-01-24
// Objetivo: Mapear TODA a estrutura do projeto automaticamente

const fs = require('fs');
const path = require('path');

const contexto = {
  timestamp: new Date().toISOString(),
  versao: 'V19.0.0',
  projeto: 'Gol de Ouro Backend',
  
  estrutura: {
    src: {},
    modules: {},
    controllers: {},
    services: {},
    routes: {},
    scripts: {},
    tests: {},
    config: {},
    database: {},
    migrations: {},
    patches: {}
  },
  
  arquivos_importantes: {
    servidor: [],
    config: [],
    env: []
  },
  
  variaveis_ambiente: {
    obrigatorias: [],
    opcionais: [],
    engine_v19: []
  }
};

function scanDirectory(dir, basePath = '') {
  const items = {};
  try {
    const fullPath = path.join(basePath, dir);
    if (!fs.existsSync(fullPath)) return items;
    
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      
      const entryPath = path.join(fullPath, entry.name);
      const relativePath = path.relative(process.cwd(), entryPath).replace(/\\/g, '/');
      
      if (entry.isDirectory()) {
        items[entry.name] = scanDirectory(entry.name, fullPath);
      } else if (entry.isFile()) {
        items[entry.name] = {
          path: relativePath,
          size: fs.statSync(entryPath).size,
          modified: fs.statSync(entryPath).mtime.toISOString()
        };
      }
    }
  } catch (error) {
    console.error(`Erro ao escanear ${dir}:`, error.message);
  }
  return items;
}

function findFiles(pattern, baseDir = '') {
  const files = [];
  function search(dir) {
    try {
      const fullPath = path.join(baseDir, dir);
      if (!fs.existsSync(fullPath)) return;
      
      const entries = fs.readdirSync(fullPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        
        const entryPath = path.join(fullPath, entry.name);
        
        if (entry.isDirectory()) {
          search(path.relative(baseDir, entryPath));
        } else if (entry.isFile()) {
          if (pattern.test(entry.name)) {
            files.push({
              name: entry.name,
              path: path.relative(process.cwd(), entryPath).replace(/\\/g, '/'),
              size: fs.statSync(entryPath).size
            });
          }
        }
      }
    } catch (error) {
      // Ignorar erros de acesso
    }
  }
  search(baseDir || '.');
  return files;
}

// 1. Escanear estrutura src/
console.log('📁 Escaneando estrutura src/...');
contexto.estrutura.src = scanDirectory('src');

// 2. Escanear módulos
console.log('📦 Escaneando módulos...');
if (fs.existsSync('src/modules')) {
  const modules = fs.readdirSync('src/modules', { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);
  
  contexto.estrutura.modules = {};
  for (const module of modules) {
    contexto.estrutura.modules[module] = scanDirectory(`src/modules/${module}`);
  }
}

// 3. Escanear controllers
console.log('🎮 Escaneando controllers...');
const controllers = findFiles(/controller\.js$/i);
contexto.estrutura.controllers = {
  total: controllers.length,
  arquivos: controllers.map(c => c.path)
};

// 4. Escanear services
console.log('⚙️ Escaneando services...');
const services = findFiles(/service\.js$/i);
contexto.estrutura.services = {
  total: services.length,
  arquivos: services.map(s => s.path)
};

// 5. Escanear routes
console.log('🛣️ Escaneando routes...');
const routes = findFiles(/routes?\.js$/i);
contexto.estrutura.routes = {
  total: routes.length,
  arquivos: routes.map(r => r.path)
};

// 6. Escanear scripts
console.log('📜 Escaneando scripts...');
if (fs.existsSync('src/scripts')) {
  contexto.estrutura.scripts = scanDirectory('src/scripts');
}

// 7. Escanear testes
console.log('🧪 Escaneando testes...');
const tests = findFiles(/\.(test|spec)\.js$/i);
contexto.estrutura.tests = {
  total: tests.length,
  arquivos: tests.map(t => t.path)
};

// 8. Escanear config
console.log('⚙️ Escaneando config...');
if (fs.existsSync('config')) {
  contexto.estrutura.config = scanDirectory('config');
}
if (fs.existsSync('src/config')) {
  contexto.estrutura.config.src = scanDirectory('src/config');
}

// 9. Escanear database
console.log('🗄️ Escaneando database...');
if (fs.existsSync('database')) {
  contexto.estrutura.database = scanDirectory('database');
}

// 10. Escanear migrations
console.log('🔄 Escaneando migrations...');
const migrations = findFiles(/\.sql$/i, 'prisma/migrations');
contexto.estrutura.migrations = {
  total: migrations.length,
  arquivos: migrations.map(m => m.path)
};

// 11. Escanear patches
console.log('🔧 Escaneando patches...');
if (fs.existsSync('patches')) {
  contexto.estrutura.patches = scanDirectory('patches');
}

// 12. Arquivos importantes
console.log('📄 Identificando arquivos importantes...');
contexto.arquivos_importantes.servidor = findFiles(/server.*\.js$/i);
contexto.arquivos_importantes.config = findFiles(/config.*\.js$/i);
contexto.arquivos_importantes.env = findFiles(/\.env/i);

// 13. Variáveis de ambiente esperadas
console.log('🔐 Identificando variáveis de ambiente...');
const envExample = fs.existsSync('env.example') 
  ? fs.readFileSync('env.example', 'utf8') 
  : '';

const envExampleJs = fs.existsSync('src/config/env.example.js')
  ? fs.readFileSync('src/config/env.example.js', 'utf8')
  : '';

// Extrair variáveis do env.example
const envVars = new Set();
[envExample, envExampleJs].forEach(content => {
  const matches = content.matchAll(/([A-Z_]+)\s*=/g);
  for (const match of matches) {
    envVars.add(match[1]);
  }
});

contexto.variaveis_ambiente.obrigatorias = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'JWT_SECRET',
  'NODE_ENV',
  'PORT'
];

contexto.variaveis_ambiente.engine_v19 = [
  'USE_ENGINE_V19',
  'USE_DB_QUEUE',
  'ENGINE_HEARTBEAT_ENABLED',
  'ENGINE_MONITOR_ENABLED',
  'HEARTBEAT_INTERVAL_MS',
  'INSTANCE_ID'
];

contexto.variaveis_ambiente.opcionais = Array.from(envVars).filter(
  v => !contexto.variaveis_ambiente.obrigatorias.includes(v) &&
       !contexto.variaveis_ambiente.engine_v19.includes(v)
);

// 14. Estatísticas
contexto.estatisticas = {
  total_controllers: controllers.length,
  total_services: services.length,
  total_routes: routes.length,
  total_scripts: fs.existsSync('src/scripts') 
    ? fs.readdirSync('src/scripts').filter(f => f.endsWith('.js')).length 
    : 0,
  total_tests: tests.length,
  total_migrations: migrations.length,
  modulos: Object.keys(contexto.estrutura.modules).length
};

// Salvar resultado
const outputDir = 'logs/v19/VERIFICACAO_SUPREMA';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputFile = path.join(outputDir, '01_contexto_reconstruido.json');
fs.writeFileSync(outputFile, JSON.stringify(contexto, null, 2), 'utf8');

console.log('\n✅ Contexto reconstruído com sucesso!');
console.log(`📊 Estatísticas:`);
console.log(`   - Controllers: ${contexto.estatisticas.total_controllers}`);
console.log(`   - Services: ${contexto.estatisticas.total_services}`);
console.log(`   - Routes: ${contexto.estatisticas.total_routes}`);
console.log(`   - Scripts: ${contexto.estatisticas.total_scripts}`);
console.log(`   - Testes: ${contexto.estatisticas.total_tests}`);
console.log(`   - Módulos: ${contexto.estatisticas.modulos}`);
console.log(`\n💾 Salvo em: ${outputFile}`);

module.exports = contexto;

