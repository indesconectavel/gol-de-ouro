// Script para criar PIX usando credenciais existentes
// Gol de Ouro v1.2.1
// Uso: node scripts/criar-pix-com-credenciais.js <email> <senha> [valor]

const axios = require('axios');

const API_URL = 'https://goldeouro-backend-v2.fly.dev';

async function criarPixComCredenciais(email, senha, valor = 1.00) {
  try {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('💰 CRIANDO PIX DE TESTE - R$', valor);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    // Passo 1: Fazer login
    console.log('📤 Fazendo login com:', email);
    console.log('');

    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: email,
      password: senha
    });

    if (!loginResponse.data.success) {
      console.error('❌ Erro no login:', loginResponse.data.message || loginResponse.data.error);
      process.exit(1);
    }

    const token = loginResponse.data.data.token;
    const userId = loginResponse.data.data.user.id;
    const saldo = loginResponse.data.data.user.saldo;

    console.log('✅ Login realizado com sucesso!');
    console.log('   User ID:', userId);
    console.log('   Saldo atual: R$', saldo);
    console.log('');

    // Passo 2: Criar PIX
    console.log('📤 Criando PIX de R$', valor, '...');

    const pixResponse = await axios.post(
      `${API_URL}/api/payments/pix/criar`,
      {
        valor: valor,
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
      console.error('❌ Erro ao criar PIX:', pixResponse.data.message || pixResponse.data.error);
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
    console.log('   Valor: R$', valor);
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
    console.log('   4. Confirme o pagamento de R$', valor);
    console.log('   5. Aguarde alguns segundos para o webhook processar');
    console.log('');
    console.log('🔍 Para verificar o status do pagamento:');
    console.log(`   GET ${API_URL}/api/payments/pix/status/${pixData.payment_id}`);
    console.log('');

    // Salvar informações em arquivo
    const fs = require('fs');
    const pixInfo = {
      payment_id: pixData.payment_id,
      valor: valor,
      pix_copy_paste: pixData.pix_copy_paste,
      expires_at: pixData.expires_at,
      created_at: new Date().toISOString(),
      user_email: email
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
      console.error('   Status:', error.response.status);
      console.error('   Resposta:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Obter argumentos da linha de comando
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Uso: node scripts/criar-pix-com-credenciais.js <email> <senha> [valor]');
  console.log('');
  console.log('Exemplo:');
  console.log('  node scripts/criar-pix-com-credenciais.js usuario@email.com senha123 1.00');
  process.exit(1);
}

const email = args[0];
const senha = args[1];
const valor = parseFloat(args[2]) || 1.00;

criarPixComCredenciais(email, senha, valor);

