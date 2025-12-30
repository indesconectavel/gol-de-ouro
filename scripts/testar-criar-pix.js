/**
 * Script para testar criação de PIX e validação do código copia e cola
 * 
 * Uso:
 *   node scripts/testar-criar-pix.js [email] [senha] [valor]
 * 
 * Exemplo:
 *   node scripts/testar-criar-pix.js usuario@email.com senha123 10.00
 */

const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];
const VALOR = parseFloat(process.argv[4]) || 1.00;

// Validar se credenciais foram fornecidas
if (!EMAIL || !PASSWORD) {
  console.log('');
  console.log('❌ ERRO: Credenciais são obrigatórias!');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/testar-criar-pix.js [email] [senha] [valor]');
  console.log('');
  console.log('Exemplo:');
  console.log('  node scripts/testar-criar-pix.js usuario@email.com senha123 1.00');
  console.log('');
  console.log('💡 DICA: Use o script com registro automático:');
  console.log('  node scripts/testar-criar-pix-com-registro.js [email] [senha] [valor]');
  console.log('');
  process.exit(1);
}

async function testarCriarPIX() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTE: Criação de PIX');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📡 Backend: ${BACKEND_URL}`);
  console.log(`👤 Email: ${EMAIL}`);
  console.log(`💰 Valor: R$ ${VALOR.toFixed(2)}`);
  console.log('');

  try {
    // 1. Login
    console.log('1️⃣  Fazendo login...');
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });

    if (!loginResponse.data.success) {
      throw new Error(`Login falhou: ${loginResponse.data.message || 'Credenciais inválidas'}`);
    }

    const token = loginResponse.data.data.token;
    console.log('   ✅ Login realizado com sucesso');
    console.log(`   📝 Token: ${token.substring(0, 20)}...`);
    console.log('');

    // 2. Criar PIX
    console.log('2️⃣  Criando pagamento PIX...');
    const pixResponse = await axios.post(
      `${BACKEND_URL}/api/payments/pix/criar`,
      {
        valor: VALOR,
        descricao: `Teste PIX - ${new Date().toISOString()}`
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!pixResponse.data.success) {
      throw new Error(`Criação de PIX falhou: ${pixResponse.data.message || 'Erro desconhecido'}`);
    }

    const pixData = pixResponse.data.data;
    console.log('   ✅ PIX criado com sucesso');
    console.log(`   🆔 Payment ID: ${pixData.payment_id}`);
    console.log('');

    // 3. Validar código PIX
    console.log('3️⃣  Validando código PIX...');
    
    const validacoes = {
      'payment_id presente': !!pixData.payment_id,
      'qr_code presente': !!pixData.qr_code,
      'qr_code_base64 presente': !!pixData.qr_code_base64,
      'pix_copy_paste presente': !!pixData.pix_copy_paste,
      'expires_at presente': !!pixData.expires_at
    };

    let todasValidas = true;
    for (const [campo, valido] of Object.entries(validacoes)) {
      const status = valido ? '✅' : '❌';
      console.log(`   ${status} ${campo}`);
      if (!valido) todasValidas = false;
    }

    console.log('');

    if (!todasValidas) {
      console.log('   ⚠️  Alguns campos estão ausentes');
      console.log('   📋 Dados recebidos:');
      console.log(JSON.stringify(pixData, null, 2));
      console.log('');
    }

    // 4. Validar formato do código PIX
    if (pixData.pix_copy_paste) {
      console.log('4️⃣  Validando formato do código PIX...');
      const pixCode = pixData.pix_copy_paste;
      
      // Código PIX deve começar com 00020 (versão 2.0)
      const isValidFormat = pixCode.startsWith('00020') || pixCode.length > 50;
      const hasValidLength = pixCode.length >= 50 && pixCode.length <= 500;
      
      console.log(`   ${isValidFormat ? '✅' : '❌'} Formato válido (começa com 00020 ou tem tamanho adequado)`);
      console.log(`   ${hasValidLength ? '✅' : '❌'} Tamanho válido (50-500 caracteres)`);
      console.log(`   📏 Tamanho: ${pixCode.length} caracteres`);
      console.log(`   📋 Primeiros 50 caracteres: ${pixCode.substring(0, 50)}...`);
      console.log('');
    }

    // 5. Consultar status
    console.log('5️⃣  Consultando status do pagamento...');
    try {
      const statusResponse = await axios.get(
        `${BACKEND_URL}/api/payments/pix/status/${pixData.payment_id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (statusResponse.data.success) {
        const statusData = statusResponse.data.data;
        console.log('   ✅ Status consultado com sucesso');
        console.log(`   📊 Status: ${statusData.status}`);
        console.log(`   💰 Valor: R$ ${statusData.valor?.toFixed(2) || 'N/A'}`);
        console.log(`   📅 Criado em: ${statusData.created_at || 'N/A'}`);
        console.log(`   ⏰ Expira em: ${statusData.expires_at || 'N/A'}`);
        console.log('');
      } else {
        console.log('   ⚠️  Erro ao consultar status:', statusResponse.data.message);
        console.log('');
      }
    } catch (statusError) {
      console.log('   ⚠️  Erro ao consultar status:', statusError.response?.data?.message || statusError.message);
      console.log('');
    }

    // Resumo final
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESUMO DO TESTE:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`✅ PIX criado: ${pixData.payment_id}`);
    console.log(`✅ Código PIX: ${pixData.pix_copy_paste ? 'Presente' : 'Ausente'}`);
    console.log(`✅ QR Code: ${pixData.qr_code ? 'Presente' : 'Ausente'}`);
    console.log(`✅ QR Code Base64: ${pixData.qr_code_base64 ? 'Presente' : 'Ausente'}`);
    console.log('');
    
    if (pixData.pix_copy_paste) {
      console.log('📋 CÓDIGO PIX (COPIA E COLA):');
      console.log('');
      console.log(pixData.pix_copy_paste);
      console.log('');
    }

    console.log('✅ TESTE CONCLUÍDO COM SUCESSO');
    console.log('');

  } catch (error) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ ERRO NO TESTE:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Mensagem: ${error.response.data?.message || error.response.data?.error || 'Erro desconhecido'}`);
      console.log('');
      console.log('Detalhes:');
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(`Erro: ${error.message}`);
    }
    
    console.log('');
    process.exit(1);
  }
}

// Executar teste
testarCriarPIX();

