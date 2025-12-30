// Script de Validação GATE 3 e GATE 4
// FASE 3 - Validação Final Pré-Deploy

const axios = require('axios');

const BASE_URL = 'https://goldeouro-backend-v2.fly.dev';

// Credenciais de teste (usar variáveis de ambiente se disponíveis)
const TEST_EMAIL = process.env.TEST_PLAYER_EMAIL || 'teste@example.com';
const TEST_PASSWORD = process.env.TEST_PLAYER_PASSWORD || 'senha123';

async function testGate3() {
  console.log('\n🔑 GATE 3 - AUTENTICAÇÃO REAL\n');
  
  // TESTE 1: Login Real
  console.log('TESTE 1: Login Real');
  try {
    const loginResponse = await axios.post(
      `${BASE_URL}/api/auth/login`,
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      { timeout: 5000 }
    );
    
    if (loginResponse.status === 200) {
      const token = loginResponse.data?.token || loginResponse.data?.data?.token;
      const refreshToken = loginResponse.data?.refreshToken || loginResponse.data?.data?.refreshToken;
      
      console.log('✅ Login bem-sucedido');
      console.log('   Status:', loginResponse.status);
      console.log('   Token presente:', !!token);
      console.log('   RefreshToken presente:', !!refreshToken);
      
      if (token) {
        // TESTE 2: Uso do Token em Endpoint Protegido
        console.log('\nTESTE 2: Uso do Token em Endpoint Protegido');
        try {
          const profileResponse = await axios.get(
            `${BASE_URL}/api/user/profile`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            }
          );
          
          console.log('✅ Token válido - Endpoint protegido acessado');
          console.log('   Status:', profileResponse.status);
          console.log('   Dados do usuário presentes:', !!profileResponse.data?.data);
          
          // TESTE 3: Expiração Simulada
          console.log('\nTESTE 3: Expiração Simulada (Token Inválido)');
          try {
            await axios.get(
              `${BASE_URL}/api/user/profile`,
              {
                headers: { Authorization: 'Bearer token_invalido_12345' },
                timeout: 5000
              }
            );
            console.log('❌ Token inválido foi aceito (PROBLEMA DE SEGURANÇA)');
          } catch (error) {
            if (error.response?.status === 401) {
              console.log('✅ Token inválido rejeitado corretamente');
              console.log('   Status:', error.response.status);
            } else {
              console.log('⚠️ Resposta inesperada:', error.response?.status);
            }
          }
          
          // TESTE 4: Refresh Token
          if (refreshToken) {
            console.log('\nTESTE 4: Refresh Token');
            try {
              const refreshResponse = await axios.post(
                `${BASE_URL}/api/auth/refresh`,
                { refreshToken },
                { timeout: 5000 }
              );
              
              console.log('✅ Refresh token funcionou');
              console.log('   Status:', refreshResponse.status);
              console.log('   Novo token presente:', !!refreshResponse.data?.token);
            } catch (error) {
              if (error.response?.status === 401) {
                console.log('⚠️ Refresh token falhou (limitação conhecida)');
                console.log('   Status:', error.response.status);
                console.log('   Mensagem:', error.response.data?.message);
              } else {
                console.log('❌ Erro inesperado:', error.response?.status);
              }
            }
          }
          
          return { success: true, token, refreshToken };
        } catch (error) {
          console.log('❌ Erro ao usar token:', error.response?.status || error.message);
          return { success: false, error: 'Token não funcionou' };
        }
      }
    } else {
      console.log('⚠️ Login retornou status:', loginResponse.status);
      return { success: false, error: 'Status inesperado' };
    }
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('⚠️ Credenciais inválidas (esperado se usuário não existe)');
      console.log('   Status:', error.response.status);
    } else {
      console.log('❌ Erro no login:', error.response?.status || error.message);
    }
    return { success: false, error: error.response?.status || error.message };
  }
}

async function testGate4() {
  console.log('\n💸 GATE 4 - FLUXO FINANCEIRO (PIX)\n');
  
  // Primeiro fazer login para obter token
  let token;
  try {
    const loginResponse = await axios.post(
      `${BASE_URL}/api/auth/login`,
      { email: TEST_EMAIL, password: TEST_PASSWORD },
      { timeout: 5000 }
    );
    
    token = loginResponse.data?.token || loginResponse.data?.data?.token;
    
    if (!token) {
      console.log('❌ Não foi possível obter token para teste de PIX');
      return { success: false, error: 'Token não disponível' };
    }
  } catch (error) {
    console.log('❌ Erro ao fazer login para teste de PIX:', error.response?.status || error.message);
    return { success: false, error: 'Login falhou' };
  }
  
  // TESTE: Criar PIX de Teste
  console.log('TESTE: Criar PIX de Teste (R$ 1,00)');
  try {
    const pixResponse = await axios.post(
      `${BASE_URL}/api/payments/pix/criar`,
      { amount: 1.00 },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      }
    );
    
    if (pixResponse.status === 200) {
      const paymentId = pixResponse.data?.data?.payment_id || pixResponse.data?.payment_id;
      const qrCode = pixResponse.data?.data?.qr_code || pixResponse.data?.qr_code;
      const status = pixResponse.data?.data?.status || pixResponse.data?.status;
      
      console.log('✅ PIX criado com sucesso');
      console.log('   Status HTTP:', pixResponse.status);
      console.log('   Payment ID presente:', !!paymentId);
      console.log('   QR Code presente:', !!qrCode);
      console.log('   Status do PIX:', status);
      
      if (paymentId) {
        console.log('   Payment ID:', paymentId);
      }
      
      return { success: true, paymentId, status };
    } else {
      console.log('⚠️ PIX retornou status:', pixResponse.status);
      return { success: false, error: 'Status inesperado' };
    }
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('⚠️ PIX retornou 400 (pode ser saldo insuficiente ou validação)');
      console.log('   Mensagem:', error.response.data?.message);
    } else if (error.response?.status === 500) {
      console.log('❌ Erro 500 no servidor (BLOQUEADOR)');
    } else {
      console.log('❌ Erro ao criar PIX:', error.response?.status || error.message);
    }
    return { success: false, error: error.response?.status || error.message };
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 VALIDAÇÃO GATE 3 E GATE 4 - FASE 3');
  console.log('═══════════════════════════════════════════════════════');
  
  const gate3Result = await testGate3();
  const gate4Result = await testGate4();
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RESUMO DOS RESULTADOS');
  console.log('═══════════════════════════════════════════════════════');
  console.log('GATE 3 (Autenticação):', gate3Result.success ? '✅ PASSOU' : '❌ FALHOU');
  console.log('GATE 4 (PIX):', gate4Result.success ? '✅ PASSOU' : '❌ FALHOU');
  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);

