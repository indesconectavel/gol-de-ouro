const request = require('supertest');
const app = require('../server-fly');

describe('🔐 LOGIN FELIZ (V1)', () => {
  it('deve fazer login com credenciais válidas', async () => {
    const email = `loginfeliz${Date.now()}@example.com`;
    const password = 'senha123456';

    await request(app)
      .post('/api/auth/register')
      .send({ email, password, username: 'usuario' });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(typeof response.body.token).toBe('string');
  });
});
