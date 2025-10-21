// Testes Automatizados - Gol de Ouro v2.0
// Backend Tests

const request = require('supertest');
const app = require('../src/app');
const { supabase } = require('../src/config/supabase');

describe('Authentication API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
    });

    it('should reject registration with invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject registration with weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123',
        username: 'testuser'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
    });

    it('should reject login with invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Game API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Setup test user and get auth token
    const userData = {
      email: 'gametest@example.com',
      password: 'password123',
      username: 'gametest'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe('POST /api/games/fila/entrar', () => {
    it('should allow user to join game queue', async () => {
      const response = await request(app)
        .post('/api/games/fila/entrar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ user_id: userId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.position).toBeDefined();
    });
  });

  describe('POST /api/games/shoot', () => {
    it('should process game shot correctly', async () => {
      const shotData = {
        direction: 'TL',
        amount: 10
      };

      const response = await request(app)
        .post('/api/games/shoot')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shotData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.direction).toBe(shotData.direction);
      expect(response.body.amount).toBe(shotData.amount);
    });

    it('should reject shot with invalid direction', async () => {
      const shotData = {
        direction: 'INVALID',
        amount: 10
      };

      const response = await request(app)
        .post('/api/games/shoot')
        .set('Authorization', `Bearer ${authToken}`)
        .send(shotData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Payment API', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    // Setup test user and get auth token
    const userData = {
      email: 'paymenttest@example.com',
      password: 'password123',
      username: 'paymenttest'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  describe('POST /api/payments/pix/criar', () => {
    it('should create PIX payment successfully', async () => {
      const paymentData = {
        amount: 50,
        description: 'Test payment'
      };

      const response = await request(app)
        .post('/api/payments/pix/criar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.amount).toBe(paymentData.amount);
    });

    it('should reject payment with invalid amount', async () => {
      const paymentData = {
        amount: -10,
        description: 'Invalid payment'
      };

      const response = await request(app)
        .post('/api/payments/pix/criar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});

describe('Health Check', () => {
  it('should return health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.ok).toBe(true);
    expect(response.body.message).toBeDefined();
  });
});
