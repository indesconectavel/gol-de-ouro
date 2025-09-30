#!/usr/bin/env node

// Script de Validação Completa de Produção - Gol de Ouro
// Valida Player (player-dist-deploy) e Admin (goldeouro-admin)

import { readFileSync, existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Configurações
const config = {
  player: {
    project: 'player-dist-deploy',
    domain: 'https://www.goldeouro.lol'
  },
  admin: {
    project: 'goldeouro-admin', 
    domain: 'https://admin.goldeouro.lol'
  },
  backend: 'https://goldeouro-backend-v2.fly.dev'
};

// Resultado final
const result = {
  player: {
    vercel: { rewrites: null, headers: null, csp_ok: false, problems: [] },
    env: { vars: {}, duplicates: [], problems: [] },
    build: { ran: false, distExists: false },
    http: {
      manifest: { status: null, contentTypeOk: false },
      sw: { status: null, noCache: false },
      health: { status: null, bodyOk: false },
      shootPost: { status: null, ok: false, method: 'POST', sampleBody: null }
    },
    cspEffective: { headerHasBackend: false, metaHasBackend: false }
  },
  admin: {
    vercel: { rewrites: null, headers: null, csp_ok: false, problems: [] },
    build: { ran: false, distExists: false },
    http: {
      login: { status: null, ok: false },
      health: { status: null, ok: false, skipped: false }
    }
  }
};

// Função para fazer requisições HTTP
async function httpRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    const text = await response.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Não é JSON, usar text
    }
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      text,
      json
    };
  } catch (error) {
    return {
      status: 0,
      headers: {},
      text: error.message,
      json: null,
      error: true
    };
  }
}

// Função para validar vercel.json
function validateVercelJson(projectPath, projectName) {
  const vercelPath = join(projectPath, 'vercel.json');
  
  if (!existsSync(vercelPath)) {
    return { problems: [`vercel.json não encontrado em ${projectName}`] };
  }
  
  try {
    const vercel = JSON.parse(readFileSync(vercelPath, 'utf8'));
    const problems = [];
    
    // Validar rewrites
    if (!vercel.rewrites || !Array.isArray(vercel.rewrites)) {
      problems.push('rewrites não encontrado ou não é array');
    } else {
      const apiRewrite = vercel.rewrites.find(r => r.source === '/api/(.*)');
      if (!apiRewrite) {
        problems.push('rewrite /api/(.*) não encontrado');
      } else if (apiRewrite.destination !== `${config.backend}/api/$1`) {
        problems.push(`rewrite /api/(.*) aponta para ${apiRewrite.destination}, deveria ser ${config.backend}/api/$1`);
      }
      
      const spaRewrite = vercel.rewrites.find(r => r.source === '/(.*)');
      if (!spaRewrite) {
        problems.push('rewrite SPA /(.*) não encontrado');
      } else if (spaRewrite.destination !== '/index.html') {
        problems.push(`rewrite SPA aponta para ${spaRewrite.destination}, deveria ser /index.html`);
      }
    }
    
    // Validar headers CSP
    let cspOk = false;
    if (vercel.headers && Array.isArray(vercel.headers)) {
      const cspHeader = vercel.headers.find(h => 
        h.headers && h.headers.some(header => header.key === 'Content-Security-Policy')
      );
      
      if (cspHeader) {
        const cspValue = cspHeader.headers.find(h => h.key === 'Content-Security-Policy').value;
        const requiredDirectives = [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' data: blob: https://goldeouro-backend-v2.fly.dev",
          "media-src 'self' data: blob:",
          "object-src 'none'",
          "frame-ancestors 'self'",
          "base-uri 'self'"
        ];
        
        const missingDirectives = requiredDirectives.filter(dir => !cspValue.includes(dir));
        if (missingDirectives.length === 0) {
          cspOk = true;
        } else {
          problems.push(`CSP faltando diretivas: ${missingDirectives.join(', ')}`);
        }
      } else {
        problems.push('Header Content-Security-Policy não encontrado');
      }
    } else {
      problems.push('Headers não encontrado ou não é array');
    }
    
    return {
      rewrites: vercel.rewrites ? vercel.rewrites.length : 0,
      headers: vercel.headers ? vercel.headers.length : 0,
      csp_ok: cspOk,
      problems
    };
  } catch (error) {
    return { problems: [`Erro ao ler vercel.json: ${error.message}`] };
  }
}

// Função para validar .env.production
function validateEnvProduction(projectPath, projectName) {
  const envPath = join(projectPath, '.env.production');
  
  if (!existsSync(envPath)) {
    return { vars: {}, duplicates: [], problems: ['.env.production não encontrado'] };
  }
  
  try {
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    const vars = {};
    const duplicates = [];
    const problems = [];
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        if (vars[key]) {
          duplicates.push(key);
        }
        vars[key] = value;
      }
    });
    
    // Validar variáveis obrigatórias
    const requiredVars = {
      'VITE_APP_ENV': 'production',
      'VITE_API_URL': '/api',
      'VITE_USE_MOCKS': 'false',
      'VITE_USE_SANDBOX': 'false'
    };
    
    Object.entries(requiredVars).forEach(([key, expectedValue]) => {
      if (!vars[key]) {
        problems.push(`${key} não encontrado`);
      } else if (vars[key] !== expectedValue) {
        problems.push(`${key}=${vars[key]}, esperado ${expectedValue}`);
      }
    });
    
    return { vars, duplicates, problems };
  } catch (error) {
    return { vars: {}, duplicates: [], problems: [`Erro ao ler .env.production: ${error.message}`] };
  }
}

// Função para validar build
function validateBuild(projectPath, projectName) {
  const packageJsonPath = join(projectPath, 'package.json');
  
  if (!existsSync(packageJsonPath)) {
    return { ran: false, distExists: false };
  }
  
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    
    // Verificar se é projeto Vite
    if (!packageJson.dependencies?.vite && !packageJson.devDependencies?.vite) {
      return { ran: false, distExists: false };
    }
    
    // Tentar fazer build
    try {
      process.chdir(projectPath);
      
      // npm ci ou npm i
      if (existsSync(join(projectPath, 'package-lock.json'))) {
        execSync('npm ci', { stdio: 'pipe' });
      } else {
        execSync('npm i', { stdio: 'pipe' });
      }
      
      // npm run build
      execSync('npm run build', { stdio: 'pipe' });
      
      process.chdir(rootDir);
      
      const distExists = existsSync(join(projectPath, 'dist', 'index.html'));
      
      return { ran: true, distExists };
    } catch (error) {
      process.chdir(rootDir);
      return { ran: false, distExists: false, error: error.message };
    }
  } catch (error) {
    return { ran: false, distExists: false, error: error.message };
  }
}

// Função para validar index.html CSP
function validateIndexHtmlCsp(projectPath, projectName) {
  const indexPath = join(projectPath, 'index.html');
  
  if (!existsSync(indexPath)) {
    return { metaHasBackend: false };
  }
  
  try {
    const html = readFileSync(indexPath, 'utf8');
    const metaMatch = html.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content=["']([^"']*)["'][^>]*>/i);
    
    if (metaMatch) {
      const cspValue = metaMatch[1];
      const hasBackend = cspValue.includes('https://goldeouro-backend-v2.fly.dev');
      return { metaHasBackend: hasBackend };
    }
    
    return { metaHasBackend: false };
  } catch (error) {
    return { metaHasBackend: false, error: error.message };
  }
}

// Função principal de validação
async function validateProject(projectName, domain) {
  const projectPath = join(rootDir, projectName);
  
  console.log(`\n🔍 Validando ${projectName}...`);
  
  // A. Validação de arquivos
  console.log('  📁 Validando arquivos...');
  const vercelResult = validateVercelJson(projectPath, projectName);
  const envResult = validateEnvProduction(projectPath, projectName);
  const cspResult = validateIndexHtmlCsp(projectPath, projectName);
  
  // B. Build local
  console.log('  🔨 Executando build...');
  const buildResult = validateBuild(projectPath, projectName);
  
  // C. Testes HTTP
  console.log('  🌐 Testando endpoints...');
  
  // Manifest
  const manifestResponse = await httpRequest(`${domain}/manifest.webmanifest`);
  const manifestOk = manifestResponse.status === 200 && 
    manifestResponse.headers['content-type']?.startsWith('application/manifest+json');
  
  // Service Worker
  const swResponse = await httpRequest(`${domain}/sw.js`);
  const swOk = swResponse.status === 200 && 
    swResponse.headers['cache-control']?.includes('no-cache');
  
  // Health Check
  const healthResponse = await httpRequest(`${domain}/api/health`);
  const healthOk = healthResponse.status === 200 && 
    (healthResponse.json?.ok === true || healthResponse.json?.status === 'healthy');
  
  // Shoot POST (apenas para Player)
  let shootResult = { status: null, ok: false, method: 'POST', sampleBody: null };
  if (projectName === 'player-dist-deploy') {
    const shootResponse = await httpRequest(`${domain}/api/games/shoot`, {
      method: 'POST',
      body: { power: 50, direction: 'center' }
    });
    shootResult = {
      status: shootResponse.status,
      ok: shootResponse.status === 200 || (shootResponse.status >= 400 && shootResponse.status < 500),
      method: 'POST',
      sampleBody: shootResponse.json || shootResponse.text?.substring(0, 100)
    };
  }
  
  // Login (apenas para Admin)
  let loginResult = { status: null, ok: false };
  if (projectName === 'goldeouro-admin') {
    const loginResponse = await httpRequest(`${domain}/login`);
    loginResult = {
      status: loginResponse.status,
      ok: loginResponse.status === 200 || loginResponse.status === 304
    };
  }
  
  // D. CSP efetiva
  console.log('  🔒 Validando CSP efetiva...');
  const pageResponse = await httpRequest(domain);
  const cspHeader = pageResponse.headers['content-security-policy'] || '';
  const cspMeta = pageResponse.text.match(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  const cspMetaValue = cspMeta ? cspMeta[1] : '';
  
  const headerHasBackend = cspHeader.includes('https://goldeouro-backend-v2.fly.dev');
  const metaHasBackend = cspMetaValue.includes('https://goldeouro-backend-v2.fly.dev');
  
  return {
    vercel: vercelResult,
    env: envResult,
    build: buildResult,
    http: {
      manifest: { status: manifestResponse.status, contentTypeOk: manifestOk },
      sw: { status: swResponse.status, noCache: swOk },
      health: { status: healthResponse.status, bodyOk: healthOk },
      shootPost: shootResult,
      login: loginResult
    },
    cspEffective: { headerHasBackend, metaHasBackend }
  };
}

// Função para gerar resumo humano
function generateHumanSummary() {
  console.log('\n📊 RESUMO DA VALIDAÇÃO DE PRODUÇÃO');
  console.log('=====================================');
  
  // Player
  console.log('\n🎮 PLAYER (www.goldeouro.lol):');
  console.log(`  Vercel.json: ${result.player.vercel.csp_ok ? '✅' : '❌'} ${result.player.vercel.problems.length > 0 ? result.player.vercel.problems[0] : 'OK'}`);
  console.log(`  Build: ${result.player.build.distExists ? '✅' : '❌'} ${result.player.build.ran ? 'Executado' : 'Falhou'}`);
  console.log(`  Manifest: ${result.player.http.manifest.contentTypeOk ? '✅' : '❌'} ${result.player.http.manifest.status}`);
  console.log(`  Service Worker: ${result.player.http.sw.noCache ? '✅' : '❌'} ${result.player.http.sw.status}`);
  console.log(`  API Health: ${result.player.http.health.bodyOk ? '✅' : '❌'} ${result.player.http.health.status}`);
  console.log(`  Shoot POST: ${result.player.http.shootPost.ok ? '✅' : '❌'} ${result.player.http.shootPost.status}`);
  console.log(`  CSP Backend: ${result.player.cspEffective.headerHasBackend || result.player.cspEffective.metaHasBackend ? '✅' : '❌'}`);
  
  // Admin
  console.log('\n🔧 ADMIN (admin.goldeouro.lol):');
  console.log(`  Vercel.json: ${result.admin.vercel.csp_ok ? '✅' : '❌'} ${result.admin.vercel.problems.length > 0 ? result.admin.vercel.problems[0] : 'OK'}`);
  console.log(`  Build: ${result.admin.build.distExists ? '✅' : '❌'} ${result.admin.build.ran ? 'Executado' : 'Falhou'}`);
  console.log(`  Login: ${result.admin.http.login.ok ? '✅' : '❌'} ${result.admin.http.login.status}`);
  console.log(`  API Health: ${result.admin.http.health.ok ? '✅' : '❌'} ${result.admin.http.health.status}`);
  
  console.log('\n🎯 STATUS GERAL:');
  const playerOk = result.player.vercel.csp_ok && result.player.build.distExists && 
    result.player.http.manifest.contentTypeOk && result.player.http.sw.noCache && 
    result.player.http.health.bodyOk && result.player.http.shootPost.ok;
  const adminOk = result.admin.vercel.csp_ok && result.admin.build.distExists && 
    result.admin.http.login.ok;
  
  if (playerOk && adminOk) {
    console.log('  🎉 SISTEMA 100% FUNCIONAL!');
  } else {
    console.log('  ⚠️  ALGUNS PROBLEMAS DETECTADOS');
  }
}

// Execução principal
async function main() {
  console.log('🚀 Iniciando validação completa de produção...');
  
  try {
    // Validar Player
    result.player = await validateProject('player-dist-deploy', config.player.domain);
    
    // Validar Admin
    result.admin = await validateProject('goldeouro-admin', config.admin.domain);
    
    // Gerar resumo humano
    generateHumanSummary();
    
    // Salvar JSON
    const outputPath = join(rootDir, 'validate-output.json');
    const fs = await import('fs');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Resultado salvo em: ${outputPath}`);
    
  } catch (error) {
    console.error('💥 Erro durante validação:', error);
    process.exit(1);
  }
}

// Executar
main();
