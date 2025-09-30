#!/usr/bin/env node

// Script de Validação Final de Produção - Gol de Ouro
// Valida Player, Admin, Backend e funcionalidades críticas

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const crypto = require('node:crypto');
const https = require('node:https');
const http = require('node:http');

// ============================================================================
// CONFIGURAÇÃO EDITÁVEL
// ============================================================================
const CONFIG = {
  BASE: "https://www.goldeouro.lol",            // domínio do player
  ADMIN: "https://admin.goldeouro.lol",          // domínio do admin
  BACKEND: "https://goldeouro-backend-v2.fly.dev",// backend direto (para fallback)
  TEST_USER: "free10signer@gmail.com",           // credencial de teste
  TEST_PASS: "123456",
  PIX_TEST_VALUE: 1.00,                          // valor pequeno em reais
  TIMEOUT_MS: 12000
};

// ============================================================================
// HELPERS
// ============================================================================

// Cookie jar simples por domínio
const cookieJar = new Map();

// Função para fazer requisições HTTP
async function httpRequest(method, url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    // Adicionar cookies do domínio
    const domain = urlObj.hostname;
    const cookies = cookieJar.get(domain) || [];
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'GolDeOuro-Validator/1.0',
        'Accept': 'application/json, text/html, */*',
        'Content-Type': 'application/json',
        ...(cookieHeader && { 'Cookie': cookieHeader }),
        ...options.headers
      },
      timeout: CONFIG.TIMEOUT_MS
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      // Capturar cookies da resposta
      const setCookieHeaders = res.headers['set-cookie'];
      if (setCookieHeaders) {
        const domainCookies = cookieJar.get(domain) || [];
        setCookieHeaders.forEach(cookieStr => {
          const [nameValue] = cookieStr.split(';');
          const [name, value] = nameValue.split('=');
          if (name && value) {
            domainCookies.push({ name: name.trim(), value: value.trim() });
          }
        });
        cookieJar.set(domain, domainCookies);
      }
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          // Não é JSON, usar text
        }
        
        resolve({
          status: res.statusCode,
          headers: res.headers,
          text: data,
          json: json,
          url: url
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout após ${CONFIG.TIMEOUT_MS}ms`));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

// Wrapper para métodos HTTP
async function httpCall(method, url, options = {}) {
  try {
    return await httpRequest(method, url, options);
  } catch (error) {
    return {
      status: 0,
      headers: {},
      text: error.message,
      json: null,
      error: true,
      url: url
    };
  }
}

// Função de log
function logStep(label, ok, extra = '') {
  const status = ok ? '✅' : '❌';
  const extraStr = extra ? ` (${extra})` : '';
  console.log(`${status} ${label}${extraStr}`);
  return ok;
}

// ============================================================================
// VALIDAÇÕES
// ============================================================================

const results = {
  pass: false,
  checks: {},
  notes: []
};

let authToken = null;

async function runValidations() {
  console.log('🚀 Iniciando validação final de produção...\n');

  // A. HEADERS/CSP do PLAYER
  console.log('📋 A. Validando Headers/CSP do Player...');
  try {
    const response = await httpCall('GET', CONFIG.BASE);
    const cspHeader = response.headers['content-security-policy'] || '';
    const hasBackend = cspHeader.includes('goldeouro-backend-v2.fly.dev');
    results.checks.csp = logStep('CSP Header', response.status === 200 && hasBackend, 
      hasBackend ? 'Backend liberado' : 'Backend não encontrado no CSP');
  } catch (error) {
    results.checks.csp = logStep('CSP Header', false, error.message);
  }

  // B. PWA
  console.log('\n📱 B. Validando PWA...');
  
  // Manifest
  try {
    const manifestResponse = await httpCall('GET', `${CONFIG.BASE}/manifest.webmanifest`);
    const contentType = manifestResponse.headers['content-type'] || '';
    const isManifestJson = contentType.includes('application/manifest+json');
    results.checks.pwa_manifest = logStep('PWA Manifest', 
      manifestResponse.status === 200 && isManifestJson,
      `Status: ${manifestResponse.status}, Content-Type: ${contentType}`);
  } catch (error) {
    results.checks.pwa_manifest = logStep('PWA Manifest', false, error.message);
  }

  // Service Worker
  try {
    const swResponse = await httpCall('GET', `${CONFIG.BASE}/sw.js`);
    const cacheControl = swResponse.headers['cache-control'] || '';
    const hasNoCache = cacheControl.includes('no-cache') || 
                      cacheControl.includes('no-store') || 
                      cacheControl.includes('must-revalidate');
    results.checks.pwa_sw = logStep('Service Worker', 
      swResponse.status === 200 && hasNoCache,
      `Status: ${swResponse.status}, Cache-Control: ${cacheControl}`);
  } catch (error) {
    results.checks.pwa_sw = logStep('Service Worker', false, error.message);
  }

  // C. Proxy /api
  console.log('\n🔗 C. Validando Proxy /api...');
  
  // Health Check
  try {
    const healthResponse = await httpCall('GET', `${CONFIG.BASE}/api/health`);
    const isHealthy = healthResponse.json?.ok === true || 
                     healthResponse.json?.status === 'healthy';
    results.checks.api_health = logStep('API Health', 
      healthResponse.status === 200 && isHealthy,
      `Status: ${healthResponse.status}, Body: ${JSON.stringify(healthResponse.json).substring(0, 100)}...`);
  } catch (error) {
    results.checks.api_health = logStep('API Health', false, error.message);
  }

  // Echo (opcional)
  try {
    const echoResponse = await httpCall('POST', `${CONFIG.BASE}/api/echo`, {
      body: { test: 'echo' }
    });
    if (echoResponse.status === 404) {
      console.log('ℹ️  API Echo: SKIP (endpoint não existe)');
    } else {
      console.log(`ℹ️  API Echo: Status ${echoResponse.status}`);
    }
  } catch (error) {
    console.log('ℹ️  API Echo: SKIP (erro)');
  }

  // D. Login e sessão
  console.log('\n🔐 D. Validando Login e Sessão...');
  
  // Login
  try {
    const loginResponse = await httpCall('POST', `${CONFIG.BASE}/api/auth/login`, {
      body: {
        email: CONFIG.TEST_USER,
        password: CONFIG.TEST_PASS
      }
    });
    
    if (loginResponse.json?.token) {
      authToken = loginResponse.json.token;
      results.checks.login = logStep('Login', loginResponse.status === 200, 
        `Token obtido: ${authToken.substring(0, 20)}...`);
    } else {
      results.checks.login = logStep('Login', false, 
        `Status: ${loginResponse.status}, Body: ${loginResponse.text.substring(0, 100)}...`);
    }
  } catch (error) {
    results.checks.login = logStep('Login', false, error.message);
  }

  // User Me - tentar múltiplas rotas
  if (authToken) {
    const meRoutes = ['/api/user/me', '/auth/me', '/users/me', '/api/public/dashboard'];
    let meOk = false;
    let meStatus = 'FAIL';
    
    for (const route of meRoutes) {
      try {
        const meResponse = await httpCall('GET', `${CONFIG.BASE}${route}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (meResponse.status === 200) {
          const hasUserData = meResponse.json?.id || meResponse.json?.email || 
                             (meResponse.json?.user && (meResponse.json.user.id || meResponse.json.user.email));
          if (hasUserData) {
            meOk = true;
            meStatus = 'PASS';
            break;
          }
        }
      } catch (error) {
        // Continuar tentando outras rotas
      }
    }
    
    results.checks.me = logStep('User Me', meOk, 
      meOk ? 'Dados do usuário obtidos' : 'Nenhuma rota de usuário funcionou');
  } else {
    results.checks.me = logStep('User Me', false, 'Sem token de autenticação');
  }

  // E. Depósito PIX
  console.log('\n💰 E. Validando Depósito PIX...');
  if (authToken) {
    try {
      const pixResponse = await httpCall('POST', `${CONFIG.BASE}/api/payments/pix/criar`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: {
          amount: CONFIG.PIX_TEST_VALUE
        }
      });
      
      const hasPixData = pixResponse.json?.qr_code || 
                        pixResponse.json?.copy_paste_key || 
                        pixResponse.json?.id ||
                        pixResponse.json?.payment_id ||
                        pixResponse.json?.checkout_url ||
                        (pixResponse.json?.status === 'pending');
      results.checks.pix_create = logStep('PIX Create', 
        pixResponse.status === 200 && hasPixData,
        `Status: ${pixResponse.status}, PIX Data: ${hasPixData ? 'OK' : 'N/A'}`);
    } catch (error) {
      results.checks.pix_create = logStep('PIX Create', false, error.message);
    }
  } else {
    results.checks.pix_create = logStep('PIX Create', false, 'Sem token de autenticação');
  }

  // F. Jogo (ação protegida)
  console.log('\n🎮 F. Validando Jogo...');
  if (authToken) {
    try {
      const shootResponse = await httpCall('POST', `${CONFIG.BASE}/api/games/shoot`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        body: {
          amount: 10,
          direction: 'center'
        }
      });
      
      const isShootOk = shootResponse.status === 200 || 
                       (shootResponse.status === 401 && shootResponse.json?.error?.includes('saldo'));
      results.checks.game_shoot = logStep('Game Shoot', isShootOk, 
        `Status: ${shootResponse.status}, ${shootResponse.json?.message || shootResponse.json?.error || 'OK'}`);
    } catch (error) {
      results.checks.game_shoot = logStep('Game Shoot', false, error.message);
    }
  } else {
    results.checks.game_shoot = logStep('Game Shoot', false, 'Sem token de autenticação');
  }

  // G. Saque
  console.log('\n💸 G. Validando Saque...');
  if (authToken) {
    try {
      // Tentar diferentes endpoints de saque
      const withdrawEndpoints = [
        '/api/withdraw/estimate',
        '/api/withdraw/request',
        '/api/withdraw/check'
      ];
      
      let withdrawOk = false;
      let withdrawStatus = 'SKIP';
      
      for (const endpoint of withdrawEndpoints) {
        try {
          const withdrawResponse = await httpCall('POST', `${CONFIG.BASE}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            },
            body: { amount: 10 }
          });
          
          if (withdrawResponse.status === 200 || withdrawResponse.status === 400) {
            withdrawOk = true;
            withdrawStatus = 'PASS';
            break;
          }
        } catch (e) {
          // Continuar tentando outros endpoints
        }
      }
      
      if (withdrawOk) {
        results.checks.withdraw = logStep('Withdraw', true, 'Endpoint encontrado');
      } else {
        results.checks.withdraw = logStep('Withdraw', false, 'SKIP - Nenhum endpoint de saque encontrado');
        results.notes.push('Sugestão: Implementar endpoints de saque (/api/withdraw/estimate e /api/withdraw/request)');
      }
    } catch (error) {
      results.checks.withdraw = logStep('Withdraw', false, error.message);
    }
  } else {
    results.checks.withdraw = logStep('Withdraw', false, 'Sem token de autenticação');
  }

  // H. Webhook Mercado Pago
  console.log('\n🔗 H. Validando Webhook Mercado Pago...');
  try {
    const webhookResponse = await httpCall('GET', `${CONFIG.BASE}/api/payments/pix/webhook`);
    
    if (webhookResponse.status === 200) {
      results.checks.webhook = logStep('Webhook', true, 'Endpoint responde 200');
    } else if (webhookResponse.status === 405) {
      results.checks.webhook = logStep('Webhook', true, 'WARN - Endpoint existe mas exige POST');
      results.notes.push('Webhook exige método POST (405) - normal para webhooks');
    } else if (webhookResponse.status === 404) {
      results.checks.webhook = logStep('Webhook', false, 'FAIL - Endpoint não encontrado');
      results.notes.push('Sugestão: Implementar webhook PIX (/api/payments/pix/webhook)');
    } else {
      results.checks.webhook = logStep('Webhook', false, `Status inesperado: ${webhookResponse.status}`);
    }
  } catch (error) {
    results.checks.webhook = logStep('Webhook', false, error.message);
  }

  // Calcular resultado final
  const requiredChecks = ['csp', 'pwa_manifest', 'pwa_sw', 'api_health', 'login', 'me', 'pix_create'];
  const passedRequired = requiredChecks.every(check => results.checks[check] === 'PASS');
  results.pass = passedRequired;

  // Adicionar notas baseadas nos resultados
  if (!results.checks.login) {
    results.notes.push('Login falhou - verificar credenciais de teste');
  }
  if (!results.checks.pix_create) {
    results.notes.push('PIX falhou - verificar integração com Mercado Pago');
  }
  if (results.checks.game_shoot === 'FAIL') {
    results.notes.push('Jogo falhou - verificar lógica de saldo ou autenticação');
  }

  return results;
}

// ============================================================================
// EXECUÇÃO PRINCIPAL
// ============================================================================

async function main() {
  try {
    const results = await runValidations();
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log('==================');
    console.log(JSON.stringify(results, null, 2));
    
    console.log('\n🎯 GO/NO-GO:');
    if (results.pass) {
      console.log('✅ GO - Sistema 100% funcional!');
    } else {
      const failedChecks = Object.entries(results.checks)
        .filter(([_, status]) => status === 'FAIL')
        .map(([check, _]) => check);
      console.log(`❌ NO-GO - Falhas: ${failedChecks.join(', ')}`);
    }
    
    if (results.notes.length > 0) {
      console.log('\n📝 NOTAS:');
      results.notes.forEach(note => console.log(`- ${note}`));
    }
    
  } catch (error) {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
main();
