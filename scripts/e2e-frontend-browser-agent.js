/**
 * 🔥 TESTES E2E FRONTEND - BROWSER AGENT
 * Testes completos simulando usuário real no browser
 */

let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.error('❌ Puppeteer não encontrado. Instale com: npm install puppeteer --save-dev');
  process.exit(1);
}
const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_URL = 'https://www.goldeouro.lol';
const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';
const WS_URL = 'wss://goldeouro-backend-v2.fly.dev';

const REPORT_DIR = path.join(__dirname, '../docs/e2e-reports');
const SCREENSHOTS_DIR = path.join(REPORT_DIR, 'screenshots');

const testResults = {
  timestamp: new Date().toISOString(),
  version: 'E2E-FRONTEND-BROWSER-AGENT',
  frontendUrl: FRONTEND_URL,
  backendUrl: BACKEND_URL,
  wsUrl: WS_URL,
  scenarios: {},
  metrics: {
    totalScenarios: 0,
    passedScenarios: 0,
    failedScenarios: 0,
    totalDuration: 0
  },
  errors: [],
  warnings: [],
  screenshots: [],
  networkLogs: [],
  consoleLogs: [],
  localStorage: {},
  sessionStorage: {},
  score: 0,
  decision: 'PENDING'
};

// Utilitários
const utils = {
  log(message, type = 'info') {
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪',
      screenshot: '📸'
    }[type] || 'ℹ️';
    console.log(`${prefix} ${message}`);
  },

  async ensureDir(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Ignorar se já existe
    }
  },

  async takeScreenshot(page, name, viewport = null) {
    try {
      if (viewport) {
        await page.setViewport(viewport);
        await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar renderização
      }
      
      const screenshotPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
      await page.screenshot({ 
        path: screenshotPath, 
        fullPage: true,
        type: 'png'
      });
      
      testResults.screenshots.push({
        name,
        path: screenshotPath,
        viewport: viewport || 'default',
        timestamp: new Date().toISOString()
      });
      
      utils.log(`Screenshot salvo: ${name}`, 'screenshot');
      
      return screenshotPath;
    } catch (error) {
      utils.log(`Erro ao tirar screenshot ${name}: ${error.message}`, 'error');
      return null;
    }
  },

  async collectConsoleLogs(page) {
    const logs = [];
    page.on('console', msg => {
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
        timestamp: new Date().toISOString()
      };
      logs.push(logEntry);
      testResults.consoleLogs.push(logEntry);
    });
    return logs;
  },

  async collectNetworkLogs(page) {
    const networkLogs = [];
    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: new Date().toISOString()
      });
    });
    
    page.on('response', response => {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        headers: response.headers(),
        timestamp: new Date().toISOString()
      });
    });
    
    return networkLogs;
  },

  async collectStorage(page) {
    const localStorage = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        storage[key] = window.localStorage.getItem(key);
      }
      return storage;
    });
    
    const sessionStorage = await page.evaluate(() => {
      const storage = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        storage[key] = window.sessionStorage.getItem(key);
      }
      return storage;
    });
    
    testResults.localStorage = localStorage;
    testResults.sessionStorage = sessionStorage;
    
    return { localStorage, sessionStorage };
  }
};

/**
 * CENÁRIO 1: Health-check visual
 */
async function scenario1_HealthCheck(page) {
  utils.log('=== CENÁRIO 1: HEALTH-CHECK VISUAL ===', 'test');
  const startTime = Date.now();
  
  try {
    // Acessar home
    utils.log(`Acessando ${FRONTEND_URL}...`);
    await page.goto(FRONTEND_URL, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Screenshot desktop
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await utils.takeScreenshot(page, '01-health-check-desktop', { width: 1920, height: 1080 });
    
    // Screenshot mobile
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await utils.takeScreenshot(page, '01-health-check-mobile', { width: 375, height: 812 });
    
    // Verificar status
    const status = page.url();
    const title = await page.title();
    
    // Coletar console logs
    const consoleErrors = testResults.consoleLogs.filter(log => 
      log.type === 'error' && (
        log.text.includes('ERR_NAME_NOT_RESOLVED') ||
        log.text.includes('CSP') ||
        log.text.includes('Network Error') ||
        log.text.includes('Failed to fetch')
      )
    );
    
    const hasBackendError = consoleErrors.some(log => 
      log.text.includes('goldeouro-backend-v2.fly.dev')
    );
    
    const duration = Date.now() - startTime;
    
    const result = {
      name: 'Health-check visual',
      status: consoleErrors.length === 0 && !hasBackendError ? 'PASS' : 'FAIL',
      duration,
      details: {
        url: status,
        title,
        consoleErrors: consoleErrors.length,
        hasBackendError,
        errors: consoleErrors
      }
    };
    
    if (result.status === 'PASS') {
      utils.log('✅ Health-check passou', 'success');
    } else {
      utils.log(`❌ Health-check falhou: ${consoleErrors.length} erros no console`, 'error');
      testResults.errors.push(`Health-check: ${consoleErrors.length} erros no console`);
    }
    
    return result;
  } catch (error) {
    utils.log(`❌ Erro no health-check: ${error.message}`, 'error');
    return {
      name: 'Health-check visual',
      status: 'FAIL',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * CENÁRIO 2: Registro (novo usuário)
 */
async function scenario2_Register(page) {
  utils.log('=== CENÁRIO 2: REGISTRO ===', 'test');
  const startTime = Date.now();
  
  try {
    // Gerar email único
    const timestamp = Date.now();
    const testEmail = `test+${timestamp}@example.com`;
    const testPassword = 'Test123456!';
    const testUsername = `testuser_${timestamp}`;
    
    // Navegar para registro
    utils.log('Navegando para registro...');
    await page.goto(`${FRONTEND_URL}/register`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await utils.takeScreenshot(page, '02-register-form-desktop');
    
    // Preencher formulário
    utils.log('Preenchendo formulário de registro...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    // Tentar múltiplos seletores
    const emailInput = await page.$('input[type="email"]') || 
                       await page.$('input[name="email"]') ||
                       await page.$('input[placeholder*="email" i]');
    
    const passwordInput = await page.$('input[type="password"]') || 
                          await page.$('input[name="password"]');
    
    const usernameInput = await page.$('input[type="text"]') || 
                          await page.$('input[name="name"]') ||
                          await page.$('input[name="username"]');
    
    if (emailInput) await emailInput.type(testEmail);
    if (usernameInput) await usernameInput.type(testUsername);
    if (passwordInput) await passwordInput.type(testPassword);
    
    await utils.takeScreenshot(page, '02-register-filled-desktop');
    
    // Submit
    utils.log('Submetendo formulário...');
    let submitButton = await page.$('button[type="submit"]');
    
    if (!submitButton) {
      // Tentar encontrar por texto usando evaluate
      const buttonHandle = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('Registrar') || btn.textContent.includes('Criar conta'));
      });
      if (buttonHandle && buttonHandle.asElement()) {
        submitButton = buttonHandle.asElement();
      }
    }
    
    if (submitButton) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
        submitButton.click()
      ]);
    } else {
      // Tentar Enter
      await page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    await utils.takeScreenshot(page, '02-register-success-desktop');
    
    // Verificar token salvo
    const storage = await utils.collectStorage(page);
    const hasToken = !!storage.localStorage.authToken;
    const currentUrl = page.url();
    const redirectedToHome = currentUrl.includes('/home') || 
                            currentUrl.includes('/dashboard') ||
                            currentUrl.includes('/jogo');
    
    const duration = Date.now() - startTime;
    
    const result = {
      name: 'Registro',
      status: hasToken && redirectedToHome ? 'PASS' : 'FAIL',
      duration,
      details: {
        email: testEmail,
        username: testUsername,
        hasToken,
        redirectedToHome,
        currentUrl,
        storage: storage.localStorage
      }
    };
    
    if (result.status === 'PASS') {
      utils.log('✅ Registro passou', 'success');
      testResults.testCredentials = { email: testEmail, password: testPassword };
    } else {
      utils.log(`❌ Registro falhou: token=${hasToken}, redirect=${redirectedToHome}`, 'error');
      testResults.errors.push(`Registro: token=${hasToken}, redirect=${redirectedToHome}`);
    }
    
    return result;
  } catch (error) {
    utils.log(`❌ Erro no registro: ${error.message}`, 'error');
    return {
      name: 'Registro',
      status: 'FAIL',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * CENÁRIO 3: Login (usuário existente)
 */
async function scenario3_Login(page, credentials) {
  utils.log('=== CENÁRIO 3: LOGIN ===', 'test');
  const startTime = Date.now();
  
  try {
    // Navegar para login
    utils.log('Navegando para login...');
    await page.goto(`${FRONTEND_URL}/login`, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    await utils.takeScreenshot(page, '03-login-form-desktop');
    
    // Preencher formulário
    utils.log('Preenchendo formulário de login...');
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });
    
    const emailInput = await page.$('input[type="email"]') || 
                       await page.$('input[name="email"]');
    const passwordInput = await page.$('input[type="password"]') || 
                          await page.$('input[name="password"]');
    
    if (emailInput) await emailInput.type(credentials.email);
    if (passwordInput) await passwordInput.type(credentials.password);
    
    await utils.takeScreenshot(page, '03-login-filled-desktop');
    
    // Submit
    utils.log('Submetendo formulário...');
    let submitButton = await page.$('button[type="submit"]');
    
    if (!submitButton) {
      // Tentar encontrar por texto usando evaluate
      const buttonHandle = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => btn.textContent.includes('Entrar') || btn.textContent.includes('Login'));
      });
      if (buttonHandle && buttonHandle.asElement()) {
        submitButton = buttonHandle.asElement();
      }
    }
    
    if (submitButton) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
        submitButton.click()
      ]);
    } else {
      await page.keyboard.press('Enter');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    await utils.takeScreenshot(page, '03-login-success-desktop');
    
    // Verificar token e redirecionamento
    const storage = await utils.collectStorage(page);
    const hasToken = !!storage.localStorage.authToken;
    const currentUrl = page.url();
    const redirectedToHome = currentUrl.includes('/home') || 
                            currentUrl.includes('/dashboard') ||
                            currentUrl.includes('/jogo');
    
    const duration = Date.now() - startTime;
    
    const result = {
      name: 'Login',
      status: hasToken && redirectedToHome ? 'PASS' : 'FAIL',
      duration,
      details: {
        hasToken,
        redirectedToHome,
        currentUrl,
        storage: storage.localStorage
      }
    };
    
    if (result.status === 'PASS') {
      utils.log('✅ Login passou', 'success');
    } else {
      utils.log(`❌ Login falhou: token=${hasToken}, redirect=${redirectedToHome}`, 'error');
      testResults.errors.push(`Login: token=${hasToken}, redirect=${redirectedToHome}`);
    }
    
    return result;
  } catch (error) {
    utils.log(`❌ Erro no login: ${error.message}`, 'error');
    return {
      name: 'Login',
      status: 'FAIL',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * CENÁRIO 4: WebSocket realtime
 */
async function scenario4_WebSocket(page) {
  utils.log('=== CENÁRIO 4: WEBSOCKET REALTIME ===', 'test');
  const startTime = Date.now();
  
  try {
    // Obter token do localStorage
    const storage = await utils.collectStorage(page);
    const token = storage.localStorage.authToken;
    
    if (!token) {
      throw new Error('Token não encontrado no localStorage');
    }
    
    utils.log('Conectando ao WebSocket...');
    
    // Conectar WebSocket via CDP
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');
    
    // Injetar código para conectar WebSocket
    const wsConnected = await page.evaluate(async (wsUrl, token) => {
      return new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        let authSent = false;
        let connected = false;
        let authAck = false;
        let heartbeat = false;
        
        const timeout = setTimeout(() => {
          resolve({
            connected,
            authAck,
            heartbeat,
            error: 'Timeout'
          });
        }, 5000);
        
        ws.onopen = () => {
          connected = true;
          if (token) {
            ws.send(JSON.stringify({ type: 'auth', token }));
            authSent = true;
          }
        };
        
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'auth_success' || data.type === 'connected') {
              authAck = true;
            }
            if (data.type === 'ping' || data.type === 'pong' || data.type === 'heartbeat') {
              heartbeat = true;
            }
            
            if (connected && authAck) {
              clearTimeout(timeout);
              resolve({
                connected: true,
                authAck: true,
                heartbeat,
                messages: [data]
              });
            }
          } catch (e) {
            // Ignorar erros de parse
          }
        };
        
        ws.onerror = (error) => {
          clearTimeout(timeout);
          resolve({
            connected: false,
            authAck: false,
            heartbeat: false,
            error: error.message || 'WebSocket error'
          });
        };
        
        ws.onclose = () => {
          if (!connected || !authAck) {
            clearTimeout(timeout);
            resolve({
              connected,
              authAck,
              heartbeat,
              error: 'Connection closed'
            });
          }
        };
      });
    }, WS_URL, token);
    
    const duration = Date.now() - startTime;
    
    const result = {
      name: 'WebSocket realtime',
      status: wsConnected.connected && wsConnected.authAck && duration < 2000 ? 'PASS' : 'FAIL',
      duration,
      details: {
        connected: wsConnected.connected,
        authAck: wsConnected.authAck,
        heartbeat: wsConnected.heartbeat,
        error: wsConnected.error,
        messages: wsConnected.messages || []
      }
    };
    
    if (result.status === 'PASS') {
      utils.log('✅ WebSocket passou', 'success');
    } else {
      utils.log(`❌ WebSocket falhou: ${JSON.stringify(wsConnected)}`, 'error');
      testResults.errors.push(`WebSocket: ${wsConnected.error || 'Falha na conexão'}`);
    }
    
    return result;
  } catch (error) {
    utils.log(`❌ Erro no WebSocket: ${error.message}`, 'error');
    return {
      name: 'WebSocket realtime',
      status: 'FAIL',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * CENÁRIO 5: Criar PIX (fluxo PIX V6)
 */
async function scenario5_CreatePix(page) {
  utils.log('=== CENÁRIO 5: CRIAR PIX V6 ===', 'test');
  const startTime = Date.now();
  
  try {
    // Navegar para tela de depósito/PIX
    utils.log('Navegando para tela de depósito...');
    
    // Tentar múltiplas rotas possíveis
    const depositRoutes = ['/deposito', '/deposit', '/creditos', '/credits', '/pix'];
    let depositPage = null;
    
    for (const route of depositRoutes) {
      try {
        await page.goto(`${FRONTEND_URL}${route}`, { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
        depositPage = route;
        break;
      } catch (e) {
        // Tentar próxima rota
      }
    }
    
    if (!depositPage) {
      // Tentar encontrar botão/link de depósito
      let depositButton = await page.$('a[href*="deposit"]');
      
      if (!depositButton) {
        const buttonHandle = await page.evaluateHandle(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(btn => 
            btn.textContent.includes('Depósito') || 
            btn.textContent.includes('PIX')
          );
        });
        if (buttonHandle && buttonHandle.asElement()) {
          depositButton = buttonHandle.asElement();
        }
      }
      if (depositButton) {
        await depositButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    await utils.takeScreenshot(page, '05-pix-form-desktop');
    
    // Preencher valor
    utils.log('Preenchendo formulário PIX...');
    const valorInput = await page.$('input[type="number"]') ||
                      await page.$('input[name="valor"]') ||
                      await page.$('input[name="amount"]');
    
    if (valorInput) {
      await valorInput.click({ clickCount: 3 });
      await valorInput.type('10.00');
    }
    
    await utils.takeScreenshot(page, '05-pix-filled-desktop');
    
    // Submit
    utils.log('Criando PIX...');
    let createButton = null;
    const buttonHandle = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(btn => 
        btn.textContent.includes('Criar') || 
        btn.textContent.includes('Gerar') || 
        btn.textContent.includes('PIX')
      );
    });
    if (buttonHandle && buttonHandle.asElement()) {
      createButton = buttonHandle.asElement();
    }
    
    if (createButton) {
      await createButton.click();
      await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar resposta do backend
    }
    
    await utils.takeScreenshot(page, '05-pix-result-desktop');
    
    // Verificar resposta
    const pixData = await page.evaluate(() => {
      // Tentar encontrar QR code ou dados do PIX na página
      const qrCode = document.querySelector('img[src*="qr"], canvas, [data-qr-code]');
      const copyPaste = document.querySelector('[data-copy-paste], [id*="copy"], [class*="copy"]');
      
      return {
        hasQRCode: !!qrCode,
        hasCopyPaste: !!copyPaste,
        qrCodeSrc: qrCode ? qrCode.src : null,
        copyPasteText: copyPaste ? copyPaste.textContent : null
      };
    });
    
    // Verificar network logs para resposta do backend
    const pixResponse = testResults.networkLogs.find(log => 
      log.url && log.url.includes('/pix/criar') && log.type === 'response'
    );
    
    const duration = Date.now() - startTime;
    
    const result = {
      name: 'Criar PIX V6',
      status: pixData.hasQRCode || pixData.hasCopyPaste ? 'PASS' : 'FAIL',
      duration,
      details: {
        hasQRCode: pixData.hasQRCode,
        hasCopyPaste: pixData.hasCopyPaste,
        qrCodeSrc: pixData.qrCodeSrc,
        copyPasteText: pixData.copyPasteText,
        backendResponse: pixResponse ? {
          status: pixResponse.status,
          url: pixResponse.url
        } : null
      }
    };
    
    if (result.status === 'PASS') {
      utils.log('✅ Criar PIX passou', 'success');
    } else {
      utils.log(`❌ Criar PIX falhou: QR=${pixData.hasQRCode}, CopyPaste=${pixData.hasCopyPaste}`, 'error');
      testResults.errors.push(`Criar PIX: QR Code não encontrado`);
    }
    
    return result;
  } catch (error) {
    utils.log(`❌ Erro ao criar PIX: ${error.message}`, 'error');
    return {
      name: 'Criar PIX V6',
      status: 'FAIL',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * CENÁRIO 6: Jogo (chute)
 */
async function scenario6_Game(page) {
  utils.log('=== CENÁRIO 6: JOGO (CHUTE) ===', 'test');
  const startTime = Date.now();
  
  try {
    // Navegar para tela de jogo
    utils.log('Navegando para tela de jogo...');
    const gameRoutes = ['/jogo', '/game', '/dashboard', '/home'];
    
    for (const route of gameRoutes) {
      try {
        await page.goto(`${FRONTEND_URL}${route}`, { 
          waitUntil: 'networkidle2',
          timeout: 10000 
        });
        break;
      } catch (e) {
        // Continuar
      }
    }
    
    await utils.takeScreenshot(page, '06-game-screen-desktop');
    
    // Encontrar botão de chute
    utils.log('Procurando botão de chute...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let shootButton = await page.$('[data-shoot]') ||
                     await page.$('[id*="shoot"]');
    
    if (!shootButton) {
      const buttonHandle = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent.includes('Chutar') || 
          btn.textContent.includes('Chute')
        );
      });
      if (buttonHandle && buttonHandle.asElement()) {
        shootButton = buttonHandle.asElement();
      }
    }
    
    if (shootButton) {
      await shootButton.click();
      await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar resposta
      
      await utils.takeScreenshot(page, '06-game-shoot-result-desktop');
    }
    
    const duration = Date.now() - startTime;
    
    const result = {
      name: 'Jogo (chute)',
      status: shootButton ? 'PASS' : 'FAIL',
      duration,
      details: {
        foundShootButton: !!shootButton
      }
    };
    
    if (result.status === 'PASS') {
      utils.log('✅ Jogo passou', 'success');
    } else {
      utils.log('❌ Jogo falhou: botão de chute não encontrado', 'error');
      testResults.errors.push('Jogo: botão de chute não encontrado');
    }
    
    return result;
  } catch (error) {
    utils.log(`❌ Erro no jogo: ${error.message}`, 'error');
    return {
      name: 'Jogo (chute)',
      status: 'FAIL',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * CENÁRIO 7: Logout & Persistence
 */
async function scenario7_Logout(page) {
  utils.log('=== CENÁRIO 7: LOGOUT & PERSISTENCE ===', 'test');
  const startTime = Date.now();
  
  try {
    // Fazer logout
    utils.log('Fazendo logout...');
    let logoutButton = await page.$('a[href*="logout"]');
    
    if (!logoutButton) {
      const buttonHandle = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent.includes('Sair') || 
          btn.textContent.includes('Logout')
        );
      });
      if (buttonHandle && buttonHandle.asElement()) {
        logoutButton = buttonHandle.asElement();
      }
    }
    
    if (logoutButton) {
      await logoutButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await utils.takeScreenshot(page, '07-logout-desktop');
    
    // Recarregar página
    await page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await utils.takeScreenshot(page, '07-after-reload-desktop');
    
    // Verificar storage
    const storage = await utils.collectStorage(page);
    const hasToken = !!storage.localStorage.authToken;
    const currentUrl = page.url();
    const isLoginPage = currentUrl.includes('/login') || currentUrl.includes('/register');
    
    const duration = Date.now() - startTime;
    
    const result = {
      name: 'Logout & Persistence',
      status: !hasToken && isLoginPage ? 'PASS' : 'FAIL',
      duration,
      details: {
        hasToken,
        isLoginPage,
        currentUrl
      }
    };
    
    if (result.status === 'PASS') {
      utils.log('✅ Logout passou', 'success');
    } else {
      utils.log(`❌ Logout falhou: token=${hasToken}, loginPage=${isLoginPage}`, 'error');
      testResults.errors.push(`Logout: token não removido ou não redirecionado`);
    }
    
    return result;
  } catch (error) {
    utils.log(`❌ Erro no logout: ${error.message}`, 'error');
    return {
      name: 'Logout & Persistence',
      status: 'FAIL',
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * CENÁRIO 8: Resiliência PIX (8x sequencial)
 */
async function scenario8_PixResilience(page) {
  utils.log('=== CENÁRIO 8: RESILIÊNCIA PIX (8x) ===', 'test');
  const startTime = Date.now();
  
  const results = [];
  const latencies = [];
  
  for (let i = 1; i <= 8; i++) {
    utils.log(`Criando PIX ${i}/8...`);
    const attemptStart = Date.now();
    
    try {
      // Navegar para depósito
      await page.goto(`${FRONTEND_URL}/deposito`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      // Preencher e criar
      const valorInput = await page.$('input[type="number"]');
      if (valorInput) {
        await valorInput.click({ clickCount: 3 });
        await valorInput.type('1.00');
      }
      
      let createButton = null;
      const buttonHandle = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(btn => 
          btn.textContent.includes('Criar') || 
          btn.textContent.includes('Gerar')
        );
      });
      if (buttonHandle && buttonHandle.asElement()) {
        createButton = buttonHandle.asElement();
      }
      
      if (createButton) {
        await createButton.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      const latency = Date.now() - attemptStart;
      latencies.push(latency);
      
      results.push({
        attempt: i,
        status: 'SUCCESS',
        latency
      });
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Interval entre tentativas
    } catch (error) {
      const latency = Date.now() - attemptStart;
      results.push({
        attempt: i,
        status: 'FAIL',
        latency,
        error: error.message
      });
    }
  }
  
  const successCount = results.filter(r => r.status === 'SUCCESS').length;
  const successRate = (successCount / 8) * 100;
  const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const p95Latency = latencies.length > 0 ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)] : 0;
  
  const duration = Date.now() - startTime;
  
  const result = {
    name: 'Resiliência PIX (8x)',
    status: successRate >= 75 ? 'PASS' : 'FAIL',
    duration,
    details: {
      successCount,
      successRate,
      avgLatency,
      p95Latency,
      attempts: results
    }
  };
  
  if (result.status === 'PASS') {
    utils.log(`✅ Resiliência PIX passou: ${successRate.toFixed(1)}% sucesso`, 'success');
  } else {
    utils.log(`❌ Resiliência PIX falhou: ${successRate.toFixed(1)}% sucesso`, 'error');
    testResults.errors.push(`Resiliência PIX: ${successRate.toFixed(1)}% sucesso`);
  }
  
  return result;
}

/**
 * CALCULAR SCORE
 */
function calculateScore() {
  let score = 100;
  
  // Penalizar por cenários falhados
  const failedScenarios = testResults.metrics.failedScenarios;
  score -= failedScenarios * 10;
  
  // Penalizar por erros
  score -= testResults.errors.length * 5;
  
  // Penalizar por warnings
  score -= testResults.warnings.length * 2;
  
  testResults.score = Math.max(0, score);
  
  // Decisão
  if (testResults.score >= 90 && failedScenarios === 0) {
    testResults.decision = 'APROVADO';
  } else if (testResults.score >= 80) {
    testResults.decision = 'APROVADO_COM_RESSALVAS';
  } else {
    testResults.decision = 'BLOQUEADO';
  }
}

/**
 * GERAR RELATÓRIOS
 */
async function generateReports() {
  await utils.ensureDir(REPORT_DIR);
  
  // E2E-REPORT.json
  await fs.writeFile(
    path.join(REPORT_DIR, 'E2E-REPORT.json'),
    JSON.stringify(testResults, null, 2)
  );
  
  // E2E-REPORT.md
  const markdownReport = generateMarkdownReport();
  await fs.writeFile(
    path.join(REPORT_DIR, 'E2E-REPORT.md'),
    markdownReport
  );
  
  utils.log('Relatórios gerados em docs/e2e-reports/', 'success');
}

function generateMarkdownReport() {
  const scenarios = Object.values(testResults.scenarios);
  const passed = scenarios.filter(s => s.status === 'PASS').length;
  const failed = scenarios.filter(s => s.status === 'FAIL').length;
  
  return `# 🧪 RELATÓRIO E2E FRONTEND - BROWSER AGENT
## Gol de Ouro Player - Data: ${new Date().toISOString().split('T')[0]}

---

## ✅ STATUS: **${testResults.decision}**

### **Score:** **${testResults.score}/100**

---

## 📊 RESUMO EXECUTIVO

- **Cenários executados:** ${testResults.metrics.totalScenarios}
- **Cenários passaram:** ${passed}
- **Cenários falharam:** ${failed}
- **Taxa de sucesso:** ${((passed / testResults.metrics.totalScenarios) * 100).toFixed(1)}%
- **Duração total:** ${(testResults.metrics.totalDuration / 1000).toFixed(2)}s

---

## 🧪 CENÁRIOS EXECUTADOS

${scenarios.map((s, idx) => `
### ${idx + 1}. ${s.name}
- **Status:** ${s.status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
- **Duração:** ${(s.duration / 1000).toFixed(2)}s
${s.error ? `- **Erro:** ${s.error}` : ''}
${s.details ? `- **Detalhes:** ${JSON.stringify(s.details, null, 2)}` : ''}
`).join('\n')}

---

## ❌ ERROS ENCONTRADOS

${testResults.errors.map((e, idx) => `${idx + 1}. ${e}`).join('\n') || 'Nenhum erro encontrado.'}

---

## ⚠️ WARNINGS

${testResults.warnings.map((w, idx) => `${idx + 1}. ${w}`).join('\n') || 'Nenhum warning encontrado.'}

---

## 📸 SCREENSHOTS

${testResults.screenshots.map((s, idx) => `${idx + 1}. ${s.name} (${s.viewport})`).join('\n') || 'Nenhum screenshot capturado.'}

---

## 🔧 CORREÇÕES RECOMENDADAS

${generateCorrections()}

---

**Data:** ${testResults.timestamp}
`;
}

function generateCorrections() {
  const corrections = [];
  
  if (testResults.errors.some(e => e.includes('Health-check'))) {
    corrections.push('- Verificar configuração de DNS e CORS no backend');
  }
  
  if (testResults.errors.some(e => e.includes('Registro') || e.includes('Login'))) {
    corrections.push('- Verificar endpoints de autenticação no backend');
    corrections.push('- Verificar salvamento de token no localStorage');
  }
  
  if (testResults.errors.some(e => e.includes('WebSocket'))) {
    corrections.push('- Verificar URL do WebSocket no frontend');
    corrections.push('- Verificar autenticação WebSocket no backend');
  }
  
  if (testResults.errors.some(e => e.includes('PIX'))) {
    corrections.push('- Verificar endpoint PIX V6 no backend');
    corrections.push('- Verificar renderização de QR Code no frontend');
  }
  
  return corrections.join('\n') || 'Nenhuma correção recomendada.';
}

/**
 * FUNÇÃO PRINCIPAL
 */
async function runE2ETests() {
  utils.log('🔥 INICIANDO TESTES E2E FRONTEND - BROWSER AGENT', 'test');
  utils.log(`Timestamp: ${testResults.timestamp}`, 'info');
  
  await utils.ensureDir(SCREENSHOTS_DIR);
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Configurar coletas
  await utils.collectConsoleLogs(page);
  await utils.collectNetworkLogs(page);
  
  try {
    // Executar cenários
    testResults.scenarios.scenario1 = await scenario1_HealthCheck(page);
    testResults.scenarios.scenario2 = await scenario2_Register(page);
    
    // Usar credenciais do registro para login
    if (testResults.testCredentials) {
      testResults.scenarios.scenario3 = await scenario3_Login(page, testResults.testCredentials);
    }
    
    testResults.scenarios.scenario4 = await scenario4_WebSocket(page);
    testResults.scenarios.scenario5 = await scenario5_CreatePix(page);
    testResults.scenarios.scenario6 = await scenario6_Game(page);
    testResults.scenarios.scenario7 = await scenario7_Logout(page);
    testResults.scenarios.scenario8 = await scenario8_PixResilience(page);
    
    // Calcular métricas
    const scenarios = Object.values(testResults.scenarios);
    testResults.metrics.totalScenarios = scenarios.length;
    testResults.metrics.passedScenarios = scenarios.filter(s => s.status === 'PASS').length;
    testResults.metrics.failedScenarios = scenarios.filter(s => s.status === 'FAIL').length;
    testResults.metrics.totalDuration = scenarios.reduce((sum, s) => sum + s.duration, 0);
    
    calculateScore();
    await generateReports();
    
    // Resumo final
    utils.log('\n=== RESUMO FINAL ===', 'test');
    utils.log(`Score: ${testResults.score}/100`, testResults.score >= 90 ? 'success' : testResults.score >= 80 ? 'warning' : 'error');
    utils.log(`Status: ${testResults.decision}`, testResults.decision === 'APROVADO' ? 'success' : testResults.decision === 'APROVADO_COM_RESSALVAS' ? 'warning' : 'error');
    utils.log(`Cenários: ${testResults.metrics.passedScenarios}/${testResults.metrics.totalScenarios} passaram`, testResults.metrics.failedScenarios === 0 ? 'success' : 'error');
    
  } catch (error) {
    utils.log(`❌ Erro fatal: ${error.message}`, 'error');
    testResults.error = error.message;
  } finally {
    await browser.close();
    await generateReports();
  }
  
  return testResults;
}

// Executar se chamado diretamente
if (require.main === module) {
  runE2ETests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { runE2ETests };

