/**
 * SCRIPT DE DEBUG DO ENDPOINT /api/games/shoot
 * Testa o endpoint e mostra detalhes do erro
 */

const axios = require('axios');
const BASE_URL = process.env.API_URL || 'https://goldeouro-backend-v2.fly.dev';

async function main() {
  console.log('\n🔍 DEBUG DO ENDPOINT /api/games/shoot\n');
  console.log('='.repeat(70));

  try {
    // 1. Login
    console.log('\n1️⃣ Fazendo login...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'free10signer@gmail.com',
      password: 'Free10signer'
    });

    const token = loginRes.data.token || loginRes.data.data?.token;
    if (!token) {
      console.error('❌ Token não encontrado na resposta:', loginRes.data);
      return;
    }
    console.log('✅ Login realizado com sucesso');

    // 2. Verificar saldo antes
    console.log('\n2️⃣ Verificando saldo antes do chute...');
    const profileRes = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const saldoAntes = profileRes.data.data?.saldo || profileRes.data.saldo || 0;
    console.log(`💰 Saldo antes: R$ ${saldoAntes}`);

    // 3. Tentar fazer chute
    console.log('\n3️⃣ Fazendo chute...');
    try {
      const shootRes = await axios.post(
        `${BASE_URL}/api/games/shoot`,
        { direction: 'left', amount: 5.00 },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          validateStatus: () => true
        }
      );

      console.log(`\n📊 Resposta do servidor:`);
      console.log(`   Status: ${shootRes.status}`);
      console.log(`   Dados: ${JSON.stringify(shootRes.data, null, 2)}`);

      if (shootRes.status !== 200) {
        console.log('\n❌ ERRO DETECTADO:');
        console.log(`   Status: ${shootRes.status}`);
        console.log(`   Mensagem: ${shootRes.data.message || 'Sem mensagem'}`);
        console.log(`   Erro completo: ${JSON.stringify(shootRes.data, null, 2)}`);
      } else {
        console.log('\n✅ Chute realizado com sucesso!');
      }

      // 4. Verificar saldo depois
      console.log('\n4️⃣ Verificando saldo depois do chute...');
      const profileRes2 = await axios.get(`${BASE_URL}/api/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const saldoDepois = profileRes2.data.data?.saldo || profileRes2.data.saldo || 0;
      console.log(`💰 Saldo depois: R$ ${saldoDepois}`);
      console.log(`📉 Diferença: R$ ${(saldoAntes - saldoDepois).toFixed(2)}`);

    } catch (error) {
      console.error('\n❌ ERRO AO FAZER CHUTE:');
      console.error(`   Mensagem: ${error.message}`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      if (error.request) {
        console.error(`   Request: ${JSON.stringify(error.request, null, 2)}`);
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO FATAL:');
    console.error(error);
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

main();

