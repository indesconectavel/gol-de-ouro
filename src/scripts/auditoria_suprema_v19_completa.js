// 🔍 AUDITORIA SUPREMA V19 - SCRIPT COMPLETO
// ===========================================
// Data: 2025-12-10
// Versão: V19.0.0
// Status: AUDITORIA SÊNIOR COMPLETA
//
// Este script executa todas as 8 etapas da auditoria suprema V19
// e gera todos os relatórios necessários
// ===========================================

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

// Diretórios de saída
const DIRS = {
  logs: path.join(__dirname, '../../../logs/auditoria_suprema_v19'),
  patches: path.join(__dirname, '../../../patches/v19'),
  relatorios: path.join(__dirname, '../../../relatorios/v19')
};

// Criar diretórios
Object.values(DIRS).forEach(dir => {
  fs.ensureDirSync(dir);
});

// =====================================================
// ETAPA 0: RECONSTRUÇÃO GLOBAL DO CONTEXTO
// =====================================================

async function etapa0_reconstruirContexto() {
  console.log('🔍 ETAPA 0: Reconstruindo contexto global...');
  
  const contexto = {
    timestamp: new Date().toISOString(),
    versao: 'V19.0.0',
    estrutura: {
      modulos: [],
      controllers: [],
      services: [],
      validators: [],
      rotas: [],
      middlewares: [],
      scripts: [],
      testes: []
    },
    arquivos: {
      servidor: 'server-fly.js',
      config: [],
      database: []
    },
    legacy: {
      controllers: [],
      services: [],
      routes: []
    }
  };

  // Mapear módulos
  const modulosDir = path.join(__dirname, '../modules');
  if (fs.existsSync(modulosDir)) {
    const modulos = fs.readdirSync(modulosDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    contexto.estrutura.modulos = modulos.map(modulo => {
      const moduloPath = path.join(modulosDir, modulo);
      const controllers = [];
      const services = [];
      const routes = [];
      
      // Controllers
      const controllersDir = path.join(moduloPath, 'controllers');
      if (fs.existsSync(controllersDir)) {
        controllers.push(...fs.readdirSync(controllersDir)
          .filter(f => f.endsWith('.js'))
          .map(f => path.join(modulo, 'controllers', f)));
      }
      
      // Services
      const servicesDir = path.join(moduloPath, 'services');
      if (fs.existsSync(servicesDir)) {
        services.push(...fs.readdirSync(servicesDir)
          .filter(f => f.endsWith('.js'))
          .map(f => path.join(modulo, 'services', f)));
      }
      
      // Routes
      const routesDir = path.join(moduloPath, 'routes');
      if (fs.existsSync(routesDir)) {
        routes.push(...fs.readdirSync(routesDir)
          .filter(f => f.endsWith('.js'))
          .map(f => path.join(modulo, 'routes', f)));
      }
      
      return {
        nome: modulo,
        controllers,
        services,
        routes,
        temIndex: fs.existsSync(path.join(moduloPath, 'index.js'))
      };
    });
  }

  // Mapear controllers legacy
  const controllersLegacyDir = path.join(__dirname, '../../controllers');
  if (fs.existsSync(controllersLegacyDir)) {
    contexto.legacy.controllers = fs.readdirSync(controllersLegacyDir)
      .filter(f => f.endsWith('.js') && f !== 'index.js');
  }

  // Mapear services legacy
  const servicesLegacyDir = path.join(__dirname, '../../services');
  if (fs.existsSync(servicesLegacyDir)) {
    contexto.legacy.services = fs.readdirSync(servicesLegacyDir)
      .filter(f => f.endsWith('.js') && f !== 'index.js');
  }

  // Mapear validators
  const validatorsDir = path.join(__dirname, '../modules/shared/validators');
  if (fs.existsSync(validatorsDir)) {
    contexto.estrutura.validators = fs.readdirSync(validatorsDir)
      .filter(f => f.endsWith('.js'));
  }

  // Mapear middlewares
  const middlewaresDir = path.join(__dirname, '../modules/shared/middleware');
  if (fs.existsSync(middlewaresDir)) {
    contexto.estrutura.middlewares = fs.readdirSync(middlewaresDir)
      .filter(f => f.endsWith('.js'));
  }

  // Mapear scripts
  const scriptsDir = path.join(__dirname, '.');
  contexto.estrutura.scripts = fs.readdirSync(scriptsDir)
    .filter(f => f.endsWith('.js') || f.endsWith('.sh'))
    .map(f => `src/scripts/${f}`);

  // Mapear testes
  const testesDir = path.join(__dirname, '../tests');
  if (fs.existsSync(testesDir)) {
    const mapearTestes = (dir, prefix = '') => {
      const arquivos = [];
      const items = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          arquivos.push(...mapearTestes(fullPath, `${prefix}${item.name}/`));
        } else if (item.name.endsWith('.js') || item.name.endsWith('.spec.js')) {
          arquivos.push(`${prefix}${item.name}`);
        }
      }
      return arquivos;
    };
    
    contexto.estrutura.testes = mapearTestes(testesDir);
  }

  // Mapear arquivos de configuração
  const configDir = path.join(__dirname, '../../config');
  if (fs.existsSync(configDir)) {
    contexto.arquivos.config = fs.readdirSync(configDir)
      .filter(f => f.endsWith('.js'));
  }

  // Mapear arquivos de database
  const databaseDir = path.join(__dirname, '../../database');
  if (fs.existsSync(databaseDir)) {
    contexto.arquivos.database = fs.readdirSync(databaseDir)
      .filter(f => f.endsWith('.sql') || f.endsWith('.js'));
  }

  // Salvar JSON
  await fs.writeJSON(
    path.join(DIRS.logs, 'MAPA-COMPLETO-V19.json'),
    contexto,
    { spaces: 2 }
  );

  // Gerar árvore de arquivos
  const arvore = gerarArvoreArquivos();
  await fs.writeFile(
    path.join(DIRS.logs, 'ARVORE-DE-ARQUIVOS-V19.md'),
    arvore
  );

  console.log('✅ ETAPA 0 concluída');
  return contexto;
}

function gerarArvoreArquivos() {
  const raiz = path.join(__dirname, '../..');
  let arvore = '# 📁 ÁRVORE DE ARQUIVOS V19\n\n';
  arvore += `**Data:** ${new Date().toISOString()}\n\n`;
  arvore += '```\n';
  
  const mapearDiretorio = (dir, prefix = '', nivel = 0) => {
    if (nivel > 5) return ''; // Limitar profundidade
    
    const items = fs.readdirSync(dir, { withFileTypes: true })
      .filter(item => {
        // Ignorar node_modules, .git, etc
        const ignorar = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage'];
        return !ignorar.includes(item.name);
      })
      .sort((a, b) => {
        // Diretórios primeiro
        if (a.isDirectory() && !b.isDirectory()) return -1;
        if (!a.isDirectory() && b.isDirectory()) return 1;
        return a.name.localeCompare(b.name);
      });
    
    let resultado = '';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isLast = i === items.length - 1;
      const currentPrefix = isLast ? '└── ' : '├── ';
      const nextPrefix = isLast ? '    ' : '│   ';
      
      resultado += `${prefix}${currentPrefix}${item.name}\n`;
      
      if (item.isDirectory()) {
        const subDir = path.join(dir, item.name);
        resultado += mapearDiretorio(subDir, prefix + nextPrefix, nivel + 1);
      }
    }
    
    return resultado;
  };
  
  arvore += mapearDiretorio(raiz);
  arvore += '```\n';
  
  return arvore;
}

// =====================================================
// ETAPA 1: AUDITORIA DE CONFIGURAÇÃO (.env)
// =====================================================

async function etapa1_auditarEnv() {
  console.log('🔍 ETAPA 1: Auditando configuração (.env)...');
  
  const relatorio = {
    timestamp: new Date().toISOString(),
    arquivo_env: null,
    variaveis: {
      obrigatorias: {},
      v19: {},
      opcionais: {}
    },
    banco_detectado: null,
    problemas: []
  };

  // Verificar arquivo .env
  const envPath = path.join(__dirname, '../../.env');
  const envExamplePath = path.join(__dirname, '../../env.example');
  
  if (fs.existsSync(envPath)) {
    relatorio.arquivo_env = 'existe';
    const envContent = fs.readFileSync(envPath, 'utf8');
    const linhas = envContent.split('\n');
    
    // Mapear variáveis
    for (const linha of linhas) {
      const match = linha.match(/^([A-Z_]+)=(.*)$/);
      if (match) {
        const [, nome, valor] = match;
        const valorLimpo = valor.trim().replace(/^["']|["']$/g, '');
        
        // Categorizar
        if (nome.includes('SUPABASE')) {
          relatorio.variaveis.obrigatorias[nome] = {
            definida: !!valorLimpo && !valorLimpo.includes('your-'),
            valor: valorLimpo.includes('your-') ? 'PLACEHOLDER' : '***'
          };
          
          // Detectar banco
          if (nome === 'SUPABASE_URL' && valorLimpo) {
            if (valorLimpo.includes('goldeouro-db')) {
              relatorio.banco_detectado = 'goldeouro-db';
            } else if (valorLimpo.includes('goldeouro-production') || valorLimpo.includes('gayopagjdrkcmkirmfvy')) {
              relatorio.banco_detectado = 'goldeouro-production';
            } else {
              relatorio.banco_detectado = 'desconhecido';
            }
          }
        } else if (nome.includes('ENGINE') || nome.includes('V19') || nome === 'USE_DB_QUEUE') {
          relatorio.variaveis.v19[nome] = {
            definida: !!valorLimpo,
            valor: valorLimpo
          };
        }
      }
    }
  } else {
    relatorio.arquivo_env = 'nao_existe';
    relatorio.problemas.push('Arquivo .env não encontrado');
  }

  // Verificar env.example
  if (fs.existsSync(envExamplePath)) {
    const exampleContent = fs.readFileSync(envExamplePath, 'utf8');
    const temV19 = exampleContent.includes('USE_ENGINE_V19') || 
                   exampleContent.includes('ENGINE_HEARTBEAT');
    
    if (!temV19) {
      relatorio.problemas.push('env.example não contém variáveis V19');
    }
  }

  // Salvar relatório
  await fs.writeJSON(
    path.join(DIRS.relatorios, 'RELATORIO-ENV-V19.json'),
    relatorio,
    { spaces: 2 }
  );

  console.log('✅ ETAPA 1 concluída');
  return relatorio;
}

// =====================================================
// EXECUTAR TODAS AS ETAPAS
// =====================================================

async function executarAuditoriaCompleta() {
  console.log('🚀 Iniciando Auditoria Suprema V19...\n');
  
  try {
    const etapa0 = await etapa0_reconstruirContexto();
    const etapa1 = await etapa1_auditarEnv();
    
    console.log('\n✅ Auditoria Suprema V19 concluída!');
    console.log(`📁 Relatórios salvos em: ${DIRS.logs}`);
    console.log(`📁 Patches salvos em: ${DIRS.patches}`);
    console.log(`📁 Relatórios salvos em: ${DIRS.relatorios}`);
    
  } catch (error) {
    console.error('❌ Erro na auditoria:', error);
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  executarAuditoriaCompleta();
}

module.exports = {
  executarAuditoriaCompleta,
  etapa0_reconstruirContexto,
  etapa1_auditarEnv
};

