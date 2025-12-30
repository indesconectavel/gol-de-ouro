/**
 * 🧪 CONTINUAR TESTES APÓS PAGAMENTO PIX
 * =======================================
 * Objetivo: Continuar testes após pagamento PIX confirmado
 * - Verificar crédito
 * - Realizar 10 chutes
 * - Validar sistema completo
 */

require('dotenv').config();
const axios = require('axios');
const { supabaseAdmin } = require('../../database/supabase-unified-config');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://goldeouro-backend-v2.fly.dev';
const TEST_EMAIL = 'free10signer@gmail.com';
const TEST_PASSWORD = 'Free10signer';

const resultados = {
  timestamp: new Date().toISOString(),
  base_url: BASE_URL,
  email: TEST_EMAIL,
  chutes: [],
  saldos: {},
  transacoes: [],
  problemas: [],
  avisos: []
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function continuarTestes() {
  console.log('\n🧪 CONTINUANDO TESTES APÓS PAGAMENTO PIX\n');
  console.log('='.repeat(70));

  let token = null;
  let userId = null;

  // 1. LOGIN
  console.log('\n1️⃣ FAZENDO LOGIN\n');
  console.log('-'.repeat(70));

  try {
    const response = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    }, { 
      timeout: 10000,
      validateStatus: () => true
    });

    if (response.status === 200 && response.data) {
      token = response.data.token || response.data.data?.token;
      userId = response.data.user?.id || response.data.data?.user?.id || response.data.userId;
      
      if (token) {
        console.log('   ✅ Login realizado com sucesso!');
        console.log(`   ℹ️  User ID: ${userId}`);
        resultados.userId = userId;
      } else {
        throw new Error('Token não encontrado');
      }
    } else {
      throw new Error(`Status ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Login falhou: ${error.message}`);
    resultados.problemas.push(`Login falhou: ${error.message}`);
    return resultados;
  }

  // 2. VERIFICAR SALDO APÓS PIX
  console.log('\n2️⃣ VERIFICANDO SALDO APÓS PIX\n');
  console.log('-'.repeat(70));

  // Aguardar processamento do webhook
  console.log('   ⏳ Aguardando processamento do webhook (15 segundos)...');
  await sleep(15000);

  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    const saldoAposPix = response.data?.data?.saldo || 0;
    console.log(`   ℹ️  Saldo após PIX: R$ ${saldoAposPix.toFixed(2)}`);
    resultados.saldos.apos_pix = saldoAposPix;

    const creditoEsperado = 10.00;
    if (saldoAposPix >= 24 + creditoEsperado * 0.9) {
      console.log(`   ✅ Crédito recebido! Saldo aumentou`);
    } else {
      console.log(`   ⚠️  Crédito pode não ter sido processado ainda`);
      console.log(`   ℹ️  Aguardando mais alguns segundos...`);
      await sleep(10000);
      
      // Verificar novamente
      const response2 = await axios.get(`${BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      const saldoNovo = response2.data?.data?.saldo || 0;
      console.log(`   ℹ️  Saldo após aguardar: R$ ${saldoNovo.toFixed(2)}`);
      resultados.saldos.apos_pix = saldoNovo;
    }
  } catch (error) {
    console.log(`   ⚠️  Não foi possível verificar saldo: ${error.message}`);
  }

  // 3. REALIZAR 10 CHUTES
  console.log('\n3️⃣ REALIZANDO 10 CHUTES NO JOGO\n');
  console.log('='.repeat(70));

  const valorChute = 1.00;
  const direcoes = ['left', 'center', 'right'];
  let saldoAntesChutes = resultados.saldos.apos_pix || 0;

  for (let i = 1; i <= 10; i++) {
    console.log(`\n   Chute ${i}/10:`);
    console.log('   ' + '-'.repeat(66));

    // Verificar saldo antes do chute
    try {
      const response = await axios.get(`${BASE_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      saldoAntesChutes = response.data?.data?.saldo || 0;
    } catch (error) {
      // Continuar mesmo se não conseguir verificar saldo
    }

    // Fazer chute
    const direcao = direcoes[i % 3];
    try {
      const response = await axios.post(
        `${BASE_URL}/api/games/shoot`,
        {
          direction: direcao,
          amount: valorChute
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000,
          validateStatus: () => true
        }
      );

      if (response.status === 200 && response.data) {
        const chuteData = {
          numero: i,
          direcao: direcao,
          valor: valorChute,
          resultado: response.data.result || response.data.data?.result || 'N/A',
          loteId: response.data.loteId || response.data.data?.loteId || 'N/A',
          premio: response.data.premio || response.data.data?.premio || 0,
          premioGolDeOuro: response.data.premioGolDeOuro || response.data.data?.premioGolDeOuro || 0,
          isGolDeOuro: response.data.isGolDeOuro || response.data.data?.isGolDeOuro || false,
          loteProgress: response.data.loteProgress || response.data.data?.loteProgress || {},
          timestamp: new Date().toISOString(),
          status: 'sucesso'
        };

        resultados.chutes.push(chuteData);

        console.log(`   ✅ Chute processado`);
        console.log(`   ℹ️  Direção: ${direcao}`);
        console.log(`   ℹ️  Resultado: ${chuteData.resultado}`);
        console.log(`   ℹ️  Lote ID: ${chuteData.loteId}`);
        console.log(`   ℹ️  Prêmio: R$ ${chuteData.premio.toFixed(2)}`);
        if (chuteData.premioGolDeOuro > 0) {
          console.log(`   🏆 Gol de Ouro! Prêmio: R$ ${chuteData.premioGolDeOuro.toFixed(2)}`);
        }
        if (chuteData.loteProgress.current) {
          console.log(`   ℹ️  Progresso: ${chuteData.loteProgress.current}/${chuteData.loteProgress.total || 'N/A'}`);
        }

        await sleep(2000);

      } else {
        const errorMsg = response.data?.message || `Status ${response.status}`;
        console.log(`   ❌ Chute ${i} falhou: ${errorMsg}`);
        if (response.data?.details) {
          console.log(`   ℹ️  Detalhes: ${JSON.stringify(response.data.details)}`);
        }
        resultados.chutes.push({
          numero: i,
          direcao: direcao,
          valor: valorChute,
          erro: errorMsg,
          detalhes: response.data?.details,
          timestamp: new Date().toISOString(),
          status: 'falha'
        });
        resultados.problemas.push(`Chute ${i} falhou: ${errorMsg}`);
      }
    } catch (error) {
      console.log(`   ❌ Chute ${i} falhou: ${error.message}`);
      resultados.chutes.push({
        numero: i,
        direcao: direcao,
        valor: valorChute,
        erro: error.message,
        timestamp: new Date().toISOString(),
        status: 'erro'
      });
      resultados.problemas.push(`Chute ${i} falhou: ${error.message}`);
    }
  }

  // 4. VERIFICAR SALDO FINAL
  console.log('\n4️⃣ VERIFICANDO SALDO FINAL\n');
  console.log('-'.repeat(70));

  await sleep(3000);

  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    const saldoFinal = response.data?.data?.saldo || 0;
    console.log(`   ℹ️  Saldo final: R$ ${saldoFinal.toFixed(2)}`);
    resultados.saldos.final = saldoFinal;

    const chutesSucesso = resultados.chutes.filter(c => c.status === 'sucesso').length;
    const totalDebitos = valorChute * chutesSucesso;
    const totalPremios = resultados.chutes.reduce((sum, c) => sum + (c.premio || 0) + (c.premioGolDeOuro || 0), 0);
    const saldoEsperado = saldoAntesChutes - totalDebitos + totalPremios;
    const diferenca = Math.abs(saldoFinal - saldoEsperado);

    console.log(`   ℹ️  Saldo antes dos chutes: R$ ${saldoAntesChutes.toFixed(2)}`);
    console.log(`   ℹ️  Total debitado: R$ ${totalDebitos.toFixed(2)}`);
    console.log(`   ℹ️  Total em prêmios: R$ ${totalPremios.toFixed(2)}`);
    console.log(`   ℹ️  Saldo esperado: R$ ${saldoEsperado.toFixed(2)}`);
    console.log(`   ℹ️  Diferença: R$ ${diferenca.toFixed(2)}`);

    if (diferenca < 0.10) {
      console.log(`   ✅ Saldo correto!`);
    } else {
      console.log(`   ⚠️  Diferença no saldo detectada`);
      resultados.avisos.push(`Diferença no saldo: R$ ${diferenca.toFixed(2)}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Não foi possível verificar saldo final: ${error.message}`);
  }

  // 5. RESUMO FINAL
  console.log('\n5️⃣ RESUMO FINAL\n');
  console.log('='.repeat(70));

  const chutesSucesso = resultados.chutes.filter(c => c.status === 'sucesso').length;
  const chutesFalha = resultados.chutes.filter(c => c.status !== 'sucesso').length;
  const totalPremios = resultados.chutes.reduce((sum, c) => sum + (c.premio || 0) + (c.premioGolDeOuro || 0), 0);
  const totalDebitos = valorChute * chutesSucesso;

  console.log(`\n📊 ESTATÍSTICAS:`);
  console.log(`   Chutes realizados: ${chutesSucesso}/10`);
  console.log(`   Chutes com falha: ${chutesFalha}`);
  console.log(`   Total debitado: R$ ${totalDebitos.toFixed(2)}`);
  console.log(`   Total em prêmios: R$ ${totalPremios.toFixed(2)}`);
  console.log(`   Saldo após PIX: R$ ${resultados.saldos.apos_pix.toFixed(2)}`);
  console.log(`   Saldo final: R$ ${resultados.saldos.final.toFixed(2)}`);

  if (resultados.problemas.length > 0) {
    console.log(`\n❌ PROBLEMAS (${resultados.problemas.length}):`);
    resultados.problemas.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p}`);
    });
  }

  if (resultados.avisos.length > 0) {
    console.log(`\n⚠️  AVISOS (${resultados.avisos.length}):`);
    resultados.avisos.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a}`);
    });
  }

  if (chutesSucesso === 10 && resultados.problemas.length === 0) {
    console.log(`\n🎉 TODOS OS TESTES PASSARAM!`);
    console.log(`✅ Sistema funcionando perfeitamente!`);
    resultados.status_final = 'SUCESSO';
  } else if (chutesSucesso >= 8 && resultados.problemas.length === 0) {
    console.log(`\n✅ TESTES QUASE COMPLETOS!`);
    console.log(`⚠️  Verificar avisos`);
    resultados.status_final = 'SUCESSO_COM_AVISOS';
  } else {
    console.log(`\n⚠️  ALGUNS TESTES FALHARAM`);
    resultados.status_final = 'FALHAS';
  }

  // Salvar resultados
  const logDir = path.join(__dirname, '../../../logs/v19/VERIFICACAO_SUPREMA');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, '35_testes_completos_10_chutes.json');
  fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2));
  console.log(`\n📝 Resultados salvos em: ${logFile}`);

  console.log('\n' + '='.repeat(70) + '\n');

  return resultados;
}

continuarTestes()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  });

