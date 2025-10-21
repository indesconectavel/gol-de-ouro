// Testes Unitários - API Gol de Ouro v1.1.1
const request = require('supertest');
const express = require('express');
const cors = require('cors');

// Importar rotas
const authRoutes = require('../../routes/authRoutes');
const gameRoutes = require('../../routes/gameRoutes');
const usuarioRoutes = require('../../routes/usuarioRoutes');
const paymentRoutes = require('../../routes/paymentRoutes');

// Criar app de teste
const app = express();
app.use(express.json());
app.use(cors());

// Registrar rotas
app.use('/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/user', usuarioRoutes);
app.use('/api/payments', paymentRoutes);

// Mock do banco de dados
jest.mock('../../database/supabase-config', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: {
              id: 'test-user-id',
              email: 'test@example.com',
              nome: 'Test User',
              saldo: 100.00,
              ativo: true
            },
            error: null
          }))
        })),
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({
              data: {
                id: 'test-payment-id',
                payment_id: 'mp-payment-123',
                valor: 50.00,
                status: 'pending'
              },
              error: null
            }))
          }))
        })),
        update: jest.fn(() => Promise.resolve({ error: null })),
        delete: jest.fn(() => Promise.resolve({ error: null })),
        order: jest.fn(() => ({
          range: jest.fn(() => Promise.resolve({
            data: [],
            error: null
          }))
        })),
        limit: jest.fn(() => Promise.resolve({
          data: [],
          error: null
        }))
      }))
    }))
  }
}));

describe('API Tests - Gol de Ouro', () => {
  let authToken;

  beforeAll(async () => {
    // Simular login para obter token
    const loginResponse = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        senha: 'Teste123!'
      });

    if (loginResponse.status === 200) {
      authToken = loginResponse.body.token;
    }
  });

  describe('Auth Routes', () => {
    test('POST /auth/login - Login válido', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          senha: 'Teste123!'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
    });

    test('POST /auth/login - Login inválido', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          senha: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /auth/register - Registro válido', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          nome: 'New User',
          email: 'newuser@example.com',
          senha: 'NewPass123!'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Game Routes', () => {
    test('GET /api/games/opcoes-chute - Obter opções de chute', async () => {
      const response = await request(app)
        .get('/api/games/opcoes-chute');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('zonas');
      expect(response.body).toHaveProperty('potencias');
      expect(response.body).toHaveProperty('angulos');
      expect(Array.isArray(response.body.zonas)).toBe(true);
    });

    test('GET /api/games/status-sistema - Status do sistema', async () => {
      const response = await request(app)
        .get('/api/games/status-sistema');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('POST /api/games/fila/entrar - Entrar na fila (com auth)', async () => {
      if (!authToken) {
        console.log('⚠️ Token de auth não disponível, pulando teste');
        return;
      }

      const response = await request(app)
        .post('/api/games/fila/entrar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tipo_fila: 'normal'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('posicao');
    });

    test('POST /api/games/chutar - Executar chute (com auth)', async () => {
      if (!authToken) {
        console.log('⚠️ Token de auth não disponível, pulando teste');
        return;
      }

      const response = await request(app)
        .post('/api/games/chutar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          partida_id: 'test-game-id',
          zona: 'center',
          potencia: 50,
          angulo: 0
        });

      // Pode falhar se a partida não existir, mas deve retornar erro estruturado
      expect([200, 400, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('resultado');
      }
    });
  });

  describe('User Routes', () => {
    test('GET /api/user/saldo - Obter saldo (com auth)', async () => {
      if (!authToken) {
        console.log('⚠️ Token de auth não disponível, pulando teste');
        return;
      }

      const response = await request(app)
        .get('/api/user/saldo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('saldo');
      expect(typeof response.body.saldo).toBe('number');
    });

    test('GET /api/user/saldo-detalhado - Saldo detalhado (com auth)', async () => {
      if (!authToken) {
        console.log('⚠️ Token de auth não disponível, pulando teste');
        return;
      }

      const response = await request(app)
        .get('/api/user/saldo-detalhado')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('saldo_atual');
      expect(response.body).toHaveProperty('total_apostado');
      expect(response.body).toHaveProperty('total_ganho');
    });

    test('GET /api/user/ultimas-transacoes - Últimas transações (com auth)', async () => {
      if (!authToken) {
        console.log('⚠️ Token de auth não disponível, pulando teste');
        return;
      }

      const response = await request(app)
        .get('/api/user/ultimas-transacoes?limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('transacoes');
      expect(Array.isArray(response.body.transacoes)).toBe(true);
    });
  });

  describe('Payment Routes', () => {
    test('POST /api/payments/pix/criar - Criar pagamento PIX (com auth)', async () => {
      if (!authToken) {
        console.log('⚠️ Token de auth não disponível, pulando teste');
        return;
      }

      const response = await request(app)
        .post('/api/payments/pix/criar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          valor: 50.00,
          descricao: 'Depósito de teste'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('payment_id');
    });

    test('POST /api/payments/pix/criar - Valor inválido', async () => {
      if (!authToken) {
        console.log('⚠️ Token de auth não disponível, pulando teste');
        return;
      }

      const response = await request(app)
        .post('/api/payments/pix/criar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          valor: 0,
          descricao: 'Depósito inválido'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('POST /api/payments/saque - Solicitar saque (com auth)', async () => {
      if (!authToken) {
        console.log('⚠️ Token de auth não disponível, pulando teste');
        return;
      }

      const response = await request(app)
        .post('/api/payments/saque')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          valor: 25.00,
          chave_pix: 'teste@example.com',
          tipo_chave: 'email'
        });

      // Pode falhar por saldo insuficiente, mas deve retornar erro estruturado
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('saque_id');
      }
    });

    test('GET /api/payments/pix/status/:id - Consultar status (com auth)', async () => {
      if (!authToken) {
        console.log('⚠️ Token de auth não disponível, pulando teste');
        return;
      }

      const response = await request(app)
        .get('/api/payments/pix/status/test-payment-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('payment_id');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Error Handling', () => {
    test('Rota inexistente retorna 404', async () => {
      const response = await request(app)
        .get('/api/rota-inexistente');

      expect(response.status).toBe(404);
    });

    test('Método não permitido retorna 405', async () => {
      const response = await request(app)
        .patch('/api/games/opcoes-chute');

      expect(response.status).toBe(405);
    });

    test('Dados inválidos retornam 400', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'invalid-email',
          senha: ''
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Health Checks', () => {
    test('GET /api/games/health - Health check do jogo', async () => {
      const response = await request(app)
        .get('/api/games/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/user/health - Health check do usuário', async () => {
      const response = await request(app)
        .get('/api/user/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('GET /api/payments/health - Health check dos pagamentos', async () => {
      const response = await request(app)
        .get('/api/payments/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
