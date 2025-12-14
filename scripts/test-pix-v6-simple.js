const axios = require('axios');

async function testPixV6() {
  try {
    // Criar usuário
    const registerRes = await axios.post('https://goldeouro-backend-v2.fly.dev/api/auth/register', {
      email: `test_${Date.now()}@test.com`,
      password: 'Test123456!',
      username: `test_${Date.now()}`
    });

    const token = registerRes.data?.data?.token || registerRes.data?.token;
    console.log('✅ Usuário criado, token:', token?.substring(0, 20) + '...');

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Criar PIX
    try {
      const pixRes = await axios.post(
        'https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar',
        { valor: 1.00 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('✅ PIX criado:', JSON.stringify(pixRes.data, null, 2));
    } catch (pixError) {
      console.error('❌ Erro ao criar PIX:');
      console.error('Status:', pixError.response?.status);
      console.error('Data:', JSON.stringify(pixError.response?.data, null, 2));
      console.error('Message:', pixError.message);
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

testPixV6();

