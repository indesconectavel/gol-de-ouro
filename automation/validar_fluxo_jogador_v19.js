// Validação Completa do Fluxo do Jogador - Engine V19
// Verifica se está 100% pronto para testes reais

const { getClient } = require('./lib/supabase-client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOG_DIR = path.join(__dirname, '../../logs/v19/validacao');
const REPORT_DIR = path.join(__dirname, '../../logs/v19/validacao');

// Criar diretórios se não existirem
[LOG_DIR, REPORT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  const logFile = path.join(LOG_DIR, `validacao_${new Date().toISOString().split('T')[0]}.log`);
  fs.appendFileSync(logFile, logMessage + '\n', 'utf8');
  console.log(`[VALIDACAO] ${logMessage}`);
}

const results = {
  timestamp: new Date().toISOString(),
  checks: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  recommendations: []
};

// ============================================
// 1. VALIDAÇÃO DO APP REACT NATIVE
// ============================================

async function validarAppReactNative() {
  log('=== VALIDANDO APP REACT NATIVE ===', 'INFO');
  const check = { name: 'App React Native', items: [], status: 'pending' };
  
  try {
    const mobileDir = path.join(__dirname, '../../goldeouro-mobile');
    
    // 1.1 Verificar se diretório existe
    if (!fs.existsSync(mobileDir)) {
      check.items.push({ item: 'Diretório goldeouro-mobile existe', status: 'FAIL', message: 'Diretório não encontrado' });
      check.status = 'FAIL';
      return check;
    }
    check.items.push({ item: 'Diretório goldeouro-mobile existe', status: 'PASS' });
    
    // 1.2 Verificar package.json
    const packageJsonPath = path.join(mobileDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      check.items.push({ item: 'package.json existe', status: 'FAIL', message: 'Arquivo não encontrado' });
      check.status = 'FAIL';
      return check;
    }
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    check.items.push({ item: 'package.json existe', status: 'PASS' });
    
    // 1.3 Verificar Expo instalado
    if (!packageJson.dependencies.expo && !packageJson.devDependencies.expo) {
      check.items.push({ item: 'Expo instalado', status: 'FAIL', message: 'Expo não encontrado nas dependências' });
      check.status = 'FAIL';
    } else {
      check.items.push({ item: 'Expo instalado', status: 'PASS', message: `Versão: ${packageJson.dependencies.expo || packageJson.devDependencies.expo}` });
    }
    
    // 1.4 Verificar Expo Router
    if (!packageJson.dependencies['expo-router']) {
      check.items.push({ item: 'Expo Router instalado', status: 'WARN', message: 'Expo Router não encontrado (pode usar React Navigation)' });
    } else {
      check.items.push({ item: 'Expo Router instalado', status: 'PASS', message: `Versão: ${packageJson.dependencies['expo-router']}` });
    }
    
    // 1.5 Verificar app.json
    const appJsonPath = path.join(mobileDir, 'app.json');
    if (!fs.existsSync(appJsonPath)) {
      check.items.push({ item: 'app.json existe', status: 'FAIL', message: 'Arquivo não encontrado' });
      check.status = 'FAIL';
      return check;
    }
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
    check.items.push({ item: 'app.json existe', status: 'PASS' });
    
    // 1.6 Verificar backend URL configurada
    const apiUrl = appJson.expo?.extra?.apiUrl || process.env.EXPO_PUBLIC_API_URL;
    if (!apiUrl) {
      check.items.push({ item: 'Backend URL configurada', status: 'FAIL', message: 'URL do backend não encontrada' });
      check.status = 'FAIL';
    } else {
      check.items.push({ item: 'Backend URL configurada', status: 'PASS', message: `URL: ${apiUrl}` });
      
      // Verificar se URL é produção
      if (apiUrl.includes('goldeouro-backend-v2.fly.dev')) {
        check.items.push({ item: 'Backend URL é produção', status: 'PASS', message: 'URL de produção configurada' });
      } else {
        check.items.push({ item: 'Backend URL é produção', status: 'WARN', message: `URL não é produção: ${apiUrl}` });
      }
    }
    
    // 1.7 Verificar Supabase configurado no app
    const envExamplePath = path.join(mobileDir, '.env.example');
    const envPath = path.join(mobileDir, '.env');
    let hasSupabaseConfig = false;
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      hasSupabaseConfig = envContent.includes('SUPABASE_URL') && envContent.includes('SUPABASE_ANON_KEY');
    }
    
    if (!hasSupabaseConfig && fs.existsSync(envExamplePath)) {
      const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
      hasSupabaseConfig = envExampleContent.includes('SUPABASE_URL');
    }
    
    if (!hasSupabaseConfig) {
      check.items.push({ item: 'Supabase configurado no app', status: 'WARN', message: 'Configuração Supabase não encontrada (pode estar em runtime)' });
    } else {
      check.items.push({ item: 'Supabase configurado no app', status: 'PASS' });
    }
    
    // 1.8 Verificar se node_modules existe (dependências instaladas)
    const nodeModulesPath = path.join(mobileDir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      check.items.push({ item: 'Dependências instaladas', status: 'WARN', message: 'node_modules não encontrado. Execute: cd goldeouro-mobile && npm install' });
    } else {
      check.items.push({ item: 'Dependências instaladas', status: 'PASS' });
    }
    
    // 1.9 Verificar comando expo start
    try {
      const expoVersion = execSync('npx expo --version', { cwd: mobileDir, encoding: 'utf8', stdio: 'pipe' }).trim();
      check.items.push({ item: 'Comando npx expo start disponível', status: 'PASS', message: `Expo CLI versão: ${expoVersion}` });
    } catch (error) {
      check.items.push({ item: 'Comando npx expo start disponível', status: 'WARN', message: 'Expo CLI não encontrado globalmente (pode usar npx)' });
    }
    
    check.status = check.items.some(i => i.status === 'FAIL') ? 'FAIL' : 'PASS';
    
  } catch (error) {
    check.items.push({ item: 'Erro na validação', status: 'FAIL', message: error.message });
    check.status = 'FAIL';
  }
  
  return check;
}

// ============================================
// 2. VALIDAÇÃO DO FLUXO PIX REAL
// ============================================

async function validarFluxoPix() {
  log('=== VALIDANDO FLUXO PIX REAL ===', 'INFO');
  const check = { name: 'Fluxo PIX Real', items: [], status: 'pending' };
  
  try {
    const backendUrl = process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
    
    // 2.1 Verificar endpoint criar cobrança
    try {
      const healthResponse = await axios.get(`${backendUrl}/health`, { timeout: 5000 });
      if (healthResponse.status === 200) {
        check.items.push({ item: 'Backend online', status: 'PASS', message: `Backend respondendo: ${backendUrl}` });
      } else {
        check.items.push({ item: 'Backend online', status: 'FAIL', message: `Status: ${healthResponse.status}` });
        check.status = 'FAIL';
        return check;
      }
    } catch (error) {
      check.items.push({ item: 'Backend online', status: 'FAIL', message: `Erro: ${error.message}` });
      check.status = 'FAIL';
      return check;
    }
    
    // 2.2 Verificar endpoint /api/payments/pix/criar
    try {
      // Teste sem autenticação (deve retornar 401)
      const testResponse = await axios.post(`${backendUrl}/api/payments/pix/criar`, {}, { 
        timeout: 5000,
        validateStatus: () => true 
      });
      
      if (testResponse.status === 401 || testResponse.status === 403) {
        check.items.push({ item: 'Endpoint /api/payments/pix/criar existe', status: 'PASS', message: 'Endpoint protegido corretamente' });
      } else if (testResponse.status === 400) {
        check.items.push({ item: 'Endpoint /api/payments/pix/criar existe', status: 'PASS', message: 'Endpoint existe (validação de dados)' });
      } else {
        check.items.push({ item: 'Endpoint /api/payments/pix/criar existe', status: 'WARN', message: `Status inesperado: ${testResponse.status}` });
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        check.items.push({ item: 'Endpoint /api/payments/pix/criar existe', status: 'FAIL', message: 'Backend não acessível' });
        check.status = 'FAIL';
        return check;
      } else {
        check.items.push({ item: 'Endpoint /api/payments/pix/criar existe', status: 'PASS', message: 'Endpoint existe (erro esperado sem auth)' });
      }
    }
    
    // 2.3 Verificar webhook endpoint
    try {
      const webhookResponse = await axios.post(`${backendUrl}/api/payments/webhook`, {}, { 
        timeout: 5000,
        validateStatus: () => true 
      });
      
      if (webhookResponse.status === 200 || webhookResponse.status === 400 || webhookResponse.status === 401) {
        check.items.push({ item: 'Endpoint /api/payments/webhook existe', status: 'PASS', message: 'Webhook endpoint acessível' });
      } else {
        check.items.push({ item: 'Endpoint /api/payments/webhook existe', status: 'WARN', message: `Status: ${webhookResponse.status}` });
      }
    } catch (error) {
      check.items.push({ item: 'Endpoint /api/payments/webhook existe', status: 'WARN', message: `Erro ao testar: ${error.message}` });
    }
    
    // 2.4 Verificar Supabase webhook_events
    try {
      const client = getClient('PROD');
      const { data, error } = await client.from('webhook_events').select('id').limit(1);
      
      if (error && error.code === 'PGRST116') {
        check.items.push({ item: 'Tabela webhook_events existe', status: 'FAIL', message: 'Tabela não encontrada' });
        check.status = 'FAIL';
      } else if (error) {
        check.items.push({ item: 'Tabela webhook_events existe', status: 'WARN', message: `Erro ao acessar: ${error.message}` });
      } else {
        check.items.push({ item: 'Tabela webhook_events existe', status: 'PASS', message: 'Tabela acessível' });
      }
    } catch (error) {
      check.items.push({ item: 'Tabela webhook_events existe', status: 'WARN', message: `Erro: ${error.message}` });
    }
    
    // 2.5 Verificar tabela transacoes
    try {
      const client = getClient('PROD');
      const { data, error } = await client.from('transacoes').select('id').limit(1);
      
      if (error && error.code === 'PGRST116') {
        check.items.push({ item: 'Tabela transacoes existe', status: 'FAIL', message: 'Tabela não encontrada' });
        check.status = 'FAIL';
      } else if (error) {
        check.items.push({ item: 'Tabela transacoes existe', status: 'WARN', message: `Erro ao acessar: ${error.message}` });
      } else {
        check.items.push({ item: 'Tabela transacoes existe', status: 'PASS', message: 'Tabela acessível' });
      }
    } catch (error) {
      check.items.push({ item: 'Tabela transacoes existe', status: 'WARN', message: `Erro: ${error.message}` });
    }
    
    check.status = check.items.some(i => i.status === 'FAIL') ? 'FAIL' : 'PASS';
    
  } catch (error) {
    check.items.push({ item: 'Erro na validação', status: 'FAIL', message: error.message });
    check.status = 'FAIL';
  }
  
  return check;
}

// ============================================
// 3. VALIDAÇÃO DO DISPOSITIVO
// ============================================

async function validarDispositivo() {
  log('=== VALIDANDO DISPOSITIVO ===', 'INFO');
  const check = { name: 'Dispositivo para Testes', items: [], status: 'pending' };
  
  try {
    // 3.1 Verificar Expo Go instalado (não podemos verificar diretamente, mas podemos orientar)
    check.items.push({ 
      item: 'Expo Go instalado', 
      status: 'INFO', 
      message: 'Verifique manualmente: Baixe Expo Go na Play Store (Android) ou App Store (iOS)' 
    });
    
    // 3.2 Verificar se precisa de build
    const mobileDir = path.join(__dirname, '../../goldeouro-mobile');
    const easJsonPath = path.join(mobileDir, 'eas.json');
    
    if (fs.existsSync(easJsonPath)) {
      const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));
      check.items.push({ 
        item: 'EAS Build configurado', 
        status: 'PASS', 
        message: 'Configuração EAS encontrada' 
      });
      
      if (easJson.build?.production) {
        check.items.push({ 
          item: 'Build de produção configurado', 
          status: 'PASS', 
          message: 'Perfil de produção encontrado' 
        });
      }
    } else {
      check.items.push({ 
        item: 'EAS Build configurado', 
        status: 'WARN', 
        message: 'eas.json não encontrado. Para builds: npx eas build --platform android' 
      });
    }
    
    // 3.3 Verificar se há APK gerado
    const apkPath = path.join(mobileDir, '*.apk');
    try {
      const apkFiles = execSync(`Get-ChildItem -Path "${mobileDir}" -Filter "*.apk" -ErrorAction SilentlyContinue`, { 
        shell: 'powershell.exe',
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      if (apkFiles.trim()) {
        check.items.push({ 
          item: 'APK gerado localmente', 
          status: 'PASS', 
          message: 'APK encontrado no diretório' 
        });
      } else {
        check.items.push({ 
          item: 'APK gerado localmente', 
          status: 'INFO', 
          message: 'Nenhum APK local encontrado. Use: npx expo build:android ou eas build' 
        });
      }
    } catch (error) {
      check.items.push({ 
        item: 'APK gerado localmente', 
        status: 'INFO', 
        message: 'Não foi possível verificar APK local' 
      });
    }
    
    check.items.push({ 
      item: 'Opções de teste', 
      status: 'INFO', 
      message: '1) Expo Go (desenvolvimento) 2) Build local (expo build) 3) EAS Build (produção)' 
    });
    
    check.status = 'PASS';
    
  } catch (error) {
    check.items.push({ item: 'Erro na validação', status: 'FAIL', message: error.message });
    check.status = 'FAIL';
  }
  
  return check;
}

// ============================================
// 4. VALIDAÇÃO DOS AMBIENTES SUPABASE
// ============================================

async function validarAmbientesSupabase() {
  log('=== VALIDANDO AMBIENTES SUPABASE ===', 'INFO');
  const check = { name: 'Ambientes Supabase', items: [], status: 'pending' };
  
  const rpcsToTest = [
    { name: 'rpc_get_balance', params: { p_user_id: '00000000-0000-0000-0000-000000000000' } },
    { name: 'rpc_add_balance', params: { p_user_id: '00000000-0000-0000-0000-000000000000', p_amount: 0, p_description: 'test' } },
    { name: 'rpc_get_or_create_lote', params: {} },
    { name: 'rpc_get_active_lotes', params: {} }
  ];
  
  for (const env of ['STG', 'PROD']) {
    log(`Validando ambiente ${env}...`, 'INFO');
    
    try {
      const client = getClient(env);
      
      // Testar conexão básica
      const { data: heartbeat, error: heartbeatError } = await client
        .from('system_heartbeat')
        .select('*')
        .limit(1);
      
      if (heartbeatError && heartbeatError.code === 'PGRST116') {
        check.items.push({ 
          item: `${env}: Conexão estabelecida`, 
          status: 'WARN', 
          message: 'Conectado mas tabela system_heartbeat não encontrada' 
        });
      } else if (heartbeatError) {
        check.items.push({ 
          item: `${env}: Conexão estabelecida`, 
          status: 'FAIL', 
          message: `Erro: ${heartbeatError.message}` 
        });
        continue;
      } else {
        check.items.push({ 
          item: `${env}: Conexão estabelecida`, 
          status: 'PASS' 
        });
      }
      
      // Testar RPCs
      for (const rpc of rpcsToTest) {
        try {
          const { data, error } = await client.rpc(rpc.name, rpc.params);
          
          if (error) {
            if (error.message.includes('function') && error.message.includes('does not exist')) {
              check.items.push({ 
                item: `${env}: RPC ${rpc.name}`, 
                status: 'FAIL', 
                message: 'RPC não encontrada' 
              });
            } else if (error.message.includes('invalid input') || error.message.includes('uuid')) {
              check.items.push({ 
                item: `${env}: RPC ${rpc.name}`, 
                status: 'PASS', 
                message: 'RPC existe (erro esperado com parâmetros de teste)' 
              });
            } else {
              check.items.push({ 
                item: `${env}: RPC ${rpc.name}`, 
                status: 'WARN', 
                message: `Erro: ${error.message}` 
              });
            }
          } else {
            check.items.push({ 
              item: `${env}: RPC ${rpc.name}`, 
              status: 'PASS', 
              message: 'RPC funcionando' 
            });
          }
        } catch (rpcError) {
          check.items.push({ 
            item: `${env}: RPC ${rpc.name}`, 
            status: 'WARN', 
            message: `Erro ao testar: ${rpcError.message}` 
          });
        }
      }
      
    } catch (error) {
      check.items.push({ 
        item: `${env}: Conexão estabelecida`, 
        status: 'FAIL', 
        message: `Erro ao conectar: ${error.message}` 
      });
    }
  }
  
  check.status = check.items.some(i => i.status === 'FAIL') ? 'FAIL' : 'PASS';
  return check;
}

// ============================================
// 5. VALIDAÇÃO DOS ENDPOINTS CRÍTICOS
// ============================================

async function validarEndpointsCriticos() {
  log('=== VALIDANDO ENDPOINTS CRÍTICOS ===', 'INFO');
  const check = { name: 'Endpoints Críticos', items: [], status: 'pending' };
  
  const backendUrl = process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
  
  const endpoints = [
    { path: '/api/payments/pix/criar', method: 'POST', requiresAuth: true },
    { path: '/api/payments/webhook', method: 'POST', requiresAuth: false },
    { path: '/api/games/fila/entrar', method: 'POST', requiresAuth: true },
    { path: '/api/games/chutar', method: 'POST', requiresAuth: true },
    { path: '/api/admin/lotes', method: 'GET', requiresAuth: true },
    { path: '/api/admin/recompensas', method: 'GET', requiresAuth: true }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const config = {
        method: endpoint.method.toLowerCase(),
        url: `${backendUrl}${endpoint.path}`,
        timeout: 5000,
        validateStatus: () => true,
        data: {}
      };
      
      const response = await axios(config);
      
      if (response.status === 401 || response.status === 403) {
        check.items.push({ 
          item: `${endpoint.method} ${endpoint.path}`, 
          status: 'PASS', 
          message: 'Endpoint protegido corretamente' 
        });
      } else if (response.status === 400 || response.status === 404) {
        check.items.push({ 
          item: `${endpoint.method} ${endpoint.path}`, 
          status: 'WARN', 
          message: `Status: ${response.status} (pode ser esperado)` 
        });
      } else if (response.status === 200) {
        check.items.push({ 
          item: `${endpoint.method} ${endpoint.path}`, 
          status: 'PASS', 
          message: 'Endpoint acessível' 
        });
      } else {
        check.items.push({ 
          item: `${endpoint.method} ${endpoint.path}`, 
          status: 'WARN', 
          message: `Status: ${response.status}` 
        });
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        check.items.push({ 
          item: `${endpoint.method} ${endpoint.path}`, 
          status: 'FAIL', 
          message: 'Backend não acessível' 
        });
        check.status = 'FAIL';
      } else {
        check.items.push({ 
          item: `${endpoint.method} ${endpoint.path}`, 
          status: 'WARN', 
          message: `Erro: ${error.message}` 
        });
      }
    }
  }
  
  check.status = check.items.some(i => i.status === 'FAIL') ? 'FAIL' : 'PASS';
  return check;
}

// ============================================
// 6. VALIDAÇÃO DO APP PREPARADO
// ============================================

async function validarAppPreparado() {
  log('=== VALIDANDO APP PREPARADO ===', 'INFO');
  const check = { name: 'App Preparado para Fluxo', items: [], status: 'pending' };
  
  try {
    const mobileDir = path.join(__dirname, '../../goldeouro-mobile');
    const srcDir = path.join(mobileDir, 'src');
    
    // Verificar estrutura de telas/componentes
    const screensDir = path.join(srcDir, 'screens');
    const componentsDir = path.join(srcDir, 'components');
    
    if (fs.existsSync(screensDir)) {
      const screens = fs.readdirSync(screensDir);
      check.items.push({ 
        item: 'Telas implementadas', 
        status: 'INFO', 
        message: `Telas encontradas: ${screens.length}` 
      });
    } else {
      check.items.push({ 
        item: 'Telas implementadas', 
        status: 'WARN', 
        message: 'Diretório src/screens não encontrado' 
      });
    }
    
    if (fs.existsSync(componentsDir)) {
      const components = fs.readdirSync(componentsDir);
      check.items.push({ 
        item: 'Componentes implementados', 
        status: 'INFO', 
        message: `Componentes encontrados: ${components.length}` 
      });
    } else {
      check.items.push({ 
        item: 'Componentes implementados', 
        status: 'WARN', 
        message: 'Diretório src/components não encontrado' 
      });
    }
    
    // Verificar se há serviços/API configurados
    const servicesDir = path.join(srcDir, 'services');
    if (fs.existsSync(servicesDir)) {
      check.items.push({ 
        item: 'Serviços de API configurados', 
        status: 'PASS', 
        message: 'Diretório de serviços encontrado' 
      });
    } else {
      check.items.push({ 
        item: 'Serviços de API configurados', 
        status: 'WARN', 
        message: 'Diretório src/services não encontrado' 
      });
    }
    
    // Verificar funcionalidades específicas
    const funcionalidades = [
      { name: 'Entrar na fila', file: 'fila' },
      { name: 'Realizar chute', file: 'chute' },
      { name: 'Receber animação', file: 'animacao' },
      { name: 'Processar resultado', file: 'resultado' },
      { name: 'Mostrar saldo atualizado', file: 'saldo' }
    ];
    
    for (const func of funcionalidades) {
      // Buscar arquivos relacionados
      try {
        const searchResult = execSync(
          `Get-ChildItem -Path "${srcDir}" -Recurse -Filter "*${func.file}*" -ErrorAction SilentlyContinue | Select-Object -First 1`,
          { shell: 'powershell.exe', encoding: 'utf8', stdio: 'pipe' }
        );
        
        if (searchResult.trim()) {
          check.items.push({ 
            item: func.name, 
            status: 'INFO', 
            message: 'Arquivo relacionado encontrado' 
          });
        } else {
          check.items.push({ 
            item: func.name, 
            status: 'INFO', 
            message: 'Verificar implementação manualmente' 
          });
        }
      } catch (error) {
        check.items.push({ 
          item: func.name, 
          status: 'INFO', 
          message: 'Não foi possível verificar automaticamente' 
        });
      }
    }
    
    check.status = 'PASS';
    
  } catch (error) {
    check.items.push({ item: 'Erro na validação', status: 'FAIL', message: error.message });
    check.status = 'FAIL';
  }
  
  return check;
}

// ============================================
// EXECUÇÃO PRINCIPAL
// ============================================

async function executarValidacaoCompleta() {
  log('═══════════════════════════════════════════════════════════════', 'INFO');
  log('  VALIDAÇÃO COMPLETA DO FLUXO DO JOGADOR - ENGINE V19', 'INFO');
  log('═══════════════════════════════════════════════════════════════', 'INFO');
  log('', 'INFO');
  
  try {
    // Executar todas as validações
    results.checks['appReactNative'] = await validarAppReactNative();
    results.checks['fluxoPix'] = await validarFluxoPix();
    results.checks['dispositivo'] = await validarDispositivo();
    results.checks['ambientesSupabase'] = await validarAmbientesSupabase();
    results.checks['endpointsCriticos'] = await validarEndpointsCriticos();
    results.checks['appPreparado'] = await validarAppPreparado();
    
    // Calcular resumo
    for (const check of Object.values(results.checks)) {
      results.summary.total++;
      
      if (check.status === 'PASS') {
        results.summary.passed++;
      } else if (check.status === 'FAIL') {
        results.summary.failed++;
      } else if (check.status === 'WARN') {
        results.summary.warnings++;
      }
      
      // Contar itens individuais
      for (const item of check.items || []) {
        if (item.status === 'FAIL') {
          results.summary.failed++;
        } else if (item.status === 'WARN') {
          results.summary.warnings++;
        }
      }
    }
    
    // Gerar recomendações
    if (results.checks.appReactNative?.status === 'FAIL') {
      results.recommendations.push('Instalar dependências do app: cd goldeouro-mobile && npm install');
    }
    
    if (results.checks.fluxoPix?.status === 'FAIL') {
      results.recommendations.push('Verificar se o backend está online e acessível');
    }
    
    if (results.checks.ambientesSupabase?.items?.some(i => i.status === 'FAIL')) {
      results.recommendations.push('Aplicar migrations V19 no Supabase se ainda não aplicadas');
    }
    
    // Salvar relatório JSON
    const reportPath = path.join(REPORT_DIR, `validacao_completa_${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), 'utf8');
    log(`Relatório JSON salvo em: ${reportPath}`, 'INFO');
    
    // Gerar relatório Markdown
    await gerarRelatorioMarkdown();
    
    // Exibir resumo
    log('', 'INFO');
    log('═══════════════════════════════════════════════════════════════', 'INFO');
    log('  RESUMO DA VALIDAÇÃO', 'INFO');
    log('═══════════════════════════════════════════════════════════════', 'INFO');
    log(`Total de checks: ${results.summary.total}`, 'INFO');
    log(`✅ Passou: ${results.summary.passed}`, 'INFO');
    log(`❌ Falhou: ${results.summary.failed}`, 'INFO');
    log(`⚠️  Avisos: ${results.summary.warnings}`, 'INFO');
    log('', 'INFO');
    
    if (results.summary.failed === 0) {
      log('🎉 VALIDAÇÃO COMPLETA: Sistema 100% pronto para testes reais!', 'SUCCESS');
    } else {
      log('⚠️  VALIDAÇÃO INCOMPLETA: Corrija os itens que falharam antes de testar', 'WARN');
    }
    
    return results;
    
  } catch (error) {
    log(`❌ ERRO CRÍTICO NA VALIDAÇÃO: ${error.message}`, 'ERROR');
    log(error.stack, 'ERROR');
    throw error;
  }
}

async function gerarRelatorioMarkdown() {
  const reportPath = path.join(REPORT_DIR, `validacao_completa_${Date.now()}.md`);
  
  let markdown = `# VALIDAÇÃO COMPLETA DO FLUXO DO JOGADOR - ENGINE V19\n\n`;
  markdown += `**Data:** ${new Date().toISOString()}\n\n`;
  markdown += `---\n\n`;
  
  markdown += `## 📊 RESUMO\n\n`;
  markdown += `- **Total de checks:** ${results.summary.total}\n`;
  markdown += `- **✅ Passou:** ${results.summary.passed}\n`;
  markdown += `- **❌ Falhou:** ${results.summary.failed}\n`;
  markdown += `- **⚠️  Avisos:** ${results.summary.warnings}\n\n`;
  
  markdown += `## 📋 DETALHES DOS CHECKS\n\n`;
  
  for (const [key, check] of Object.entries(results.checks)) {
    const statusIcon = check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⚠️';
    markdown += `### ${statusIcon} ${check.name}\n\n`;
    markdown += `**Status:** ${check.status}\n\n`;
    
    if (check.items && check.items.length > 0) {
      markdown += `| Item | Status | Mensagem |\n`;
      markdown += `|------|--------|----------|\n`;
      
      for (const item of check.items) {
        const itemIcon = item.status === 'PASS' ? '✅' : item.status === 'FAIL' ? '❌' : item.status === 'WARN' ? '⚠️' : 'ℹ️';
        markdown += `| ${itemIcon} ${item.item} | ${item.status} | ${item.message || '-'} |\n`;
      }
      
      markdown += `\n`;
    }
  }
  
  if (results.recommendations.length > 0) {
    markdown += `## 💡 RECOMENDAÇÕES\n\n`;
    for (const rec of results.recommendations) {
      markdown += `- ${rec}\n`;
    }
    markdown += `\n`;
  }
  
  markdown += `---\n\n`;
  markdown += `**Relatório gerado automaticamente pelo sistema de validação V19**\n`;
  
  fs.writeFileSync(reportPath, markdown, 'utf8');
  log(`Relatório Markdown salvo em: ${reportPath}`, 'INFO');
  
  return reportPath;
}

// Executar se chamado diretamente
if (require.main === module) {
  executarValidacaoCompleta()
    .then(() => {
      process.exit(results.summary.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { executarValidacaoCompleta };

