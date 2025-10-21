// TESTES AUTOMATIZADOS - GOL DE OURO v1.2.0
// ===========================================
// Data: 21/10/2025
// Status: TESTES COMPLETOS PARA PRODUÇÃO REAL
// Versão: v1.2.0-final-production
// GPT-4o Auto-Fix: Testes automatizados completos

const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Importar o servidor corrigido
const app = require('../server-fly-corrected');

// =====================================================
// CONFIGURAÇÃO DOS TESTES
// =====================================================

const BASE_URL = process.env.BACKEND_URL || 'https://goldeouro-backend.fly.dev';
const JWT_SECRET = process.env.JWT_SECRET || 'goldeouro-secret-key-2025';

// Dados de teste
const testUser = {
  email: 'test@goldeouro.com',
  password: 'test123456',
  username: 'testuser'
};

let authToken = '';
let userId = '';

// =====================================================
// UTILITÁRIOS DE TESTE
// =====================================================

const generateTestToken = (userId = 'test-user-id') => {
  return jwt.sign(
    { 
      userId: userId, 
      email: testUser.email,
      username: testUser.username
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// =====================================================
// TESTES DE AUTENTICAÇÃO
// =====================================================

describe('🔐 TESTES DE AUTENTICAÇÃO', () => {
  
  test('POST /api/auth/register - Registro de usuário válido', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUser.email,
        password: testUser.password,
        username: testUser.username
      })
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(testUser.email);
    
    authToken = response.body.token;
    userId = response.body.user.id;
  });
  
  test('POST /api/auth/register - Email duplicado', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: testUser.email,
        password: testUser.password,
        username: testUser.username
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Email já cadastrado');
  });
  
  test('POST /api/auth/login - Login válido', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe(testUser.email);
  });
  
  test('POST /api/auth/login - Credenciais inválidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'senhaerrada'
      })
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Credenciais inválidas');
  });
  
  test('GET /api/user/profile - Perfil com token válido', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe(testUser.email);
    expect(response.body.data.username).toBe(testUser.username);
  });
  
  test('GET /api/user/profile - Sem token', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Token de acesso requerido');
  });
  
  test('GET /api/user/profile - Token inválido', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Authorization', 'Bearer token-invalido')
      .expect(403);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Token inválido');
  });
});

// =====================================================
// TESTES DO SISTEMA DE JOGO
// =====================================================

describe('⚽ TESTES DO SISTEMA DE JOGO', () => {
  
  test('POST /api/games/shoot - Chute válido', async () => {
    const response = await request(app)
      .post('/api/games/shoot')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        direction: 'C',
        amount: 1
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.direction).toBe('C');
    expect(response.body.data.amount).toBe(1);
    expect(['goal', 'miss']).toContain(response.body.data.result);
  });
  
  test('POST /api/games/shoot - Direção inválida', async () => {
    const response = await request(app)
      .post('/api/games/shoot')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        direction: 'INVALID',
        amount: 1
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Dados inválidos');
  });
  
  test('POST /api/games/shoot - Valor de aposta inválido', async () => {
    const response = await request(app)
      .post('/api/games/shoot')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        direction: 'C',
        amount: 15
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Valor de aposta inválido');
  });
  
  test('POST /api/games/shoot - Saldo insuficiente', async () => {
    const response = await request(app)
      .post('/api/games/shoot')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        direction: 'C',
        amount: 1000
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Saldo insuficiente');
  });
  
  test('POST /api/games/shoot - Sem autenticação', async () => {
    const response = await request(app)
      .post('/api/games/shoot')
      .send({
        direction: 'C',
        amount: 1
      })
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Token de acesso requerido');
  });
});

// =====================================================
// TESTES DO SISTEMA DE PAGAMENTOS PIX
// =====================================================

describe('💳 TESTES DO SISTEMA PIX', () => {
  
  test('POST /api/payments/pix/criar - Criar PIX válido', async () => {
    const response = await request(app)
      .post('/api/payments/pix/criar')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 10
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.amount).toBe(10);
    expect(response.body.data.status).toBe('pending');
  });
  
  test('POST /api/payments/pix/criar - Valor inválido', async () => {
    const response = await request(app)
      .post('/api/payments/pix/criar')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 0
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Valor inválido');
  });
  
  test('POST /api/payments/pix/criar - Valor muito alto', async () => {
    const response = await request(app)
      .post('/api/payments/pix/criar')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        amount: 2000
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Valor máximo');
  });
  
  test('POST /api/payments/pix/criar - Sem autenticação', async () => {
    const response = await request(app)
      .post('/api/payments/pix/criar')
      .send({
        amount: 10
      })
      .expect(401);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Token de acesso requerido');
  });
});

// =====================================================
// TESTES DE WEBHOOK PIX
// =====================================================

describe('📨 TESTES DE WEBHOOK PIX', () => {
  
  test('POST /api/payments/webhook - Webhook válido', async () => {
    const webhookData = {
      type: 'payment',
      data: {
        id: 'test-payment-id'
      }
    };
    
    const response = await request(app)
      .post('/api/payments/webhook')
      .send(webhookData)
      .expect(200);
    
    expect(response.body.received).toBe(true);
  });
  
  test('POST /api/payments/webhook - Dados inválidos', async () => {
    const response = await request(app)
      .post('/api/payments/webhook')
      .send({})
      .expect(200);
    
    expect(response.body.received).toBe(true);
  });
});

// =====================================================
// TESTES DE RATE LIMITING
// =====================================================

describe('🚦 TESTES DE RATE LIMITING', () => {
  
  test('Rate limiting - Muitas tentativas de login', async () => {
    // Fazer 15 tentativas de login (limite é 10)
    for (let i = 0; i < 15; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@email.com',
          password: 'wrongpassword'
        });
    }
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@email.com',
        password: 'wrongpassword'
      })
      .expect(429);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Muitas tentativas');
  });
  
  test('Rate limiting - Muitos chutes', async () => {
    // Fazer 35 chutes (limite é 30 por minuto)
    for (let i = 0; i < 35; i++) {
      await request(app)
        .post('/api/games/shoot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          direction: 'C',
          amount: 1
        });
    }
    
    const response = await request(app)
      .post('/api/games/shoot')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        direction: 'C',
        amount: 1
      })
      .expect(429);
    
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Muitos chutes');
  });
});

// =====================================================
// TESTES DE SEGURANÇA
// =====================================================

describe('🔒 TESTES DE SEGURANÇA', () => {
  
  test('CORS - Origin não permitida', async () => {
    const response = await request(app)
      .get('/api/user/profile')
      .set('Origin', 'https://malicious-site.com')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(403);
    
    expect(response.body.message).toContain('CORS');
  });
  
  test('XSS - Tentativa de script injection', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: '<script>alert("xss")</script>',
        password: 'test123'
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });
  
  test('SQL Injection - Tentativa de injeção', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: "admin'; DROP TABLE usuarios; --",
        password: 'test123'
      })
      .expect(400);
    
    expect(response.body.success).toBe(false);
  });
});

// =====================================================
// TESTES DE PERFORMANCE
// =====================================================

describe('⚡ TESTES DE PERFORMANCE', () => {
  
  test('Tempo de resposta - Login', async () => {
    const startTime = Date.now();
    
    await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
      .expect(200);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(2000); // Menos de 2 segundos
  });
  
  test('Tempo de resposta - Chute', async () => {
    const startTime = Date.now();
    
    await request(app)
      .post('/api/games/shoot')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        direction: 'C',
        amount: 1
      })
      .expect(200);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(1000); // Menos de 1 segundo
  });
  
  test('Tempo de resposta - Perfil', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(500); // Menos de 500ms
  });
});

// =====================================================
// TESTES DE INTEGRAÇÃO
// =====================================================

describe('🔗 TESTES DE INTEGRAÇÃO', () => {
  
  test('Fluxo completo - Registro → Login → Jogo → PIX', async () => {
    // 1. Registrar usuário
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'integration@goldeouro.com',
        password: 'integration123',
        username: 'integrationuser'
      })
      .expect(201);
    
    const token = registerResponse.body.token;
    
    // 2. Fazer login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'integration@goldeouro.com',
        password: 'integration123'
      })
      .expect(200);
    
    expect(loginResponse.body.success).toBe(true);
    
    // 3. Fazer chute
    const shootResponse = await request(app)
      .post('/api/games/shoot')
      .set('Authorization', `Bearer ${token}`)
      .send({
        direction: 'C',
        amount: 1
      })
      .expect(200);
    
    expect(shootResponse.body.success).toBe(true);
    
    // 4. Criar PIX
    const pixResponse = await request(app)
      .post('/api/payments/pix/criar')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 10
      })
      .expect(200);
    
    expect(pixResponse.body.success).toBe(true);
  });
});

// =====================================================
// TESTES DE HEALTH CHECK
// =====================================================

describe('🏥 TESTES DE HEALTH CHECK', () => {
  
  test('GET /health - Health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body.version).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
  });
  
  test('GET /api/metrics - Métricas globais', async () => {
    const response = await request(app)
      .get('/api/metrics')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  });
});

// =====================================================
// CONFIGURAÇÃO DO JEST
// =====================================================

beforeAll(async () => {
  console.log('🚀 Iniciando testes automatizados...');
});

afterAll(async () => {
  console.log('✅ Testes automatizados concluídos!');
});

// =====================================================
// TESTES AUTOMATIZADOS v1.2.0 - PRODUÇÃO REAL 100%
// =====================================================
