/**
 * 💳 GERAR PIX E EXIBIR CÓDIGO
 * =============================
 * Objetivo: Gerar código PIX e exibir para cópia
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://goldeouro-backend-v2.fly.dev';
const TEST_EMAIL = 'free10signer@gmail.com';
const TEST_PASSWORD = 'Free10signer';
const VALOR_PIX = 10;

async function gerarPix() {
  console.log('\n💳 GERANDO CÓDIGO PIX\n');
  console.log('='.repeat(70));

  let token = null;
  let pixCode = null;
  let pixData = null;

  try {
    // 1. Login
    console.log('1️⃣ Fazendo login...');
    const loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, { timeout: 10000 });

    token = loginRes.data.token || loginRes.data.data?.token;
    if (!token) {
      throw new Error('Token não retornado');
    }
    console.log('✅ Login realizado com sucesso!\n');

    // 2. Verificar saldo
    const profileRes = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    const saldo = profileRes.data?.data?.saldo || 0;
    console.log(`💰 Saldo atual: R$ ${saldo.toFixed(2)}\n`);

    // 3. Criar PIX
    console.log(`2️⃣ Criando PIX no valor de R$ ${VALOR_PIX.toFixed(2)}...`);
    const pixRes = await axios.post(
      `${BASE_URL}/api/payments/pix/criar`,
      { valor: VALOR_PIX },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      }
    );

    pixData = pixRes.data?.data;
    if (!pixData) {
      throw new Error('Dados do PIX não retornados');
    }

    // Tentar diferentes campos para o código PIX
    pixCode = pixData.copy_and_paste || 
              pixData.pix_copy_paste || 
              pixData.qr_code ||
              (pixData.data && pixData.data.copy_and_paste) ||
              (pixData.data && pixData.data.pix_copy_paste);

    console.log('✅ PIX criado com sucesso!\n');

    // Salvar dados para exibição
    const resultado = {
      timestamp: new Date().toISOString(),
      payment_id: pixData.payment_id,
      valor: VALOR_PIX,
      codigo_pix: pixCode,
      ticket_url: pixData.ticket_url,
      expires_at: pixData.expires_at,
      saldo_atual: saldo
    };

    // Salvar em arquivo
    const logDir = path.join(__dirname, '../../../logs/v19/VERIFICACAO_SUPREMA');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, '34_codigo_pix_gerado.json');
    fs.writeFileSync(logFile, JSON.stringify(resultado, null, 2));

    // Exibir código
    console.log('='.repeat(70));
    console.log('📋 CÓDIGO PIX (COPIA E COLAR):');
    console.log('='.repeat(70));
    if (pixCode) {
      console.log(pixCode);
      console.log('='.repeat(70));
      console.log(`\n💰 Valor: R$ ${VALOR_PIX.toFixed(2)}`);
      console.log(`🆔 Payment ID: ${pixData.payment_id}`);
      console.log(`⏰ Expira em: ${pixData.expires_at || '30 minutos'}`);
      if (pixData.ticket_url) {
        console.log(`🔗 URL Alternativa: ${pixData.ticket_url}`);
      }
    } else {
      console.log('❌ Código PIX não encontrado!');
      console.log('Dados recebidos:');
      console.log(JSON.stringify(pixData, null, 2));
    }

    return resultado;

  } catch (error) {
    console.log(`\n❌ Erro: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Resposta: ${JSON.stringify(error.response.data).substring(0, 500)}`);
    }
    throw error;
  }
}

gerarPix()
  .then((resultado) => {
    console.log('\n✅ Código PIX gerado e salvo!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  });

