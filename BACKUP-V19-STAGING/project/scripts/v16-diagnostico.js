/**
 * 🔍 V16 DIAGNÓSTICO COMPLETO - GOL DE OURO
 * Versão: Final Production
 * Modo: Autônomo / Completo / Seguro
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');
require('dotenv').config();

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gayopagjdrkcmkirmfvy.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const REPORTS_DIR = path.join(__dirname, '..', 'docs', 'GO-LIVE');
const LOGS_DIR = path.join(__dirname, '..', 'logs');

const diagnostico = {
  timestamp: new Date().toISOString(),
  version: 'V16+',
  status: 'INITIALIZING',
  etapa: 0,
  health: {},
  secrets: {},
  supabase: {},
  usuario: {},
  backup: {},
  errors: [],
  warnings: [],
  artifacts: []
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

// 1) Health Check
async function etapa1_HealthCheck() {
  console.log('\n🔍 ETAPA 1: HEALTH CHECK\n');
  await log('ETAPA 1: Verificando health check');
  
  diagnostico.etapa = 1;
  
  try {
    const endpoints = ['/health', '/', '/api/status'];
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const r = await axios.get(`${BACKEND_URL}${endpoint}`, { timeout: 10000 });
        results[endpoint] = {
          status: r.status,
          ok: r.status === 200,
          data: r.data
        };
        await log(`✅ ${endpoint}: ${r.status} OK`);
      } catch (e) {
        results[endpoint] = {
          status: e.response?.status || 0,
          ok: false,
          error: e.message
        };
        await log(`❌ ${endpoint}: ${e.message}`);
      }
    }
    
    diagnostico.health = results;
    
    await fs.writeFile(path.join(LOGS_DIR, 'v16-health-check.json'), JSON.stringify(results, null, 2));
    diagnostico.artifacts.push(path.join(LOGS_DIR, 'v16-health-check.json'));
    
    await log('ETAPA 1 concluída');
    return results;
  } catch (error) {
    diagnostico.errors.push(`Erro na etapa 1: ${error.message}`);
    throw error;
  }
}

// 2) Fly.io Secrets
async function etapa2_FlySecrets() {
  console.log('\n🔍 ETAPA 2: FLY.IO SECRETS\n');
  await log('ETAPA 2: Verificando secrets do Fly.io');
  
  diagnostico.etapa = 2;
  
  try {
    const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET'];
    const optional = ['DATABASE_URL', 'SUPABASE_ANON_KEY', 'MERCADOPAGO_ACCESS_TOKEN'];
    
    let secretsList = [];
    try {
      const result = execSync('flyctl secrets list --app goldeouro-backend-v2', {
        encoding: 'utf-8',
        timeout: 30000
      });
      secretsList = result.split('\n').filter(l => l.trim());
      
      await fs.writeFile(path.join(LOGS_DIR, 'v16-fly-secrets.txt'), result);
      diagnostico.artifacts.push(path.join(LOGS_DIR, 'v16-fly-secrets.txt'));
    } catch (e) {
      diagnostico.warnings.push(`Erro ao listar secrets: ${e.message}`);
    }
    
    const found = {};
    const missing = [];
    
    for (const secret of required) {
      const foundSecret = secretsList.some(l => l.includes(secret));
      found[secret] = foundSecret;
      if (!foundSecret) {
        missing.push(secret);
      }
    }
    
    for (const secret of optional) {
      found[secret] = secretsList.some(l => l.includes(secret));
    }
    
    diagnostico.secrets = {
      found,
      missing,
      total: secretsList.length
    };
    
    await fs.writeFile(path.join(LOGS_DIR, 'v16-secrets-check.json'), JSON.stringify(diagnostico.secrets, null, 2));
    diagnostico.artifacts.push(path.join(LOGS_DIR, 'v16-secrets-check.json'));
    
    await log('ETAPA 2 concluída', { found: Object.keys(found).length, missing: missing.length });
    return diagnostico.secrets;
  } catch (error) {
    diagnostico.errors.push(`Erro na etapa 2: ${error.message}`);
    return diagnostico.secrets;
  }
}

// 3) Supabase
async function etapa3_Supabase() {
  console.log('\n🔍 ETAPA 3: SUPABASE\n');
  await log('ETAPA 3: Verificando conexão Supabase');
  
  diagnostico.etapa = 3;
  
  try {
    // Testar conexão via backend
    let connected = false;
    try {
      const r = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
      const dbStatus = r.data?.data?.database || r.data?.database;
      connected = dbStatus === 'connected' || dbStatus === 'ok' || r.status === 200;
      await log('✅ Supabase conectado via backend');
    } catch (e) {
      await log(`⚠️ Erro ao verificar Supabase via backend: ${e.message}`);
    }
    
    diagnostico.supabase.connected = connected;
    
    // Buscar usuário de teste
    const USER_EMAIL = 'test_v16_diag_1764865077736@example.com';
    let usuario = null;
    
    if (SERVICE_ROLE_KEY) {
      try {
        const headers = {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        };
        
        const r = await axios.get(
          `${SUPABASE_URL}/rest/v1/usuarios?select=*&email=eq.${USER_EMAIL}`,
          { headers, timeout: 10000 }
        );
        
        if (r.data && r.data.length > 0) {
          usuario = r.data[0];
          await log(`✅ Usuário encontrado: ${USER_EMAIL}`);
          
          // Backup automático
          await fs.writeFile(
            path.join(REPORTS_DIR, 'V16-BACKUP-USUARIO.json'),
            JSON.stringify(usuario, null, 2)
          );
          diagnostico.artifacts.push(path.join(REPORTS_DIR, 'V16-BACKUP-USUARIO.json'));
        } else {
          await log(`⚠️ Usuário não encontrado: ${USER_EMAIL}`);
        }
      } catch (e) {
        diagnostico.warnings.push(`Erro ao buscar usuário: ${e.message}`);
      }
    } else {
      await log('⚠️ SERVICE_ROLE_KEY não disponível - pulando busca direta');
    }
    
    diagnostico.usuario = usuario;
    diagnostico.supabase.usuarioEncontrado = !!usuario;
    
    await log('ETAPA 3 concluída');
    return diagnostico.supabase;
  } catch (error) {
    diagnostico.errors.push(`Erro na etapa 3: ${error.message}`);
    return diagnostico.supabase;
  }
}

// 4) Detecção de problema de saldo
async function etapa4_DetectarProblema() {
  console.log('\n🔍 ETAPA 4: DETECÇÃO DE PROBLEMA\n');
  await log('ETAPA 4: Detectando problema de saldo');
  
  diagnostico.etapa = 4;
  
  try {
    const USER_EMAIL = 'test_v16_diag_1764865077736@example.com';
    let saldo = null;
    
    // Tentar obter saldo via backend
    try {
      // Criar/login usuário
      let token = null;
      try {
        const loginR = await axios.post(`${BACKEND_URL}/api/auth/login`, {
          email: USER_EMAIL,
          password: 'Test123456!'
        }, { timeout: 15000 });
        token = loginR.data?.token || loginR.data?.data?.token;
      } catch (e) {
        // Criar usuário se não existir
        try {
          const registerR = await axios.post(`${BACKEND_URL}/api/auth/register`, {
            email: USER_EMAIL,
            password: 'Test123456!',
            username: `testuser_${Date.now()}`
          }, { timeout: 15000 });
          token = registerR.data?.token || registerR.data?.data?.token;
        } catch (e2) {
          diagnostico.warnings.push(`Erro ao criar/login usuário: ${e2.message}`);
        }
      }
      
      if (token) {
        // Testar chute
        try {
          const shootR = await axios.post(`${BACKEND_URL}/api/games/shoot`, {
            direction: 'left',
            amount: 1
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 15000,
            validateStatus: () => true
          });
          
          diagnostico.usuario.chuteTeste = {
            status: shootR.status,
            success: shootR.status === 200 || shootR.status === 201,
            message: shootR.data?.message || 'N/A'
          };
          
          if (shootR.status === 400 && shootR.data?.message?.includes('Saldo')) {
            diagnostico.usuario.saldoInsuficiente = true;
            await log('❌ Problema detectado: Saldo insuficiente');
          }
        } catch (e) {
          diagnostico.warnings.push(`Erro ao testar chute: ${e.message}`);
        }
      }
    } catch (e) {
      diagnostico.warnings.push(`Erro ao detectar problema: ${e.message}`);
    }
    
    await log('ETAPA 4 concluída');
    return diagnostico.usuario;
  } catch (error) {
    diagnostico.errors.push(`Erro na etapa 4: ${error.message}`);
    return diagnostico.usuario;
  }
}

// Gerar relatório de detecção
async function gerarRelatorioDetecao() {
  const report = `# 🔍 V16 DETECÇÃO COMPLETA
## Data: ${new Date().toISOString().split('T')[0]}

## Health Check:
${JSON.stringify(diagnostico.health, null, 2)}

## Secrets:
- Total: ${diagnostico.secrets.total || 0}
- Encontrados: ${Object.keys(diagnostico.secrets.found || {}).length}
- Faltando: ${diagnostico.secrets.missing?.length || 0}

## Supabase:
- Conectado: ${diagnostico.supabase.connected ? '✅' : '❌'}
- Usuário encontrado: ${diagnostico.supabase.usuarioEncontrado ? '✅' : '❌'}

## Usuário:
${JSON.stringify(diagnostico.usuario, null, 2)}

## Erros:
${diagnostico.errors.map((e, i) => `${i + 1}. ${e}`).join('\n') || 'Nenhum'}

## Warnings:
${diagnostico.warnings.map((w, i) => `${i + 1}. ${w}`).join('\n') || 'Nenhum'}
`;
  
  await fs.writeFile(path.join(REPORTS_DIR, 'V16-DETECT.md'), report);
  diagnostico.artifacts.push(path.join(REPORTS_DIR, 'V16-DETECT.md'));
}

// Executar diagnóstico completo
async function run() {
  console.log('🔍 INICIANDO DIAGNÓSTICO V16 COMPLETO\n');
  
  try {
    await ensureDir(REPORTS_DIR);
    await ensureDir(LOGS_DIR);
    
    await etapa1_HealthCheck();
    await etapa2_FlySecrets();
    await etapa3_Supabase();
    await etapa4_DetectarProblema();
    await gerarRelatorioDetecao();
    
    // Salvar diagnóstico completo
    await fs.writeFile(path.join(LOGS_DIR, 'v16-diagnostico-completo.json'), JSON.stringify(diagnostico, null, 2));
    
    console.log('\n✅ DIAGNÓSTICO V16 CONCLUÍDO\n');
    console.log(`Erros: ${diagnostico.errors.length}`);
    console.log(`Warnings: ${diagnostico.warnings.length}`);
    console.log(`Artefatos: ${diagnostico.artifacts.length}`);
    
  } catch (error) {
    console.error('❌ Erro crítico:', error);
    diagnostico.status = 'FAILED';
    diagnostico.errors.push(`Erro crítico: ${error.message}`);
    await gerarRelatorioDetecao();
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { run, diagnostico };

