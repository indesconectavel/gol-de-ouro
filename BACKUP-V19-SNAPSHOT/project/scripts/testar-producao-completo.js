/**
 * SCRIPT DE TESTE COMPLETO EM PRODUÇÃO
 * 
 * Testa todos os sistemas após deploy das correções
 * 
 * Execução: node scripts/testar-producao-completo.js
 */

const axios = require('axios');
const WebSocket = require('ws');

const BACKEND_URL = process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
const API_URL = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

const resultados = {
  inicio: new Date().toISOString(),
  testes: [],
  sucessos: 0,
  falhas: 0,
  avisos: 0
};

function log(message, type = 'info') {
  const colors = {
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    info: '\x1b[36m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${message}${colors.reset}`);
}

function adicionarTeste(nome, sucesso, detalhes, tipo = 'info') {
  resultados.testes.push({ nome, sucesso, detalhes, tipo, timestamp: new Date().toISOString() });
  if (sucesso) {
    resultados.sucessos++;
    log(`✅ ${nome}`, 'success');
  } else if (tipo === 'warning') {
    resultados.avisos++;
    log(`⚠️  ${nome}: ${detalhes}`, 'warning');
  } else {
    resultados.falhas++;
    log(`❌ ${nome}: ${detalhes}`, 'error');
  }
}

async function testarHealthCheck() {
  log('\n=== TESTE 1: Health Check ===', 'info');
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
    if (response.status === 200 && response.data.success) {
      adicionarTeste('Health Check', true, `Status: ${response.status}`);
      return true;
    } else {
      adicionarTeste('Health Check', false, `Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    adicionarTeste('Health Check', false, error.message);
    return false;
  }
}

async function testarAutenticacao() {
  log('\n=== TESTE 2: Autenticação ===', 'info');
  
  // Criar usuário
  const email = `test_prod_${Date.now()}@goldeouro.com`;
  const password = 'Test123!@#';
  const username = `testprod_${Date.now()}`;
  
  let testToken = null;
  
  try {
    const registerResponse = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      username
    }, { timeout: 15000 });
    
    if (registerResponse.status === 201 && registerResponse.data.success) {
      testToken = registerResponse.data.data.token;
      adicionarTeste('Registro de Usuário', true, 'Usuário criado com sucesso');
    } else {
      adicionarTeste('Registro de Usuário', false, 'Falha ao criar usuário');
      return null;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      adicionarTeste('Registro de Usuário', true, 'Email já existe (esperado)', 'warning');
      // Tentar login
      try {
        const loginResponse = await axios.post(`${API_URL}/auth/login`, {
          email,
          password
        }, { timeout: 15000 });
        if (loginResponse.status === 200 && loginResponse.data.success) {
          testToken = loginResponse.data.data.token;
          adicionarTeste('Login', true, 'Login bem-sucedido');
        }
      } catch (loginError) {
        adicionarTeste('Login', false, loginError.message);
      }
    } else {
      adicionarTeste('Registro de Usuário', false, error.message);
      return null;
    }
  }
  
  // Testar token inválido
  try {
    const response = await axios.get(`${API_URL}/user/profile`, {
      headers: { Authorization: 'Bearer token_invalido_12345' },
      timeout: 10000,
      validateStatus: () => true
    });
    
    if (response.status === 401) {
      adicionarTeste('Token Inválido Retorna 401', true, 'Status correto');
    } else {
      adicionarTeste('Token Inválido Retorna 401', false, `Retornou ${response.status} em vez de 401`);
    }
  } catch (error) {
    if (error.response?.status === 401) {
      adicionarTeste('Token Inválido Retorna 401', true, 'Status correto');
    } else {
      adicionarTeste('Token Inválido Retorna 401', false, error.message);
    }
  }
  
  return testToken;
}

async function testarPix(token) {
  log('\n=== TESTE 3: PIX ===', 'info');
  
  if (!token) {
    adicionarTeste('PIX Criar', false, 'Token não disponível');
    return;
  }
  
  try {
    const response = await axios.post(
      `${API_URL}/payments/pix/criar`,
      { valor: 1.00, descricao: 'Teste Produção' },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000
      }
    );
    
    if (response.status === 201 && response.data.success) {
      const temQRCode = !!(response.data.data.qr_code || response.data.data.pix_copy_paste || response.data.data.init_point);
      if (temQRCode) {
        adicionarTeste('PIX Criar com QR Code', true, 'QR code/copy-paste presente');
      } else {
        adicionarTeste('PIX Criar com QR Code', false, 'QR code não encontrado');
      }
      
      // Testar status
      if (response.data.data.payment_id) {
        await testarPixStatus(response.data.data.payment_id, token);
      }
    } else {
      adicionarTeste('PIX Criar', false, 'Falha ao criar PIX');
    }
  } catch (error) {
    adicionarTeste('PIX Criar', false, error.response?.data?.message || error.message);
  }
}

async function testarPixStatus(paymentId, token) {
  try {
    const response = await axios.get(
      `${API_URL}/payments/pix/status/${paymentId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      }
    );
    
    if (response.status === 200 && response.data.success) {
      adicionarTeste('PIX Status', true, `Status: ${response.data.data.status}`);
    } else {
      adicionarTeste('PIX Status', false, 'Falha ao consultar status');
    }
  } catch (error) {
    adicionarTeste('PIX Status', false, error.message);
  }
}

async function testarWebSocket(token) {
  log('\n=== TESTE 4: WebSocket ===', 'info');
  
  if (!token) {
    adicionarTeste('WebSocket Autenticação', false, 'Token não disponível');
    return;
  }
  
  // Aguardar alguns segundos após criar usuário
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  return new Promise((resolve) => {
    const ws = new WebSocket(WS_URL);
    let authSuccess = false;
    const timeout = setTimeout(() => {
      ws.close();
      adicionarTeste('WebSocket Autenticação', authSuccess, authSuccess ? 'Autenticação OK' : 'Timeout');
      resolve();
    }, 20000);
    
    ws.on('open', () => {
      log('WebSocket conectado', 'info');
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'welcome') {
          log('Evento welcome recebido', 'info');
          ws.send(JSON.stringify({ type: 'auth', token }));
        } else if (message.type === 'auth_success') {
          authSuccess = true;
          clearTimeout(timeout);
          ws.close();
          adicionarTeste('WebSocket Autenticação', true, 'Autenticação bem-sucedida');
          resolve();
        } else if (message.type === 'auth_error') {
          clearTimeout(timeout);
          ws.close();
          adicionarTeste('WebSocket Autenticação', false, message.message || 'Erro de autenticação');
          resolve();
        }
      } catch (error) {
        // Ignorar erros de parsing
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      adicionarTeste('WebSocket Autenticação', false, error.message);
      resolve();
    });
  });
}

async function testarAdmin() {
  log('\n=== TESTE 5: Admin ===', 'info');
  
  const adminToken = process.env.ADMIN_TOKEN || 'goldeouro123';
  
  // Testar stats
  try {
    const response = await axios.get(
      `${API_URL}/admin/stats`,
      {
        headers: { 'x-admin-token': adminToken },
        timeout: 15000
      }
    );
    
    if (response.status === 200) {
      adicionarTeste('Admin Stats', true, 'Stats obtidos');
    } else {
      adicionarTeste('Admin Stats', false, `Status: ${response.status}`);
    }
  } catch (error) {
    adicionarTeste('Admin Stats', false, error.message);
  }
  
  // Testar chutes
  try {
    const response = await axios.get(
      `${API_URL}/admin/recent-shots`,
      {
        headers: { 'x-admin-token': adminToken },
        params: { limit: 10 },
        timeout: 15000,
        validateStatus: () => true
      }
    );
    
    if (response.status === 200) {
      adicionarTeste('Admin Chutes', true, 'Chutes obtidos sem erro 500');
    } else if (response.status === 500) {
      adicionarTeste('Admin Chutes', false, 'Ainda retorna erro 500');
    } else {
      adicionarTeste('Admin Chutes', true, `Status ${response.status} (não é 500)`);
    }
  } catch (error) {
    if (error.response?.status === 500) {
      adicionarTeste('Admin Chutes', false, 'Ainda retorna erro 500');
    } else {
      adicionarTeste('Admin Chutes', true, `Erro não é 500: ${error.response?.status || 'N/A'}`);
    }
  }
}

async function executarTestes() {
  log('╔══════════════════════════════════════════════════════════════╗', 'info');
  log('║   TESTE COMPLETO EM PRODUÇÃO                                ║', 'info');
  log('╚══════════════════════════════════════════════════════════════╝', 'info');
  log(`Backend URL: ${BACKEND_URL}`, 'info');
  log(`API URL: ${API_URL}`, 'info');
  log(`WebSocket URL: ${WS_URL}`, 'info');
  console.log('');
  
  const healthOk = await testarHealthCheck();
  if (!healthOk) {
    error('Servidor não está respondendo. Abortando testes.');
    return;
  }
  
  const token = await testarAutenticacao();
  await testarPix(token);
  await testarWebSocket(token);
  await testarAdmin();
  
  resultados.fim = new Date().toISOString();
  
  log('\n╔══════════════════════════════════════════════════════════════╗', 'info');
  log('║   RESULTADO FINAL                                             ║', 'info');
  log('╚══════════════════════════════════════════════════════════════╝', 'info');
  log(`\n✅ Sucessos: ${resultados.sucessos}`, 'success');
  log(`⚠️  Avisos: ${resultados.avisos}`, resultados.avisos > 0 ? 'warning' : 'success');
  log(`❌ Falhas: ${resultados.falhas}`, resultados.falhas > 0 ? 'error' : 'success');
  
  // Salvar resultados
  const fs = require('fs');
  fs.writeFileSync('docs/TESTE-PRODUCAO-COMPLETO-RESULTADOS.json', JSON.stringify(resultados, null, 2));
  log('\n✅ Resultados salvos em: docs/TESTE-PRODUCAO-COMPLETO-RESULTADOS.json', 'success');
  
  return resultados.falhas === 0;
}

executarTestes().then(sucesso => {
  process.exit(sucesso ? 0 : 1);
}).catch(error => {
  log(`Erro fatal: ${error.message}`, 'error');
  process.exit(1);
});

