/**
 * 🔍 DIAGNÓSTICO DE PROBLEMAS DO TESTE
 * =====================================
 * Objetivo: Diagnosticar problemas identificados no teste
 */

require('dotenv').config();
const axios = require('axios');
const { supabaseAdmin } = require('../../database/supabase-unified-config');

const BASE_URL = process.env.BASE_URL || 'https://goldeouro-backend-v2.fly.dev';
const TEST_EMAIL = 'free10signer@gmail.com';
const TEST_PASSWORD = 'Free10signer';

async function diagnostico() {
  console.log('\n🔍 DIAGNÓSTICO DE PROBLEMAS\n');
  console.log('='.repeat(70));

  // 1. Verificar código PIX completo
  console.log('\n1️⃣ VERIFICANDO CÓDIGO PIX\n');
  console.log('-'.repeat(70));

  let token = null;
  try {
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, { timeout: 10000 });

    token = loginRes.data.token || loginRes.data.data?.token;
    if (!token) {
      console.log('❌ Não foi possível fazer login');
      return;
    }
    console.log('✅ Login realizado');

    // Criar novo PIX
    const pixRes = await axios.post(
      `${BASE_URL}/api/payments/pix/criar`,
      { valor: 10 },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      }
    );

    const pixData = pixRes.data?.data;
    if (pixData) {
      const pixCode = pixData.copy_and_paste || 
                     pixData.pix_copy_paste || 
                     pixData.qr_code ||
                     (pixData.data && pixData.data.copy_and_paste);

      console.log('\n📋 CÓDIGO PIX COMPLETO:\n');
      console.log('='.repeat(70));
      if (pixCode) {
        console.log(pixCode);
        console.log(`\nTamanho: ${pixCode.length} caracteres`);
        
        // Verificar se está completo (código PIX geralmente tem 200+ caracteres)
        if (pixCode.length < 100) {
          console.log('\n⚠️  CÓDIGO PIX PARECE INCOMPLETO!');
          console.log('Verifique os dados completos:');
          console.log(JSON.stringify(pixData, null, 2));
        } else {
          console.log('\n✅ Código PIX parece completo');
        }
      } else {
        console.log('❌ Código PIX não encontrado!');
        console.log('Dados recebidos:');
        console.log(JSON.stringify(pixData, null, 2));
      }
      console.log('='.repeat(70));

      // Mostrar ticket URL como alternativa
      if (pixData.ticket_url) {
        console.log('\n🔗 URL ALTERNATIVA (Pagar via web):');
        console.log(pixData.ticket_url);
      }
    }

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Resposta: ${JSON.stringify(error.response.data).substring(0, 500)}`);
    }
  }

  // 2. Verificar erros 400 nos chutes
  console.log('\n\n2️⃣ DIAGNOSTICANDO ERROS 400 NOS CHUTES\n');
  console.log('-'.repeat(70));

  if (!token) {
    console.log('⚠️  Não é possível testar chutes sem token');
    return;
  }

  try {
    // Verificar saldo atual
    const profileRes = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    const saldo = profileRes.data?.data?.saldo || 0;
    console.log(`Saldo atual: R$ ${saldo.toFixed(2)}`);

    if (saldo < 1) {
      console.log('⚠️  Saldo insuficiente para testar chutes');
      return;
    }

    // Tentar fazer um chute e capturar erro detalhado
    console.log('\nTentando fazer chute...');
    const shootRes = await axios.post(
      `${BASE_URL}/api/games/shoot`,
      {
        direction: 'left',
        amount: 1
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
        validateStatus: () => true // Não lançar erro para status 400
      }
    );

    console.log(`Status: ${shootRes.status}`);
    console.log(`Resposta:`);
    console.log(JSON.stringify(shootRes.data, null, 2));

    if (shootRes.status === 400) {
      console.log('\n❌ ERRO 400 DETECTADO!');
      console.log('Mensagem:', shootRes.data?.message || 'N/A');
      console.log('Detalhes:', shootRes.data?.details || 'N/A');
    } else if (shootRes.status === 200) {
      console.log('\n✅ Chute funcionou!');
    }

  } catch (error) {
    console.log(`❌ Erro ao testar chute: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Resposta: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

diagnostico()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  });

