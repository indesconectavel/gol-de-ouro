// Script para criar PIX de teste - R$ 1,00
// Gol de Ouro v1.2.1

const axios = require('axios');

const API_URL = 'https://goldeouro-backend-v2.fly.dev';
const VALOR = 1.00;

async function criarPixTeste() {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💰 CRIANDO PIX DE TESTE - R$', VALOR);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Gerar credenciais únicas
    const timestamp = Date.now();
    const testEmail = `teste.pix.${timestamp}@goldeouro.test`;
    const testPassword = 'Teste123!@#';
    const testUsername = `teste_pix_${timestamp}`;

    console.log('📝 Criando usuário de teste...');
    console.log('   Email:', testEmail);
    console.log('   Username:', testUsername);
    console.log('');

    // Passo 1: Registrar usuário
    try {
      const registerResponse = await axios.post(`${API_URL}/api/auth/register`, {
        email: testEmail,
        password: testPassword,
        username: testUsername
      });

      if (registerResponse.data.success) {
        console.log('✅ Usuário criado com sucesso!');
        console.log('');
      } else {
        console.log('⚠️ Registro retornou sucesso=false:', registerResponse.data.message);
        console.log('   Tentando fazer login...');
        console.log('');
      }
    } catch (registerError) {
      if (registerError.response) {
        console.log('⚠️ Erro ao registrar:', registerError.response.data.message || registerError.response.data.error);
        console.log('   Tentando fazer login...');
        console.log('');
      } else {
        console.log('⚠️ Erro de conexão ao registrar:', registerError.message);
        console.log('   Tentando fazer login...');
        console.log('');
      }
    }

    // Passo 2: Fazer login
    console.log('📤 Fazendo login...');

    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });

    if (!loginResponse.data.success) {
      console.error('❌ Erro no login:', loginResponse.data.message);
      process.exit(1);
    }

    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    const saldo = loginResponse.data.data.user.saldo;

    console.log('✅ Login realizado com sucesso!');
    console.log('   User ID:', userId);
    console.log('   Saldo atual: R$', saldo);
    console.log('');

    // Passo 3: Criar PIX
    console.log('📤 Criando PIX de R$', VALOR, '...');

    const pixResponse = await axios.post(
      `${API_URL}/api/payments/pix/criar`,
      {
        valor: VALOR,
        descricao: 'Depósito de teste - Gol de Ouro'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!pixResponse.data.success) {
      console.error('❌ Erro ao criar PIX:', pixResponse.data.message);
      process.exit(1);
    }

    const pixData = pixResponse.data.data;

    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ PIX CRIADO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 INFORMAÇÕES DO PIX:');
    console.log('   Payment ID:', pixData.payment_id);
    console.log('   Valor: R$', VALOR);
    console.log('   Expira em:', pixData.expires_at);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📱 CÓDIGO PIX COPIA E COLA:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(pixData.pix_copy_paste);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('💡 INSTRUÇÕES:');
    console.log('   1. Copie o código acima');
    console.log('   2. Abra seu app de banco');
    console.log('   3. Cole o código no campo PIX');
    console.log('   4. Confirme o pagamento de R$', VALOR);
    console.log('   5. Aguarde alguns segundos para o webhook processar');
    console.log('');
    console.log('🔍 Para verificar o status do pagamento:');
    console.log(`   GET ${API_URL}/api/payments/pix/status/${pixData.payment_id}`);
    console.log('');
    console.log('📧 Credenciais do usuário de teste:');
    console.log('   Email:', testEmail);
    console.log('   Senha:', testPassword);
    console.log('');

    // Salvar informações em arquivo
    const fs = require('fs');
    const pixInfo = {
      payment_id: pixData.payment_id,
      valor: VALOR,
      pix_copy_paste: pixData.pix_copy_paste,
      expires_at: pixData.expires_at,
      created_at: new Date().toISOString(),
      user_email: testEmail,
      user_password: testPassword
    };

    fs.writeFileSync('pix-teste-info.json', JSON.stringify(pixInfo, null, 2), 'utf8');
    console.log('✅ Informações salvas em: pix-teste-info.json');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ PROCESSO CONCLUÍDO!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('   Resposta:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

criarPixTeste();

