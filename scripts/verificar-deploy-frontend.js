#!/usr/bin/env node
/**
 * 🔍 VERIFICAÇÃO DO DEPLOY DO FRONTEND
 * 
 * Este script verifica o status do deploy do frontend no Vercel
 */

const https = require('https');
const http = require('http');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://goldeouro.lol';
const BACKEND_URL = process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';

const results = {
  timestamp: new Date().toISOString(),
  frontend: {},
  backend: {},
  issues: []
};

/**
 * Verificar URL
 */
function checkURL(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Deploy-Verification-Bot/1.0'
      }
    };
    
    const startTime = Date.now();
    const req = client.request(urlObj, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          working: res.statusCode === 200,
          responseTime: Date.now() - startTime,
          headers: res.headers,
          contentLength: data.length,
          hasContent: data.length > 0
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        status: 0,
        working: false,
        error: error.message,
        responseTime: Date.now() - startTime
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        status: 0,
        working: false,
        timeout: true,
        responseTime: Date.now() - startTime
      });
    });
    
    req.end();
  });
}

/**
 * Verificar arquivos estáticos
 */
async function checkStaticFiles() {
  const files = [
    '/favicon.png',
    '/favicon.ico',
    '/robots.txt',
    '/index.html'
  ];
  
  const results = {};
  
  for (const file of files) {
    const result = await checkURL(`${FRONTEND_URL}${file}`);
    results[file] = result;
    
    if (!result.working) {
      console.log(`❌ ${file}: ${result.status || 'ERRO'}`);
    } else {
      console.log(`✅ ${file}: ${result.status} OK`);
    }
  }
  
  return results;
}

/**
 * Verificar rotas principais
 */
async function checkRoutes() {
  const routes = [
    '/',
    '/register',
    '/terms',
    '/privacy',
    '/download'
  ];
  
  const results = {};
  
  for (const route of routes) {
    const result = await checkURL(`${FRONTEND_URL}${route}`);
    results[route] = result;
    
    if (!result.working) {
      console.log(`❌ ${route}: ${result.status || 'ERRO'}`);
    } else {
      console.log(`✅ ${route}: ${result.status} OK`);
    }
  }
  
  return results;
}

/**
 * Função principal
 */
async function main() {
  console.log('🔍 Verificando deploy do frontend...\n');
  
  // Verificar frontend principal
  console.log('📡 Verificando frontend principal...');
  const frontendResult = await checkURL(FRONTEND_URL);
  results.frontend = {
    url: FRONTEND_URL,
    ...frontendResult
  };
  
  if (frontendResult.working) {
    console.log(`✅ Frontend: ${frontendResult.status} OK (${frontendResult.responseTime}ms)`);
  } else {
    console.log(`❌ Frontend: ${frontendResult.status || 'ERRO'} - ${frontendResult.error || 'Timeout'}`);
    results.issues.push({
      type: 'frontend',
      severity: 'critical',
      message: `Frontend retornando ${frontendResult.status || 'ERRO'}`,
      url: FRONTEND_URL
    });
  }
  
  // Verificar backend
  console.log('\n📡 Verificando backend...');
  const backendResult = await checkURL(`${BACKEND_URL}/health`);
  results.backend = {
    url: BACKEND_URL,
    ...backendResult
  };
  
  if (backendResult.working) {
    console.log(`✅ Backend: ${backendResult.status} OK (${backendResult.responseTime}ms)`);
  } else {
    console.log(`❌ Backend: ${backendResult.status || 'ERRO'}`);
    results.issues.push({
      type: 'backend',
      severity: 'high',
      message: `Backend retornando ${backendResult.status || 'ERRO'}`,
      url: BACKEND_URL
    });
  }
  
  // Verificar arquivos estáticos
  if (frontendResult.working) {
    console.log('\n📁 Verificando arquivos estáticos...');
    const staticFiles = await checkStaticFiles();
    results.staticFiles = staticFiles;
    
    // Verificar rotas
    console.log('\n🛣️ Verificando rotas principais...');
    const routes = await checkRoutes();
    results.routes = routes;
  }
  
  // Resumo
  console.log('\n📊 RESUMO:');
  console.log(`Frontend: ${results.frontend.working ? '✅ OK' : '❌ ERRO'}`);
  console.log(`Backend: ${results.backend.working ? '✅ OK' : '❌ ERRO'}`);
  console.log(`Problemas: ${results.issues.length}`);
  
  if (results.issues.length > 0) {
    console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:');
    results.issues.forEach((issue, i) => {
      console.log(`${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
    });
  }
  
  return results;
}

// Executar se chamado diretamente
if (require.main === module) {
  main().then(() => {
    process.exit(results.issues.length > 0 ? 1 : 0);
  }).catch(error => {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  });
}

module.exports = { main, checkURL, checkStaticFiles, checkRoutes };

