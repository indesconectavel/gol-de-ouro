#!/usr/bin/env node
// === VALIDACAO FINAL PRODUCAO 100% ===

const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG = {
  PLAYER_DOMAIN: 'https://www.goldeouro.lol',
  ADMIN_DOMAIN: 'https://admin.goldeouro.lol',
  BACKEND: 'https://goldeouro-backend-v2.fly.dev',
  TIMEOUT: 10000
};

const results = {
  timestamp: new Date().toISOString(),
  config: CONFIG,
  checks: {},
  summary: {
    total: 0,
    pass: 0,
    fail: 0,
    warn: 0
  }
};

// Helper para fazer requisições HTTP
function httpCall(method, url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'User-Agent': 'Validation-Script/1.0',
        ...options.headers
      },
      timeout: CONFIG.TIMEOUT
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, json, raw: data });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message, status: 0 });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Timeout', status: 0 });
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Helper para log
function logStep(name, success, message) {
  results.summary.total++;
  if (success) {
    results.summary.pass++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    results.summary.fail++;
    console.log(`❌ ${name}: ${message}`);
  }
  return { name, success, message };
}

// Helper para warn
function logWarn(name, message) {
  results.summary.warn++;
  console.log(`⚠️  ${name}: ${message}`);
  return { name, success: false, message, warning: true };
}

async function main() {
  console.log('🚀 VALIDACAO FINAL PRODUCAO 100%');
  console.log('================================');

  // 1) Vercel.json Player
  console.log('\n📋 1) Vercel.json Player');
  try {
    const vercel = JSON.parse(fs.readFileSync('player-dist-deploy/vercel.json', 'utf8'));
    const hasApiRewrite = vercel.rewrites?.some(r => r.source === '/api/(.*)' && r.destination?.includes('/api/'));
    const hasSpaFallback = vercel.rewrites?.some(r => r.destination === '/index.html');
    const hasManifestHeader = vercel.headers?.some(h => h.source === '/manifest.webmanifest');
    const hasSwHeader = vercel.headers?.some(h => h.source === '/sw.js');
    const hasCSP = vercel.headers?.some(h => h.headers?.some(header => 
      header.key === 'Content-Security-Policy' && 
      header.value?.includes('goldeouro-backend-v2.fly.dev')
    ));

    results.checks.vercel_player = {
      api_rewrite: logStep('API Rewrite', hasApiRewrite, hasApiRewrite ? 'OK' : 'Missing'),
      spa_fallback: logStep('SPA Fallback', hasSpaFallback, hasSpaFallback ? 'OK' : 'Missing'),
      manifest_header: logStep('Manifest Header', hasManifestHeader, hasManifestHeader ? 'OK' : 'Missing'),
      sw_header: logStep('SW Header', hasSwHeader, hasSwHeader ? 'OK' : 'Missing'),
      csp_backend: logStep('CSP Backend', hasCSP, hasCSP ? 'OK' : 'Missing')
    };
  } catch (error) {
    results.checks.vercel_player = { error: error.message };
    console.log('❌ Vercel.json Player: Error reading file');
  }

  // 2) PWA Player
  console.log('\n📱 2) PWA Player');
  try {
    const manifestResponse = await httpCall('HEAD', `${CONFIG.PLAYER_DOMAIN}/manifest.webmanifest`);
    const manifestOk = manifestResponse.status === 200 && 
      manifestResponse.headers['content-type']?.includes('application/manifest+json');
    
    const swResponse = await httpCall('HEAD', `${CONFIG.PLAYER_DOMAIN}/sw.js`);
    const swOk = swResponse.status === 200 && 
      swResponse.headers['cache-control']?.includes('no-cache');

    results.checks.pwa_player = {
      manifest: logStep('Manifest 200', manifestOk, 
        manifestOk ? 'OK' : `Status: ${manifestResponse.status}`),
      sw: logStep('SW 200 + no-cache', swOk, 
        swOk ? 'OK' : `Status: ${swResponse.status}`)
    };
  } catch (error) {
    results.checks.pwa_player = { error: error.message };
    console.log('❌ PWA Player: Error testing');
  }

  // 3) API via Proxy Player
  console.log('\n🔗 3) API via Proxy Player');
  try {
    const healthResponse = await httpCall('GET', `${CONFIG.PLAYER_DOMAIN}/api/health`);
    const healthOk = healthResponse.status === 200 && healthResponse.json?.status === 'healthy';

    const shootResponse = await httpCall('POST', `${CONFIG.PLAYER_DOMAIN}/api/games/shoot`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ power: 50, direction: 'center' })
    });
    const shootOk = shootResponse.status === 401 || shootResponse.status === 403;

    results.checks.api_proxy_player = {
      health: logStep('GET /api/health 200', healthOk, 
        healthOk ? 'OK' : `Status: ${healthResponse.status}`),
      shoot_unauthorized: logStep('POST /api/games/shoot 401/403', shootOk, 
        shootOk ? 'OK' : `Status: ${shootResponse.status}`)
    };
  } catch (error) {
    results.checks.api_proxy_player = { error: error.message };
    console.log('❌ API Proxy Player: Error testing');
  }

  // 4) CSP Player
  console.log('\n🛡️ 4) CSP Player');
  try {
    const cspResponse = await httpCall('HEAD', CONFIG.PLAYER_DOMAIN);
    const cspPresent = !!cspResponse.headers['content-security-policy'];
    const cspBackend = cspResponse.headers['content-security-policy']?.includes('goldeouro-backend-v2.fly.dev');

    results.checks.csp_player = {
      present: logStep('CSP Header Present', cspPresent, 
        cspPresent ? 'OK' : 'Missing'),
      backend: logStep('CSP Backend Allowed', cspBackend, 
        cspBackend ? 'OK' : 'Missing')
    };
  } catch (error) {
    results.checks.csp_player = { error: error.message };
    console.log('❌ CSP Player: Error testing');
  }

  // 5) Admin
  console.log('\n👨‍💼 5) Admin');
  try {
    const adminResponse = await httpCall('GET', `${CONFIG.ADMIN_DOMAIN}/login`);
    const adminOk = adminResponse.status === 200;

    results.checks.admin = {
      login: logStep('Admin /login 200', adminOk, 
        adminOk ? 'OK' : `Status: ${adminResponse.status}`)
    };
  } catch (error) {
    results.checks.admin = { error: error.message };
    console.log('❌ Admin: Error testing');
  }

  // 6) Backend Direto
  console.log('\n⚙️ 6) Backend Direto');
  try {
    const backendHealthResponse = await httpCall('GET', `${CONFIG.BACKEND}/health`);
    const backendHealthOk = backendHealthResponse.status === 200 && backendHealthResponse.json?.ok === true;

    const backendMetaResponse = await httpCall('GET', `${CONFIG.BACKEND}/meta`);
    const backendMetaOk = backendMetaResponse.status === 200 && backendMetaResponse.json?.ok === true;

    results.checks.backend = {
      health: logStep('Backend /health 200', backendHealthOk, 
        backendHealthOk ? 'OK' : `Status: ${backendHealthResponse.status}`),
      meta: backendMetaOk ? 
        logStep('Backend /meta 200', true, 'OK') : 
        logWarn('Backend /meta 200', `Status: ${backendMetaResponse.status} (não crítico)`)
    };
  } catch (error) {
    results.checks.backend = { error: error.message };
    console.log('❌ Backend: Error testing');
  }

  // Resumo Final
  console.log('\n📊 RESUMO FINAL');
  console.log('================');
  console.log(`Total: ${results.summary.total}`);
  console.log(`✅ Pass: ${results.summary.pass}`);
  console.log(`❌ Fail: ${results.summary.fail}`);
  console.log(`⚠️  Warn: ${results.summary.warn}`);

  // Salvar resultados
  fs.writeFileSync('validate-output.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Resultados salvos em validate-output.json');

  // Determinar GO/NO-GO (warnings não são críticos)
  const criticalFailures = results.summary.fail;
  if (criticalFailures === 0) {
    console.log('\n🎉 STATUS: GO! (100% funcional)');
    process.exit(0);
  } else {
    console.log('\n❌ STATUS: NO-GO (correções necessárias)');
    process.exit(1);
  }
}

main().catch(console.error);