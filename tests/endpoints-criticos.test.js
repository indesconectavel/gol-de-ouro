/**
 * 🧪 TESTES AUTOMATIZADOS PARA ENDPOINTS CRÍTICOS
 * 
 * Este arquivo contém testes automatizados para todos os endpoints críticos da API
 */

const request = require('supertest');
const app = require('../server-fly');

// Mock de autenticação
let authToken = null;
let testUserId = null;

describe('🔐 ENDPOINTS DE AUTENTICAÇÃO', () => {
  
  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: `teste${Date.now()}@example.com`,
          password: 'senha123456',
          username: `teste${Date.now()}`
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      
      authToken = response.body.token;
      testUserId = response.body.user.id;
    });
    
    it('deve rejeitar email duplicado', async () => {
      const email = `duplicado${Date.now()}@example.com`;
      
      // Primeiro registro
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'senha123456',
          username: 'usuario1'
        })
        .expect(201);
      
      // Tentativa de duplicar
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'senha123456',
          username: 'usuario2'
        })
        .expect(400);
    });
    
    it('deve validar formato de email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'email-invalido',
          password: 'senha123456',
          username: 'usuario'
        })
        .expect(400);
    });
    
    it('deve validar senha mínima', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'teste@example.com',
          password: '123',
          username: 'usuario'
        })
        .expect(400);
    });
  });
  
  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const email = `login${Date.now()}@example.com`;
      const password = 'senha123456';
      
      // Registrar primeiro
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password,
          username: 'usuario'
        });
      
      // Fazer login
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      
      authToken = response.body.token;
    });
    
    it('deve rejeitar credenciais inválidas', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'naoexiste@example.com',
          password: 'senha123456'
        })
        .expect(401);
    });
    
    it('deve rejeitar senha incorreta', async () => {
      const email = `senhaerrada${Date.now()}@example.com`;
      
      // Registrar primeiro
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'senha123456',
          username: 'usuario'
        });
      
      // Tentar login com senha errada
      await request(app)
        .post('/api/auth/login')
        .send({
          email,
          password: 'senhaerrada'
        })
        .expect(401);
    });
  });
  
  describe('POST /api/auth/forgot-password', () => {
    it('deve enviar email de recuperação', async () => {
      const email = `forgot${Date.now()}@example.com`;
      
      // Registrar primeiro
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'senha123456',
          username: 'usuario'
        });
      
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
    });
    
    it('deve validar formato de email', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'email-invalido' })
        .expect(400);
    });
  });
});

describe('💰 ENDPOINTS DE PAGAMENTOS', () => {
  
  beforeEach(async () => {
    // Garantir autenticação antes de cada teste
    if (!authToken) {
      const email = `pagamento${Date.now()}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'senha123456',
          username: 'usuario'
        });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'senha123456' });
      
      authToken = loginResponse.body.token;
    }
  });
  
  describe('POST /api/payments/pix/criar', () => {
    it('deve criar pagamento PIX', async () => {
      const response = await request(app)
        .post('/api/payments/pix/criar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 10.00 })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('payment');
      expect(response.body.payment).toHaveProperty('qr_code');
      expect(response.body.payment).toHaveProperty('qr_code_base64');
    });
    
    it('deve validar valor mínimo', async () => {
      await request(app)
        .post('/api/payments/pix/criar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 0.50 })
        .expect(400);
    });
    
    it('deve requerer autenticação', async () => {
      await request(app)
        .post('/api/payments/pix/criar')
        .send({ amount: 10.00 })
        .expect(401);
    });
  });
  
  describe('GET /api/payments/pix/usuario', () => {
    it('deve listar pagamentos do usuário', async () => {
      const response = await request(app)
        .get('/api/payments/pix/usuario')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('payments');
      expect(Array.isArray(response.body.payments)).toBe(true);
    });
    
    it('deve requerer autenticação', async () => {
      await request(app)
        .get('/api/payments/pix/usuario')
        .expect(401);
    });
  });
});

describe('🎮 ENDPOINTS DE JOGO', () => {
  
  beforeEach(async () => {
    // Garantir autenticação antes de cada teste
    if (!authToken) {
      const email = `jogo${Date.now()}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'senha123456',
          username: 'usuario'
        });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'senha123456' });
      
      authToken = loginResponse.body.token;
    }
  });
  
  describe('POST /api/games/shoot', () => {
    it('deve executar chute válido', async () => {
      const response = await request(app)
        .post('/api/games/shoot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          direction: 'TL',
          amount: 1.00
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('result');
    });
    
    it('deve validar valor de aposta', async () => {
      await request(app)
        .post('/api/games/shoot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          direction: 'TL',
          amount: 0.50
        })
        .expect(400);
    });
    
    it('deve validar direção de chute', async () => {
      await request(app)
        .post('/api/games/shoot')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          direction: 'INVALID',
          amount: 1.00
        })
        .expect(400);
    });
    
    it('deve requerer autenticação', async () => {
      await request(app)
        .post('/api/games/shoot')
        .send({
          direction: 'TL',
          amount: 1.00
        })
        .expect(401);
    });
  });
});

describe('💸 ENDPOINTS DE SAQUES', () => {
  
  beforeEach(async () => {
    // Garantir autenticação antes de cada teste
    if (!authToken) {
      const email = `saque${Date.now()}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'senha123456',
          username: 'usuario'
        });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'senha123456' });
      
      authToken = loginResponse.body.token;
    }
  });
  
  describe('POST /api/withdraw/request', () => {
    it('deve solicitar saque válido', async () => {
      const response = await request(app)
        .post('/api/withdraw/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          valor: 5.00,
          chave_pix: '12345678900',
          tipo_chave: 'CPF'
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('withdrawal');
    });
    
    it('deve validar valor mínimo', async () => {
      await request(app)
        .post('/api/withdraw/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          valor: 4.00,
          chave_pix: '12345678900',
          tipo_chave: 'CPF'
        })
        .expect(400);
    });
    
    it('deve validar chave PIX', async () => {
      await request(app)
        .post('/api/withdraw/request')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          valor: 5.00,
          chave_pix: '',
          tipo_chave: 'CPF'
        })
        .expect(400);
    });
    
    it('deve requerer autenticação', async () => {
      await request(app)
        .post('/api/withdraw/request')
        .send({
          valor: 5.00,
          chave_pix: '12345678900',
          tipo_chave: 'CPF'
        })
        .expect(401);
    });
  });
  
  describe('GET /api/withdraw/history', () => {
    it('deve listar histórico de saques', async () => {
      const response = await request(app)
        .get('/api/withdraw/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('withdrawals');
      expect(Array.isArray(response.body.withdrawals)).toBe(true);
    });
    
    it('deve requerer autenticação', async () => {
      await request(app)
        .get('/api/withdraw/history')
        .expect(401);
    });
  });
});

describe('👤 ENDPOINTS DE PERFIL', () => {
  
  beforeEach(async () => {
    // Garantir autenticação antes de cada teste
    if (!authToken) {
      const email = `perfil${Date.now()}@example.com`;
      await request(app)
        .post('/api/auth/register')
        .send({
          email,
          password: 'senha123456',
          username: 'usuario'
        });
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'senha123456' });
      
      authToken = loginResponse.body.token;
    }
  });
  
  describe('GET /api/user/profile', () => {
    it('deve retornar perfil do usuário', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email');
    });
    
    it('deve requerer autenticação', async () => {
      await request(app)
        .get('/api/user/profile')
        .expect(401);
    });
  });
  
  describe('PUT /api/user/profile', () => {
    it('deve atualizar perfil do usuário', async () => {
      const response = await request(app)
        .put('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          nome: 'Nome Atualizado',
          email: `atualizado${Date.now()}@example.com`
        })
        .expect(200);
      
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
    });
    
    it('deve requerer autenticação', async () => {
      await request(app)
        .put('/api/user/profile')
        .send({
          nome: 'Nome',
          email: 'email@example.com'
        })
        .expect(401);
    });
  });
});

describe('🏥 ENDPOINTS DE HEALTH CHECK', () => {
  
  describe('GET /health', () => {
    it('deve retornar status do sistema', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });
  });
  
  describe('GET /api/metrics', () => {
    it('deve retornar métricas do sistema', async () => {
      const response = await request(app)
        .get('/api/metrics')
        .expect(200);
      
      expect(response.body).toHaveProperty('sistemaOnline', true);
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});

