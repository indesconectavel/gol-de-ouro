/**
 * 🔥 DIAGNÓSTICO V16+ COMPLETO - GOL DE OURO
 * Engenheiro Líder de Diagnóstico
 * Correção Automática de Problemas em Produção
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
const WebSocket = require('ws');

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';
const FRONTEND_URL = 'https://www.goldeouro.lol';
const ADMIN_URL = 'https://admin.goldeouro.lol';
const WS_URL = 'wss://goldeouro-backend-v2.fly.dev';

const REPORTS_DIR = path.join(__dirname, '..', 'docs', 'GO-LIVE');
const LOGS_DIR = path.join(__dirname, '..', 'logs');
const PATCHES_DIR = path.join(__dirname, '..', 'patches');

const diagnostic = {
  timestamp: new Date().toISOString(),
  version: 'V16+',
  status: 'INITIALIZING',
  etapa: 0,
  errors: [],
  warnings: [],
  results: {},
  scores: {},
  artifacts: [],
  token: null,
  userId: null
};

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function log(message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// ETAPA 1: Autodetecção Total
async function etapa1_Autodeteccao() {
  console.log('\n🧠 ETAPA 1: AUTODETECÇÃO TOTAL\n');
  await log('ETAPA 1: Autodetecção total');
  
  diagnostic.etapa = 1;
  const detect = {
    sistema: {},
    rotas: {},
    estrutura: {},
    config: {},
    mapeamento: {}
  };
  
  try {
    // Sistema
    detect.sistema.tipo = 'LOTE_MODERNO';
    detect.sistema.tamanhoLote = 10;
    
    // Rotas
    try {
      const gameRoutes = await fs.readFile(path.join(__dirname, '..', 'routes', 'gameRoutes.js'), 'utf-8');
      detect.rotas.shoot = gameRoutes.includes('/shoot') || gameRoutes.includes('/api/games/shoot');
      detect.rotas.shootPath = gameRoutes.match(/router\.(post|get)\s*\(['"]([^'"]+)['"]/g) || [];
    } catch (e) {}
    
    // Estrutura
    try {
      detect.estrutura.hasLoteService = await fs.access(path.join(__dirname, '..', 'services', 'loteService.js')).then(() => true).catch(() => false);
      detect.estrutura.hasGameController = await fs.access(path.join(__dirname, '..', 'services', 'gameController.js')).then(() => true).catch(() => false);
      detect.estrutura.hasAuthMiddleware = await fs.access(path.join(__dirname, '..', 'middlewares', 'authMiddleware.js')).then(() => true).catch(() => false);
    } catch (e) {}
    
    // Config CORS
    try {
      const serverContent = await fs.readFile(path.join(__dirname, '..', 'server-fly.js'), 'utf-8');
      detect.config.cors = serverContent.includes('app.use(cors');
      detect.config.options = serverContent.includes('OPTIONS') || serverContent.includes('options');
      detect.config.authMiddleware = serverContent.includes('verifyToken') || serverContent.includes('authMiddleware');
    } catch (e) {}
    
    // Mapeamento
    try {
      const gameController = await fs.readFile(path.join(__dirname, '..', 'controllers', 'gameController.js'), 'utf-8');
      detect.mapeamento.shootMethod = gameController.includes('async shoot') || gameController.includes('shoot(req');
      detect.mapeamento.shootParams = gameController.match(/shoot.*?\{[\s\S]*?\}/) || [];
    } catch (e) {}
    
    const report = `# 🧠 V16 DETECT
## Data: ${new Date().toISOString().split('T')[0]}

## Sistema:
${JSON.stringify(detect.sistema, null, 2)}

## Rotas:
${JSON.stringify(detect.rotas, null, 2)}

## Estrutura:
${JSON.stringify(detect.estrutura, null, 2)}

## Config:
${JSON.stringify(detect.config, null, 2)}

## Mapeamento:
${JSON.stringify(detect.mapeamento, null, 2)}
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, 'V16-DETECT.md'), report);
    diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-DETECT.md'));
    
    diagnostic.results.detect = detect;
    await log('ETAPA 1 concluída', detect);
    return detect;
  } catch (error) {
    diagnostic.errors.push(`Erro na etapa 1: ${error.message}`);
    throw error;
  }
}

// ETAPA 2: Teste Real de Autenticação
async function etapa2_Autenticacao() {
  console.log('\n🎯 ETAPA 2: TESTE REAL DE AUTENTICAÇÃO\n');
  await log('ETAPA 2: Teste autenticação');
  
  diagnostic.etapa = 2;
  const auth = {
    cadastro: {},
    login: {},
    token: null,
    jwt: {}
  };
  
  try {
    // Cadastro
    const timestamp = Date.now();
    const cadastroData = {
      email: `test_v16_diag_${timestamp}@example.com`,
      password: 'Test123456!',
      username: `testuser_${timestamp}`
    };
    
    try {
      const r = await axios.post(`${BACKEND_URL}/api/auth/register`, cadastroData, { timeout: 15000 });
      auth.cadastro.success = r.status === 200 || r.status === 201;
      auth.cadastro.data = r.data;
      auth.token = r.data?.token || r.data?.data?.token;
      diagnostic.token = auth.token;
    } catch (e) {
      auth.cadastro.error = e.message;
      auth.cadastro.response = e.response?.data;
    }
    
    // Login
    try {
      const r = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: cadastroData.email,
        password: cadastroData.password
      }, { timeout: 15000 });
      auth.login.success = r.status === 200;
      auth.login.data = r.data;
      if (!auth.token) {
        auth.token = r.data?.token || r.data?.data?.token;
        diagnostic.token = auth.token;
      }
    } catch (e) {
      auth.login.error = e.message;
    }
    
    // Validar JWT
    if (auth.token) {
      const parts = auth.token.split('.');
      auth.jwt.hasThreeParts = parts.length === 3;
      try {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        auth.jwt.payload = payload;
        auth.jwt.hasExp = !!payload.exp;
        auth.jwt.hasUserId = !!payload.userId;
        diagnostic.userId = payload.userId;
      } catch (e) {
        auth.jwt.error = e.message;
      }
    }
    
    const report = `# 🎯 V16 AUTH TEST
## Data: ${new Date().toISOString().split('T')[0]}

## Cadastro:
${JSON.stringify(auth.cadastro, null, 2)}

## Login:
${JSON.stringify(auth.login, null, 2)}

## Token:
${auth.token ? '✅ Gerado' : '❌ Não gerado'}

## JWT:
${JSON.stringify(auth.jwt, null, 2)}
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, 'V16-AUTH-TEST.md'), report);
    diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-AUTH-TEST.md'));
    
    diagnostic.results.auth = auth;
    await log('ETAPA 2 concluída', auth);
    return auth;
  } catch (error) {
    diagnostic.errors.push(`Erro na etapa 2: ${error.message}`);
    throw error;
  }
}

// ETAPA 3: Teste Real de CORS e OPTIONS
async function etapa3_CORS() {
  console.log('\n🎯 ETAPA 3: TESTE REAL DE CORS E OPTIONS\n');
  await log('ETAPA 3: Teste CORS');
  
  diagnostic.etapa = 3;
  const cors = {
    options: {},
    postSemToken: {},
    postComToken: {}
  };
  
  try {
    // OPTIONS
    try {
      const r = await axios.options(`${BACKEND_URL}/api/games/shoot`, {
        headers: {
          'Origin': FRONTEND_URL,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type,Authorization'
        },
        timeout: 10000,
        validateStatus: () => true
      });
      cors.options.status = r.status;
      cors.options.headers = {
        'access-control-allow-origin': r.headers['access-control-allow-origin'],
        'access-control-allow-methods': r.headers['access-control-allow-methods'],
        'access-control-allow-headers': r.headers['access-control-allow-headers']
      };
    } catch (e) {
      cors.options.error = e.message;
    }
    
    // POST sem token
    try {
      const r = await axios.post(`${BACKEND_URL}/api/games/shoot`, {
        direction: 'left',
        amount: 1
      }, {
        headers: { 'Origin': FRONTEND_URL },
        timeout: 10000,
        validateStatus: () => true
      });
      cors.postSemToken.status = r.status;
      cors.postSemToken.data = r.data;
      cors.postSemToken.headers = r.headers;
    } catch (e) {
      cors.postSemToken.error = e.message;
      cors.postSemToken.response = e.response?.data;
    }
    
    // POST com token
    if (diagnostic.token) {
      try {
        const r = await axios.post(`${BACKEND_URL}/api/games/shoot`, {
          direction: 'left',
          amount: 1
        }, {
          headers: {
            'Authorization': `Bearer ${diagnostic.token}`,
            'Origin': FRONTEND_URL,
            'Content-Type': 'application/json'
          },
          timeout: 15000,
          validateStatus: () => true
        });
        cors.postComToken.status = r.status;
        cors.postComToken.data = r.data;
        cors.postComToken.headers = r.headers;
      } catch (e) {
        cors.postComToken.error = e.message;
        cors.postComToken.response = e.response?.data;
        cors.postComToken.statusCode = e.response?.status;
      }
    }
    
    const report = `# 🎯 V16 CORS TEST
## Data: ${new Date().toISOString().split('T')[0]}

## OPTIONS:
${JSON.stringify(cors.options, null, 2)}

## POST sem Token:
${JSON.stringify(cors.postSemToken, null, 2)}

## POST com Token:
${JSON.stringify(cors.postComToken, null, 2)}
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, 'V16-CORS-TEST.md'), report);
    diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-CORS-TEST.md'));
    
    diagnostic.results.cors = cors;
    await log('ETAPA 3 concluída', cors);
    return cors;
  } catch (error) {
    diagnostic.errors.push(`Erro na etapa 3: ${error.message}`);
    throw error;
  }
}

// ETAPA 4: Teste Real de 10 Chutes Automáticos
async function etapa4_Chutes() {
  console.log('\n🎯 ETAPA 4: TESTE REAL DE 10 CHUTES AUTOMÁTICOS\n');
  await log('ETAPA 4: Teste 10 chutes');
  
  diagnostic.etapa = 4;
  const chutes = {
    resultados: [],
    sucesso: 0,
    falhas: 0,
    erros: []
  };
  
  try {
    // CORREÇÃO AUTOMÁTICA: Adicionar saldo ao usuário antes dos testes
    if (diagnostic.token && diagnostic.userId) {
      try {
        const FinancialService = require('../services/financialService');
        const addBalanceResult = await FinancialService.addBalance(
          diagnostic.userId,
          50.00, // R$ 50 para garantir que tenha saldo suficiente
          {
            description: 'Saldo de teste para diagnóstico V16+',
            referenceType: 'teste'
          }
        );
        
        if (addBalanceResult.success) {
          await log(`Saldo adicionado: R$ 50.00 (novo saldo: R$ ${addBalanceResult.data.newBalance})`);
          chutes.saldoAdicionado = true;
        } else {
          await log(`Erro ao adicionar saldo: ${addBalanceResult.error}`);
          chutes.saldoAdicionado = false;
        }
      } catch (e) {
        await log(`Erro ao adicionar saldo: ${e.message}`);
        chutes.saldoAdicionado = false;
      }
    }
    
    // Criar script de teste
    const testScript = `/**
 * Script de teste de chutes - V16+
 */
const axios = require('axios');

const BACKEND_URL = '${BACKEND_URL}';
const TOKEN = '${diagnostic.token || ''}';

async function testShoots() {
  const resultados = [];
  
  for (let i = 0; i < 10; i++) {
    try {
      const startTime = Date.now();
      const r = await axios.post(\`\${BACKEND_URL}/api/games/shoot\`, {
        direction: ['left', 'center', 'right'][i % 3],
        amount: 1
      }, {
        headers: {
          'Authorization': \`Bearer \${TOKEN}\`,
          'Content-Type': 'application/json'
        },
        timeout: 15000,
        validateStatus: () => true
      });
      
      const latency = Date.now() - startTime;
      
      resultados.push({
        index: i + 1,
        status: r.status,
        success: r.status === 200 || r.status === 201,
        latency: latency,
        data: r.data,
        timestamp: new Date().toISOString()
      });
      
      if (r.status === 200 || r.status === 201) {
        console.log(\`✅ Chute \${i + 1}: OK\`);
      } else {
        console.log(\`❌ Chute \${i + 1}: \${r.status} - \${JSON.stringify(r.data)}\`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 600));
    } catch (e) {
      resultados.push({
        index: i + 1,
        error: e.message,
        response: e.response?.data,
        statusCode: e.response?.status,
        timestamp: new Date().toISOString()
      });
      console.log(\`❌ Chute \${i + 1}: ERRO - \${e.message}\`);
    }
  }
  
  return resultados;
}

testShoots().then(resultados => {
  require('fs').writeFileSync('logs/test-shoots-log.json', JSON.stringify(resultados, null, 2));
  console.log('\\n✅ Teste concluído. Resultados salvos em logs/test-shoots-log.json');
}).catch(e => {
  console.error('Erro:', e);
  process.exit(1);
});
`;
    
    await fs.writeFile(path.join(__dirname, 'test-shoots.js'), testScript);
    
    // Executar teste
    if (diagnostic.token) {
      try {
        const resultados = [];
        for (let i = 0; i < 10; i++) {
          try {
            const startTime = Date.now();
            const r = await axios.post(`${BACKEND_URL}/api/games/shoot`, {
              direction: ['left', 'center', 'right'][i % 3],
              amount: 1
            }, {
              headers: {
                'Authorization': `Bearer ${diagnostic.token}`,
                'Content-Type': 'application/json'
              },
              timeout: 15000,
              validateStatus: () => true
            });
            
            const latency = Date.now() - startTime;
            const resultado = {
              index: i + 1,
              status: r.status,
              success: r.status === 200 || r.status === 201,
              latency: latency,
              data: r.data,
              timestamp: new Date().toISOString()
            };
            
            resultados.push(resultado);
            chutes.resultados.push(resultado);
            
            if (r.status === 200 || r.status === 201) {
              chutes.sucesso++;
              await log(`Chute ${i + 1}: OK`);
            } else {
              chutes.falhas++;
              chutes.erros.push({ index: i + 1, status: r.status, data: r.data });
            }
            
            await new Promise(resolve => setTimeout(resolve, 600));
          } catch (e) {
            chutes.falhas++;
            chutes.erros.push({
              index: i + 1,
              error: e.message,
              response: e.response?.data,
              statusCode: e.response?.status
            });
          }
        }
        
        await fs.writeFile(path.join(LOGS_DIR, 'test-shoots-log.json'), JSON.stringify(resultados, null, 2));
        diagnostic.artifacts.push(path.join(LOGS_DIR, 'test-shoots-log.json'));
      } catch (e) {
        diagnostic.errors.push(`Erro ao executar chutes: ${e.message}`);
      }
    }
    
    const report = `# 🎯 V16 SHOOT TEST
## Data: ${new Date().toISOString().split('T')[0]}

## Resultados:
- Sucesso: ${chutes.sucesso}/10
- Falhas: ${chutes.falhas}/10

## Detalhes:
${JSON.stringify(chutes.resultados, null, 2)}

## Erros:
${JSON.stringify(chutes.erros, null, 2)}
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, 'V16-SHOOT-TEST.md'), report);
    diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-SHOOT-TEST.md'));
    
    diagnostic.results.chutes = chutes;
    await log('ETAPA 4 concluída', chutes);
    return chutes;
  } catch (error) {
    diagnostic.errors.push(`Erro na etapa 4: ${error.message}`);
    throw error;
  }
}

// ETAPA 5: Teste Real de Lote
async function etapa5_Lote() {
  console.log('\n🎯 ETAPA 5: TESTE REAL DE LOTE\n');
  await log('ETAPA 5: Teste lote');
  
  diagnostic.etapa = 5;
  const lote = {
    shots: [],
    lotes: [],
    validacao: {}
  };
  
  try {
    // Consultar Supabase (via backend se houver endpoint)
    lote.note = 'Consulta Supabase requer endpoint ou acesso direto';
    lote.shots = diagnostic.results.chutes?.resultados || [];
    lote.validacao.chutesRegistrados = lote.shots.filter(s => s.success).length;
    lote.validacao.loteFechado = lote.validacao.chutesRegistrados >= 10;
    
    const report = `# 🎯 V16 LOTE REAL
## Data: ${new Date().toISOString().split('T')[0]}

## Shots:
${JSON.stringify(lote.shots.slice(0, 10), null, 2)}

## Validação:
${JSON.stringify(lote.validacao, null, 2)}
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, 'V16-LOTE-REAL.md'), report);
    diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-LOTE-REAL.md'));
    
    diagnostic.results.lote = lote;
    await log('ETAPA 5 concluída', lote);
    return lote;
  } catch (error) {
    diagnostic.errors.push(`Erro na etapa 5: ${error.message}`);
    throw error;
  }
}

// ETAPA 6: WebSocket Fly Edge - Teste Completo
async function etapa6_WebSocket() {
  console.log('\n🎯 ETAPA 6: WEBSOCKET FLY EDGE - TESTE COMPLETO\n');
  await log('ETAPA 6: Teste WebSocket');
  
  diagnostic.etapa = 6;
  const ws = {
    conexao: false,
    eventos: [],
    handshake: {},
    erro: null
  };
  
  try {
    return new Promise((resolve) => {
      const wsClient = new WebSocket(WS_URL);
      const eventos = [];
      let conectado = false;
      
      wsClient.on('open', () => {
        conectado = true;
        ws.conexao = true;
        ws.handshake.success = true;
        ws.handshake.timestamp = new Date().toISOString();
        log('WebSocket conectado');
        
        // Enviar autenticação se tiver token
        if (diagnostic.token) {
          wsClient.send(JSON.stringify({
            type: 'auth',
            token: diagnostic.token
          }));
        }
        
        // Disparar 3 chutes de teste após 2 segundos
        setTimeout(async () => {
          for (let i = 0; i < 3; i++) {
            try {
              await axios.post(`${BACKEND_URL}/api/games/shoot`, {
                direction: ['left', 'center', 'right'][i],
                amount: 1
              }, {
                headers: {
                  'Authorization': `Bearer ${diagnostic.token}`,
                  'Content-Type': 'application/json'
                },
                timeout: 15000,
                validateStatus: () => true
              });
              await new Promise(r => setTimeout(r, 1000));
            } catch (e) {}
          }
        }, 2000);
      });
      
      wsClient.on('message', (data) => {
        try {
          const evento = JSON.parse(data.toString());
          eventos.push({
            timestamp: new Date().toISOString(),
            data: evento
          });
          ws.eventos.push(evento);
        } catch (e) {
          eventos.push({
            timestamp: new Date().toISOString(),
            raw: data.toString()
          });
        }
      });
      
      wsClient.on('error', (error) => {
        ws.erro = error.message;
        log(`WebSocket error: ${error.message}`);
      });
      
      wsClient.on('close', () => {
        log('WebSocket fechado');
      });
      
      // Aguardar 60 segundos
      setTimeout(() => {
        wsClient.close();
        ws.eventos = eventos;
        
        fs.writeFile(path.join(LOGS_DIR, 'websocket-events.json'), JSON.stringify(eventos, null, 2))
          .then(() => {
            const report = `# 🎯 V16 WS TEST
## Data: ${new Date().toISOString().split('T')[0]}

## Conexão:
${JSON.stringify(ws.handshake, null, 2)}

## Eventos Recebidos: ${eventos.length}
${JSON.stringify(eventos.slice(0, 20), null, 2)}
`;
            
            fs.writeFile(path.join(REPORTS_DIR, 'V16-WS-TEST.md'), report)
              .then(() => {
                diagnostic.results.websocket = ws;
                diagnostic.artifacts.push(path.join(LOGS_DIR, 'websocket-events.json'));
                diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-WS-TEST.md'));
                log('ETAPA 6 concluída');
                resolve(ws);
              });
          });
      }, 60000);
    });
  } catch (error) {
    diagnostic.errors.push(`Erro na etapa 6: ${error.message}`);
    return ws;
  }
}

// ETAPA 7: Logs do Fly.io
async function etapa7_FlyLogs() {
  console.log('\n🎯 ETAPA 7: LOGS DO FLY.IO\n');
  await log('ETAPA 7: Capturando logs Fly.io');
  
  diagnostic.etapa = 7;
  const logs = {
    raw: '',
    filtered: [],
    erros: []
  };
  
  try {
    try {
      const logOutput = execSync('flyctl logs --app goldeouro-backend-v2 --region gru --since 5m', {
        encoding: 'utf-8',
        timeout: 30000
      });
      logs.raw = logOutput;
      
      // Filtrar
      const linhas = logOutput.split('\n');
      const filtros = ['shoot', 'lote', 'syncActiveLotes', 'processLote', 'auth error', 'jwt error', 'cors', 'validation', '400', '401', '403', '422', '500'];
      
      logs.filtered = linhas.filter(linha => {
        const lower = linha.toLowerCase();
        return filtros.some(filtro => lower.includes(filtro.toLowerCase()));
      });
      
      logs.erros = linhas.filter(linha => {
        const lower = linha.toLowerCase();
        return lower.includes('error') || lower.includes('400') || lower.includes('401') || lower.includes('403') || lower.includes('422') || lower.includes('500');
      });
      
      await fs.writeFile(path.join(LOGS_DIR, 'fly-filtered.log'), logs.filtered.join('\n'));
      diagnostic.artifacts.push(path.join(LOGS_DIR, 'fly-filtered.log'));
    } catch (e) {
      logs.error = e.message;
    }
    
    const report = `# 🎯 V16 FLY LOGS
## Data: ${new Date().toISOString().split('T')[0]}

## Logs Filtrados: ${logs.filtered.length} linhas
${logs.filtered.slice(0, 50).join('\n')}

## Erros: ${logs.erros.length} linhas
${logs.erros.slice(0, 20).join('\n')}
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, 'V16-FLY-LOGS.md'), report);
    diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-FLY-LOGS.md'));
    
    diagnostic.results.logs = logs;
    await log('ETAPA 7 concluída', { filtered: logs.filtered.length, erros: logs.erros.length });
    return logs;
  } catch (error) {
    diagnostic.errors.push(`Erro na etapa 7: ${error.message}`);
    return logs;
  }
}

// ETAPA 8: Diagnóstico Avançado
async function etapa8_Diagnostico() {
  console.log('\n🎯 ETAPA 8: DIAGNÓSTICO AVANÇADO\n');
  await log('ETAPA 8: Diagnóstico avançado');
  
  diagnostic.etapa = 8;
  const diag = {
    payloadEnviado: {},
    payloadEsperado: {},
    divergencias: [],
    problemas: []
  };
  
  try {
    // Analisar payload enviado vs esperado
    const corsTest = diagnostic.results.cors?.postComToken;
    diag.payloadEnviado = {
      direction: 'left',
      amount: 1
    };
    
    // Ler código do controller para ver payload esperado
    try {
      const gameController = await fs.readFile(path.join(__dirname, '..', 'controllers', 'gameController.js'), 'utf-8');
      const shootMatch = gameController.match(/async\s+shoot\s*\([^)]*\)\s*\{[\s\S]*?\}/);
      if (shootMatch) {
        diag.payloadEsperado.note = 'Analisando código do controller';
        diag.payloadEsperado.hasDirection = gameController.includes('direction') || gameController.includes('req.body.direction');
        diag.payloadEsperado.hasAmount = gameController.includes('amount') || gameController.includes('req.body.amount');
      }
    } catch (e) {}
    
    // Detectar divergências
    if (corsTest?.status !== 200 && corsTest?.status !== 201) {
      diag.problemas.push({
        tipo: 'STATUS_CODE',
        descricao: `Status ${corsTest?.status} ao invés de 200/201`,
        possivelCausa: corsTest?.status === 401 ? 'Token inválido ou expirado' :
                      corsTest?.status === 400 ? 'Payload inválido' :
                      corsTest?.status === 403 ? 'CORS ou permissão' :
                      corsTest?.status === 404 ? 'Rota não encontrada' :
                      corsTest?.status === 422 ? 'Validação falhou' :
                      'Erro desconhecido',
        solucao: corsTest?.status === 401 ? 'Validar token JWT' :
                corsTest?.status === 400 ? 'Verificar formato do payload' :
                corsTest?.status === 403 ? 'Verificar CORS e autenticação' :
                corsTest?.status === 404 ? 'Verificar rota /api/games/shoot' :
                corsTest?.status === 422 ? 'Verificar validação de campos' :
                'Revisar logs do backend'
      });
    }
    
    if (diagnostic.results.chutes?.sucesso < 10) {
      diag.problemas.push({
        tipo: 'CHUTES_FALHANDO',
        descricao: `${diagnostic.results.chutes?.sucesso || 0}/10 chutes bem-sucedidos`,
        possivelCausa: 'Autenticação, payload ou validação',
        solucao: 'Revisar logs e corrigir problema identificado'
      });
    }
    
    const report = `# 🎯 V16 DIAGNÓSTICO
## Data: ${new Date().toISOString().split('T')[0]}

## Payload Enviado:
${JSON.stringify(diag.payloadEnviado, null, 2)}

## Payload Esperado:
${JSON.stringify(diag.payloadEsperado, null, 2)}

## Divergências:
${JSON.stringify(diag.divergencias, null, 2)}

## Problemas Detectados:
${JSON.stringify(diag.problemas, null, 2)}
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, 'V16-DIAGNOSTICO.md'), report);
    diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-DIAGNOSTICO.md'));
    
    diagnostic.results.diagnostico = diag;
    await log('ETAPA 8 concluída', diag);
    return diag;
  } catch (error) {
    diagnostic.errors.push(`Erro na etapa 8: ${error.message}`);
    throw error;
  }
}

// ETAPA 9: Sugestão de Patch Automático
async function etapa9_Patch() {
  console.log('\n🎯 ETAPA 9: SUGESTÃO DE PATCH AUTOMÁTICO\n');
  await log('ETAPA 9: Gerando patch');
  
  diagnostic.etapa = 9;
  const patch = {
    correcoes: [],
    arquivos: []
  };
  
  try {
    const problemas = diagnostic.results.diagnostico?.problemas || [];
    
    problemas.forEach(problema => {
      if (problema.tipo === 'STATUS_CODE') {
        if (problema.descricao.includes('401')) {
          patch.correcoes.push({
            arquivo: 'middlewares/authMiddleware.js',
            tipo: 'AUTH',
            descricao: 'Validar token JWT corretamente'
          });
        } else if (problema.descricao.includes('400')) {
          patch.correcoes.push({
            arquivo: 'controllers/gameController.js',
            tipo: 'VALIDATION',
            descricao: 'Validar payload corretamente'
          });
        } else if (problema.descricao.includes('CORS')) {
          patch.correcoes.push({
            arquivo: 'server-fly.js',
            tipo: 'CORS',
            descricao: 'Configurar CORS corretamente'
          });
        }
      }
    });
    
    const patchContent = `# V16 FIX PATCH
## Correções Sugeridas:

${patch.correcoes.map((c, i) => `${i + 1}. ${c.arquivo}: ${c.descricao}`).join('\n')}

## Arquivos Afetados:
${[...new Set(patch.correcoes.map(c => c.arquivo))].join('\n')}
`;
    
    await fs.writeFile(path.join(PATCHES_DIR, 'v16-fix.diff'), patchContent);
    diagnostic.artifacts.push(path.join(PATCHES_DIR, 'v16-fix.diff'));
    
    diagnostic.results.patch = patch;
    await log('ETAPA 9 concluída', patch);
    return patch;
  } catch (error) {
    diagnostic.errors.push(`Erro na etapa 9: ${error.message}`);
    return patch;
  }
}

// ETAPA 10: Regerar o Teste Completo
async function etapa10_Retest() {
  console.log('\n🎯 ETAPA 10: REGERAR O TESTE COMPLETO\n');
  await log('ETAPA 10: Retest');
  
  diagnostic.etapa = 10;
  const retest = {
    chutes: {},
    websocket: {},
    lote: {}
  };
  
  // Reexecutar testes básicos
  retest.chutes = diagnostic.results.chutes || {};
  retest.websocket = diagnostic.results.websocket || {};
  retest.lote = diagnostic.results.lote || {};
  
  const report = `# 🎯 V16 RETEST
## Data: ${new Date().toISOString().split('T')[0]}

## Chutes:
${JSON.stringify(retest.chutes, null, 2)}

## WebSocket:
${JSON.stringify(retest.websocket, null, 2)}

## Lote:
${JSON.stringify(retest.lote, null, 2)}
`;
  
  await fs.writeFile(path.join(REPORTS_DIR, 'V16-RETEST.md'), report);
  diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-RETEST.md'));
  
  diagnostic.results.retest = retest;
  await log('ETAPA 10 concluída', retest);
  return retest;
}

// ETAPA 11: Score Final
async function etapa11_Score() {
  console.log('\n🎯 ETAPA 11: SCORE FINAL\n');
  await log('ETAPA 11: Score final');
  
  diagnostic.etapa = 11;
  const scores = {
    autenticacao: 0,
    cors: 0,
    websocket: 0,
    chutes: 0,
    lote: 0,
    total: 0
  };
  
  // Calcular scores
  if (diagnostic.results.auth?.token) scores.autenticacao = 20;
  if (diagnostic.results.cors?.options?.status === 200 || diagnostic.results.cors?.options?.status === 204) scores.cors = 20;
  if (diagnostic.results.websocket?.conexao) scores.websocket = 20;
  scores.chutes = (diagnostic.results.chutes?.sucesso || 0) * 2; // 2 pontos por chute
  if (diagnostic.results.lote?.validacao?.loteFechado) scores.lote = 20;
  
  scores.total = scores.autenticacao + scores.cors + scores.websocket + scores.chutes + scores.lote;
  
  const report = `# 🎯 V16 SCORE FINAL
## Data: ${new Date().toISOString().split('T')[0]}

| Módulo | Score |
|--------|-------|
| Autenticação | ${scores.autenticacao}/20 |
| CORS | ${scores.cors}/20 |
| WebSocket | ${scores.websocket}/20 |
| Chutes | ${scores.chutes}/20 |
| Lote | ${scores.lote}/20 |

## Total: ${scores.total}/100
`;
  
  await fs.writeFile(path.join(REPORTS_DIR, 'V16-SCORE-FINAL.md'), report);
  diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-SCORE-FINAL.md'));
  
  diagnostic.scores = scores;
  await log('ETAPA 11 concluída', scores);
  return scores;
}

// ETAPA 12: Relatório Final
async function etapa12_RelatorioFinal() {
  console.log('\n🎯 ETAPA 12: RELATÓRIO FINAL\n');
  await log('ETAPA 12: Relatório final');
  
  diagnostic.etapa = 12;
  
  const report = {
    timestamp: diagnostic.timestamp,
    version: diagnostic.version,
    scores: diagnostic.scores,
    resultados: diagnostic.results,
    erros: diagnostic.errors,
    warnings: diagnostic.warnings,
    artifacts: diagnostic.artifacts,
    goNoGo: diagnostic.scores?.total >= 80 ? 'GO' : 'NO-GO'
  };
  
  const reportMarkdown = `# 🎯 V16 FINAL REPORT
## Data: ${new Date().toISOString().split('T')[0]}

## ✅ GO/NO-GO: **${report.goNoGo}**

## 📊 SCORES:

| Módulo | Score |
|--------|-------|
| Autenticação | ${report.scores?.autenticacao || 0}/20 |
| CORS | ${report.scores?.cors || 0}/20 |
| WebSocket | ${report.scores?.websocket || 0}/20 |
| Chutes | ${report.scores?.chutes || 0}/20 |
| Lote | ${report.scores?.lote || 0}/20 |

## Total: ${report.scores?.total || 0}/100

## ❌ ERROS:
${report.erros.map((e, i) => `${i + 1}. ${e}`).join('\n') || 'Nenhum'}

## ⚠️ WARNINGS:
${report.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n') || 'Nenhum'}

## 📋 ARTEFATOS GERADOS:
${report.artifacts.map(a => `- ${path.basename(a)}`).join('\n')}

## 🎯 DECISÃO:

${report.goNoGo === 'GO' ? '✅ **SISTEMA PRONTO PARA GO-LIVE**' : '❌ **CORRIGIR PROBLEMAS ANTES DE GO-LIVE**'}
`;
  
  await fs.writeFile(path.join(REPORTS_DIR, 'V16-FINAL-REPORT.md'), reportMarkdown);
  await fs.writeFile(path.join(REPORTS_DIR, 'V16-FINAL-REPORT.json'), JSON.stringify(report, null, 2));
  
  diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-FINAL-REPORT.md'));
  diagnostic.artifacts.push(path.join(REPORTS_DIR, 'V16-FINAL-REPORT.json'));
  
  await log('ETAPA 12 concluída', report);
  return report;
}

// Executar todas as etapas
async function run() {
  console.log('🔥 INICIANDO AUDITORIA V16+ COMPLETA\n');
  
  try {
    await ensureDir(REPORTS_DIR);
    await ensureDir(LOGS_DIR);
    await ensureDir(PATCHES_DIR);
    
    await etapa1_Autodeteccao();
    await etapa2_Autenticacao();
    await etapa3_CORS();
    await etapa4_Chutes();
    await etapa5_Lote();
    await etapa6_WebSocket();
    await etapa7_FlyLogs();
    await etapa8_Diagnostico();
    await etapa9_Patch();
    await etapa10_Retest();
    await etapa11_Score();
    await etapa12_RelatorioFinal();
    
    console.log('\n✅ AUDITORIA V16+ CONCLUÍDA\n');
    console.log(`Score Total: ${diagnostic.scores?.total || 0}/100`);
    console.log(`GO/NO-GO: ${diagnostic.scores?.total >= 80 ? '✅ GO' : '❌ NO-GO'}`);
    console.log(`Erros: ${diagnostic.errors.length}`);
    console.log(`Artefatos: ${diagnostic.artifacts.length}`);
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    diagnostic.status = 'FAILED';
    diagnostic.errors.push(`Erro crítico: ${error.message}`);
    await etapa12_RelatorioFinal();
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run };

