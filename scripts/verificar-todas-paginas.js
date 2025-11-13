#!/usr/bin/env node

/**
 * 🔍 SCRIPT DE VERIFICAÇÃO AUTOMÁTICA - TODAS AS PÁGINAS E FUNCIONALIDADES
 * 
 * Este script verifica se todas as páginas e funcionalidades estão funcionando corretamente
 * através de testes de endpoints e validações de código.
 */

const https = require('https');
const http = require('http');

// Configurações
const BACKEND_URL = process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://goldeouro.lol';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Estatísticas
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
};

// Função para fazer requisição HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 10000,
    };

    const req = protocol.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Função para testar endpoint
async function testEndpoint(name, url, expectedStatus = 200, options = {}) {
  stats.total++;
  try {
    console.log(`\n${colors.cyan}🔍 Testando: ${name}${colors.reset}`);
    console.log(`   URL: ${url}`);
    
    const response = await makeRequest(url, options);
    
    if (response.statusCode === expectedStatus) {
      console.log(`${colors.green}✅ PASSOU${colors.reset} - Status: ${response.statusCode}`);
      stats.passed++;
      return { success: true, response };
    } else {
      console.log(`${colors.red}❌ FALHOU${colors.reset} - Esperado: ${expectedStatus}, Recebido: ${response.statusCode}`);
      stats.failed++;
      return { success: false, response };
    }
  } catch (error) {
    console.log(`${colors.red}❌ ERRO${colors.reset} - ${error.message}`);
    stats.failed++;
    return { success: false, error: error.message };
  }
}

// Função para testar página HTML
async function testPage(name, path) {
  return testEndpoint(name, `${FRONTEND_URL}${path}`, 200);
}

// Função para testar endpoint da API
async function testAPI(name, path, expectedStatus = 200, options = {}) {
  return testEndpoint(name, `${BACKEND_URL}${path}`, expectedStatus, options);
}

// Função principal
async function main() {
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}🔍 VERIFICAÇÃO COMPLETA - TODAS AS PÁGINAS E FUNCIONALIDADES${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`\nBackend: ${BACKEND_URL}`);
  console.log(`Frontend: ${FRONTEND_URL}\n`);

  // =====================================================
  // TESTES DO BACKEND
  // =====================================================
  console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}📡 TESTES DO BACKEND${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  // Health check
  await testAPI('Health Check', '/health', 200);

  // Métricas
  await testAPI('Métricas do Sistema', '/api/metrics', 200);

  // Endpoints públicos (sem autenticação)
  await testAPI('Registro (POST)', '/api/auth/register', 400, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  await testAPI('Login (POST)', '/api/auth/login', 400, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

  // Endpoints protegidos (devem retornar 401 sem token)
  await testAPI('Perfil (sem token)', '/api/auth/profile', 401);
  await testAPI('Criar PIX (sem token)', '/api/payments/pix/criar', 401);
  await testAPI('Chute (sem token)', '/api/games/shoot', 401);

  // =====================================================
  // TESTES DO FRONTEND
  // =====================================================
  console.log(`\n${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
  console.log(`${colors.yellow}🌐 TESTES DO FRONTEND${colors.reset}`);
  console.log(`${colors.yellow}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);

  // Páginas públicas
  await testPage('Login', '/');
  await testPage('Registro', '/register');
  await testPage('Esqueci Senha', '/forgot-password');
  await testPage('Termos', '/terms');
  await testPage('Privacidade', '/privacy');
  await testPage('Download', '/download');

  // Páginas protegidas (devem redirecionar ou retornar HTML)
  const protectedPages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Jogo', path: '/game' },
    { name: 'Perfil', path: '/profile' },
    { name: 'Pagamentos', path: '/pagamentos' },
    { name: 'Saques', path: '/withdraw' },
  ];

  for (const page of protectedPages) {
    const result = await testPage(page.name, page.path);
    if (result.success) {
      // Verificar se é HTML (página) ou redirecionamento
      const contentType = result.response?.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        console.log(`${colors.green}   ✓ Página HTML carregada${colors.reset}`);
      } else {
        console.log(`${colors.yellow}   ⚠ Resposta não é HTML (pode ser redirecionamento)${colors.reset}`);
        stats.warnings++;
      }
    }
  }

  // =====================================================
  // RESUMO
  // =====================================================
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}📊 RESUMO DA VERIFICAÇÃO${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`\nTotal de testes: ${stats.total}`);
  console.log(`${colors.green}✅ Passou: ${stats.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Falhou: ${stats.failed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Avisos: ${stats.warnings}${colors.reset}`);
  
  const successRate = ((stats.passed / stats.total) * 100).toFixed(2);
  console.log(`\nTaxa de sucesso: ${successRate}%`);

  if (stats.failed === 0) {
    console.log(`\n${colors.green}🎉 Todos os testes passaram!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}⚠️  Alguns testes falharam. Verifique os logs acima.${colors.reset}`);
    process.exit(1);
  }
}

// Executar
main().catch((error) => {
  console.error(`${colors.red}❌ Erro fatal:${colors.reset}`, error);
  process.exit(1);
});

