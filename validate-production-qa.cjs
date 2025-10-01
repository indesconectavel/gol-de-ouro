#!/usr/bin/env node
// === VALIDACAO PRODUCAO QA GOL DE OURO ===

const https = require('https');
const fs = require('fs');

const CONFIG = {
  PLAYER: 'https://www.goldeouro.lol',
  ADMIN: 'https://admin.goldeouro.lol',
  BACKEND: 'https://goldeouro-backend-v2.fly.dev',
  TIMEOUT: 15000
};

const results = {
  timestamp: new Date().toISOString(),
  config: CONFIG,
  checks: [],
  summary: { total: 0, pass: 0, warn: 0, fail: 0 }
};

function httpCall(method, url, options = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: { 'User-Agent': 'GolDeOuro-QA/1.0', ...options.headers },
      timeout: CONFIG.TIMEOUT
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, json, raw: data.substring(0, 200) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: data.substring(0, 200) });
        }
      });
    });

    req.on('error', (error) => resolve({ error: error.message, status: 0 }));
    req.on('timeout', () => { req.destroy(); resolve({ error: 'Timeout', status: 0 }); });

    if (options.body) req.write(options.body);
    req.end();
  });
}

function addCheck(name, url, method, status, result, notes, critical = true) {
  results.summary.total++;
  if (result === 'pass') results.summary.pass++;
  else if (result === 'warn') results.summary.warn++;
  else if (result === 'fail') results.summary.fail++;

  results.checks.push({
    name, url, method, statusCode: status, result, notes, critical,
    timestamp: new Date().toISOString()
  });

  const icon = result === 'pass' ? '✅' : result === 'warn' ? '⚠️' : '❌';
  console.log(`${icon} ${name}: ${notes}`);
}

async function main() {
  console.log('🔍 VALIDACAO PRODUCAO QA GOL DE OURO');
  console.log('=====================================');

  // Player - Manifest
  console.log('\n📱 Player - Manifest');
  try {
    const response = await httpCall('GET', `${CONFIG.PLAYER}/manifest.webmanifest`);
    const statusOk = response.status === 200;
    const contentTypeOk = response.headers['content-type']?.includes('application/manifest+json');
    
    if (statusOk && contentTypeOk) {
      addCheck('Player Manifest', `${CONFIG.PLAYER}/manifest.webmanifest`, 'GET', 
        response.status, 'pass', '200 + application/manifest+json', true);
    } else {
      addCheck('Player Manifest', `${CONFIG.PLAYER}/manifest.webmanifest`, 'GET', 
        response.status, 'fail', `Status: ${response.status}, Content-Type: ${response.headers['content-type']}`, true);
    }
  } catch (error) {
    addCheck('Player Manifest', `${CONFIG.PLAYER}/manifest.webmanifest`, 'GET', 
      0, 'fail', `Error: ${error.message}`, true);
  }

  // Player - Service Worker
  console.log('\n🔧 Player - Service Worker');
  try {
    const response = await httpCall('GET', `${CONFIG.PLAYER}/sw.js`);
    const statusOk = response.status === 200;
    const cacheControlOk = response.headers['cache-control']?.includes('no-cache');
    
    if (statusOk && cacheControlOk) {
      addCheck('Player SW', `${CONFIG.PLAYER}/sw.js`, 'GET', 
        response.status, 'pass', '200 + no-cache', true);
    } else {
      addCheck('Player SW', `${CONFIG.PLAYER}/sw.js`, 'GET', 
        response.status, 'fail', `Status: ${response.status}, Cache-Control: ${response.headers['cache-control']}`, true);
    }
  } catch (error) {
    addCheck('Player SW', `${CONFIG.PLAYER}/sw.js`, 'GET', 
      0, 'fail', `Error: ${error.message}`, true);
  }

  // Player - API Health
  console.log('\n🔗 Player - API Health');
  try {
    const response = await httpCall('GET', `${CONFIG.PLAYER}/api/health`);
    const statusOk = response.status === 200;
    const jsonOk = response.json?.ok === true || response.json?.status === 'healthy';
    
    if (statusOk && jsonOk) {
      addCheck('Player API Health', `${CONFIG.PLAYER}/api/health`, 'GET', 
        response.status, 'pass', '200 + JSON ok/healthy', true);
    } else {
      addCheck('Player API Health', `${CONFIG.PLAYER}/api/health`, 'GET', 
        response.status, 'fail', `Status: ${response.status}, JSON: ${JSON.stringify(response.json)}`, true);
    }
  } catch (error) {
    addCheck('Player API Health', `${CONFIG.PLAYER}/api/health`, 'GET', 
      0, 'fail', `Error: ${error.message}`, true);
  }

  // Player - API Shoot (sem token)
  console.log('\n🎯 Player - API Shoot (sem token)');
  try {
    const response = await httpCall('POST', `${CONFIG.PLAYER}/api/games/shoot`, {
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ power: 50, direction: 'center' })
    });
    const unauthorizedOk = response.status === 401 || response.status === 403;
    
    if (unauthorizedOk) {
      addCheck('Player API Shoot Unauthorized', `${CONFIG.PLAYER}/api/games/shoot`, 'POST', 
        response.status, 'pass', `${response.status} (esperado sem token)`, true);
    } else {
      addCheck('Player API Shoot Unauthorized', `${CONFIG.PLAYER}/api/games/shoot`, 'POST', 
        response.status, 'fail', `Status: ${response.status} (esperado 401/403)`, true);
    }
  } catch (error) {
    addCheck('Player API Shoot Unauthorized', `${CONFIG.PLAYER}/api/games/shoot`, 'POST', 
      0, 'fail', `Error: ${error.message}`, true);
  }

  // Player - CSP Header
  console.log('\n🛡️ Player - CSP Header');
  try {
    const response = await httpCall('HEAD', CONFIG.PLAYER);
    const cspPresent = !!response.headers['content-security-policy'];
    const cspBackendOk = response.headers['content-security-policy']?.includes('goldeouro-backend-v2.fly.dev');
    
    if (cspPresent && cspBackendOk) {
      addCheck('Player CSP', CONFIG.PLAYER, 'HEAD', 
        response.status, 'pass', 'CSP presente + backend liberado', true);
    } else {
      addCheck('Player CSP', CONFIG.PLAYER, 'HEAD', 
        response.status, 'fail', `CSP: ${cspPresent ? 'presente' : 'ausente'}, Backend: ${cspBackendOk ? 'liberado' : 'bloqueado'}`, true);
    }
  } catch (error) {
    addCheck('Player CSP', CONFIG.PLAYER, 'HEAD', 
      0, 'fail', `Error: ${error.message}`, true);
  }

  // Admin - Login
  console.log('\n👨‍💼 Admin - Login');
  try {
    const response = await httpCall('GET', `${CONFIG.ADMIN}/login`);
    const statusOk = response.status === 200;
    
    if (statusOk) {
      addCheck('Admin Login', `${CONFIG.ADMIN}/login`, 'GET', 
        response.status, 'pass', '200 (SPA fallback ok)', true);
    } else {
      addCheck('Admin Login', `${CONFIG.ADMIN}/login`, 'GET', 
        response.status, 'fail', `Status: ${response.status}`, true);
    }
  } catch (error) {
    addCheck('Admin Login', `${CONFIG.ADMIN}/login`, 'GET', 
      0, 'fail', `Error: ${error.message}`, true);
  }

  // Admin - API Health (se existir)
  console.log('\n🔗 Admin - API Health');
  try {
    const response = await httpCall('GET', `${CONFIG.ADMIN}/api/health`);
    const statusOk = response.status === 200;
    
    if (statusOk) {
      addCheck('Admin API Health', `${CONFIG.ADMIN}/api/health`, 'GET', 
        response.status, 'pass', '200', true);
    } else {
      addCheck('Admin API Health', `${CONFIG.ADMIN}/api/health`, 'GET', 
        response.status, 'warn', `Status: ${response.status} (opcional)`, false);
    }
  } catch (error) {
    addCheck('Admin API Health', `${CONFIG.ADMIN}/api/health`, 'GET', 
      0, 'warn', `Error: ${error.message} (opcional)`, false);
  }

  // Backend - Health
  console.log('\n⚙️ Backend - Health');
  try {
    const response = await httpCall('GET', `${CONFIG.BACKEND}/health`);
    const statusOk = response.status === 200;
    const jsonOk = response.json?.ok === true;
    
    if (statusOk && jsonOk) {
      addCheck('Backend Health', `${CONFIG.BACKEND}/health`, 'GET', 
        response.status, 'pass', '200 + JSON ok', true);
    } else {
      addCheck('Backend Health', `${CONFIG.BACKEND}/health`, 'GET', 
        response.status, 'fail', `Status: ${response.status}, JSON: ${JSON.stringify(response.json)}`, true);
    }
  } catch (error) {
    addCheck('Backend Health', `${CONFIG.BACKEND}/health`, 'GET', 
      0, 'fail', `Error: ${error.message}`, true);
  }

  // Backend - Meta (opcional)
  console.log('\n📊 Backend - Meta (opcional)');
  try {
    const response = await httpCall('GET', `${CONFIG.BACKEND}/meta`);
    const statusOk = response.status === 200;
    const jsonOk = response.json?.ok === true;
    
    if (statusOk && jsonOk) {
      addCheck('Backend Meta', `${CONFIG.BACKEND}/meta`, 'GET', 
        response.status, 'pass', '200 + JSON ok', false);
    } else {
      addCheck('Backend Meta', `${CONFIG.BACKEND}/meta`, 'GET', 
        response.status, 'warn', `Status: ${response.status} (não crítico)`, false);
    }
  } catch (error) {
    addCheck('Backend Meta', `${CONFIG.BACKEND}/meta`, 'GET', 
      0, 'warn', `Error: ${error.message} (não crítico)`, false);
  }

  // PWA Assets
  console.log('\n🎨 PWA Assets');
  const icons = [
    'icons/icon-192.png', 'icons/icon-512.png', 
    'icons/maskable-192.png', 'icons/maskable-512.png',
    'apple-touch-icon.png', 'favicon.png'
  ];

  for (const icon of icons) {
    try {
      const response = await httpCall('HEAD', `${CONFIG.PLAYER}/${icon}`);
      if (response.status === 200) {
        addCheck(`PWA Icon ${icon}`, `${CONFIG.PLAYER}/${icon}`, 'HEAD', 
          response.status, 'pass', '200', false);
      } else {
        addCheck(`PWA Icon ${icon}`, `${CONFIG.PLAYER}/${icon}`, 'HEAD', 
          response.status, 'warn', `Status: ${response.status} (não crítico)`, false);
      }
    } catch (error) {
      addCheck(`PWA Icon ${icon}`, `${CONFIG.PLAYER}/${icon}`, 'HEAD', 
        0, 'warn', `Error: ${error.message} (não crítico)`, false);
    }
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

  // Determinar GO/NO-GO
  if (results.summary.fail === 0) {
    console.log('\n🎉 STATUS: GO! (100% funcional)');
    process.exit(0);
  } else {
    console.log('\n❌ STATUS: NO-GO (correções necessárias)');
    process.exit(1);
  }
}

main().catch(console.error);
