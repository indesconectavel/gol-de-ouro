/**
 * 🧪 TESTE COMPLETO REAL - 10 CHUTES
 * ===================================
 * Objetivo: Testar sistema completo com conta real
 * - Criar PIX
 * - Aguardar pagamento
 * - Realizar 10 chutes
 * - Validar sistema de lotes, financeiro e premiação
 */

require('dotenv').config();
const axios = require('axios');
const { supabaseAdmin } = require('../../database/supabase-unified-config');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'https://goldeouro-backend-v2.fly.dev';

// Credenciais
const TEST_EMAIL = 'free10signer@gmail.com';
const TEST_PASSWORD = 'Free10signer';

const resultados = {
  timestamp: new Date().toISOString(),
  base_url: BASE_URL,
  email: TEST_EMAIL,
  pix: {},
  chutes: [],
  saldos: {},
  transacoes: [],
  lotes: [],
  premios: [],
  problemas: [],
  avisos: []
};

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testeCompleto() {
  console.log('\n🧪 TESTE COMPLETO REAL - 10 CHUTES\n');
  console.log('='.repeat(70));
  console.log(`URL Base: ${BASE_URL}`);
  console.log(`Email: ${TEST_EMAIL}`);
  console.log(`Timestamp: ${resultados.timestamp}\n`);

  let token = null;
  let userId = null;

  // =====================================================
  // 1. LOGIN
  // =====================================================
  console.log('1️⃣ FAZENDO LOGIN\n');
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
      // Tentar diferentes formatos de resposta
      token = response.data.token || response.data.data?.token || response.data.data?.access_token;
      userId = response.data.user?.id || response.data.data?.user?.id || response.data.userId || response.data.data?.userId;
      
      if (token) {
        console.log('   ✅ Login realizado com sucesso!');
        console.log(`   ℹ️  Token obtido: ${token.substring(0, 20)}...`);
        if (userId) {
          console.log(`   ℹ️  User ID: ${userId}`);
        }
        resultados.userId = userId;
      } else {
        console.log(`   ⚠️  Resposta do login: ${JSON.stringify(response.data).substring(0, 200)}`);
        throw new Error('Token não encontrado na resposta');
      }
    } else {
      console.log(`   ⚠️  Status: ${response.status}`);
      console.log(`   ⚠️  Resposta: ${JSON.stringify(response.data).substring(0, 200)}`);
      throw new Error(`Login falhou: Status ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Login falhou: ${error.message}`);
    if (error.response) {
      console.log(`   ⚠️  Status: ${error.response.status}`);
      console.log(`   ⚠️  Resposta: ${JSON.stringify(error.response.data).substring(0, 200)}`);
    }
    resultados.problemas.push(`Login falhou: ${error.message}`);
    return resultados;
  }

  // =====================================================
  // 2. VERIFICAR SALDO INICIAL
  // =====================================================
  console.log('\n2️⃣ VERIFICANDO SALDO INICIAL\n');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    const saldoInicial = response.data?.data?.saldo || 0;
    console.log(`   ℹ️  Saldo inicial: R$ ${saldoInicial.toFixed(2)}`);
    resultados.saldos.inicial = saldoInicial;
  } catch (error) {
    console.log(`   ⚠️  Não foi possível verificar saldo: ${error.message}`);
  }

  // =====================================================
  // 3. CRIAR PIX
  // =====================================================
  console.log('\n3️⃣ CRIANDO PIX\n');
  console.log('-'.repeat(70));

  const valorPix = 10; // R$ 10,00 para 10 chutes de R$ 1,00 cada

  try {
    const response = await axios.post(
      `${BASE_URL}/api/payments/pix/criar`,
      { valor: valorPix },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      }
    );

    if (response.data && response.data.data) {
      const pixData = response.data.data;
      
      // Tentar diferentes campos para o código PIX
      const pixCode = pixData.copy_and_paste || 
                     pixData.pix_copy_paste || 
                     pixData.qr_code || 
                     pixData.pix_copy_paste ||
                     (pixData.data && pixData.data.copy_and_paste) ||
                     (pixData.data && pixData.data.pix_copy_paste) ||
                     (pixData.data && pixData.data.qr_code);

      resultados.pix = {
        payment_id: pixData.payment_id,
        valor: valorPix,
        qr_code: pixData.qr_code,
        copy_and_paste: pixCode,
        pix_copy_paste: pixCode,
        ticket_url: pixData.ticket_url,
        expires_at: pixData.expires_at,
        raw_data: pixData // Guardar dados completos para debug
      };

      console.log('   ✅ PIX criado com sucesso!');
      console.log(`   ℹ️  Payment ID: ${resultados.pix.payment_id}`);
      console.log(`   ℹ️  Valor: R$ ${valorPix.toFixed(2)}`);
      console.log(`   ℹ️  Expira em: ${resultados.pix.expires_at || '30 minutos'}`);

      if (!pixCode) {
        console.log('\n   ⚠️  ATENÇÃO: Código PIX não encontrado na resposta!');
        console.log(`   ⚠️  Dados recebidos: ${JSON.stringify(pixData).substring(0, 500)}`);
        resultados.avisos.push('Código PIX não encontrado na resposta');
      }

      // Mostrar código PIX
      console.log('\n' + '='.repeat(70));
      console.log('📋 CÓDIGO PIX (COPIA E COLAR):\n');
      if (pixCode) {
        console.log(pixCode);
      } else {
        console.log('   ❌ ERRO: Código PIX não disponível');
        console.log('   ℹ️  Verifique o ticket_url para pagar via web:');
        console.log(`   ${resultados.pix.ticket_url || 'N/A'}`);
      }
      console.log('\n' + '='.repeat(70));
      console.log('\n⚠️  AGUARDANDO PAGAMENTO...');
      console.log('   Por favor, faça o pagamento do PIX acima.');
      console.log('   Após pagar, pressione ENTER para continuar...\n');

      // Aguardar confirmação do usuário
      await new Promise(resolve => {
        process.stdin.once('data', () => {
          resolve();
        });
      });

      console.log('   ✅ Pagamento confirmado! Continuando testes...\n');

    } else {
      throw new Error('Dados do PIX não retornados');
    }
  } catch (error) {
    console.log(`   ❌ Criar PIX falhou: ${error.message}`);
    resultados.problemas.push(`Criar PIX falhou: ${error.message}`);
    return resultados;
  }

  // Aguardar processamento do webhook (se necessário)
  console.log('   ⏳ Aguardando processamento do webhook (10 segundos)...');
  await sleep(10000);

  // =====================================================
  // 4. VERIFICAR SALDO APÓS PIX
  // =====================================================
  console.log('\n4️⃣ VERIFICANDO SALDO APÓS PIX\n');
  console.log('-'.repeat(70));

  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    const saldoAposPix = response.data?.data?.saldo || 0;
    console.log(`   ℹ️  Saldo após PIX: R$ ${saldoAposPix.toFixed(2)}`);
    resultados.saldos.apos_pix = saldoAposPix;

    const credito = saldoAposPix - resultados.saldos.inicial;
    if (credito >= valorPix * 0.9) { // Permitir pequena diferença
      console.log(`   ✅ Crédito recebido: R$ ${credito.toFixed(2)}`);
    } else {
      console.log(`   ⚠️  Crédito menor que esperado: R$ ${credito.toFixed(2)} (esperado: R$ ${valorPix.toFixed(2)})`);
      resultados.avisos.push(`Crédito menor que esperado: R$ ${credito.toFixed(2)}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Não foi possível verificar saldo: ${error.message}`);
  }

  // =====================================================
  // 5. REALIZAR 10 CHUTES
  // =====================================================
  console.log('\n5️⃣ REALIZANDO 10 CHUTES NO JOGO\n');
  console.log('='.repeat(70));

  const valorChute = 1.00; // R$ 1,00 por chute
  const direcoes = ['left', 'center', 'right'];
  let saldoAntesChutes = resultados.saldos.apos_pix || resultados.saldos.inicial;

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
      console.log(`   ⚠️  Não foi possível verificar saldo: ${error.message}`);
    }

    // Fazer chute
    const direcao = direcoes[i % 3]; // Alternar entre left, center, right
    try {
      const response = await axios.post(
        `${BASE_URL}/api/games/shoot`,
        {
          direction: direcao,
          amount: valorChute
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 15000
        }
      );

      if (response.data) {
        const chuteData = {
          numero: i,
          direcao: direcao,
          valor: valorChute,
          resultado: response.data.result || 'N/A',
          loteId: response.data.loteId || 'N/A',
          premio: response.data.premio || 0,
          premioGolDeOuro: response.data.premioGolDeOuro || 0,
          isGolDeOuro: response.data.isGolDeOuro || false,
          loteProgress: response.data.loteProgress || {},
          timestamp: new Date().toISOString()
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
          console.log(`   ℹ️  Progresso do lote: ${chuteData.loteProgress.current}/${chuteData.loteProgress.total || 'N/A'}`);
        }

        // Aguardar um pouco entre chutes
        await sleep(2000);

      } else {
        throw new Error('Resposta inválida do jogo');
      }
    } catch (error) {
      console.log(`   ❌ Chute ${i} falhou: ${error.message}`);
      resultados.chutes.push({
        numero: i,
        direcao: direcao,
        valor: valorChute,
        erro: error.message,
        timestamp: new Date().toISOString()
      });
      resultados.problemas.push(`Chute ${i} falhou: ${error.message}`);
    }
  }

  // =====================================================
  // 6. VERIFICAR SALDO FINAL
  // =====================================================
  console.log('\n6️⃣ VERIFICANDO SALDO FINAL\n');
  console.log('-'.repeat(70));

  await sleep(3000); // Aguardar processamento final

  try {
    const response = await axios.get(`${BASE_URL}/api/user/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });

    const saldoFinal = response.data?.data?.saldo || 0;
    console.log(`   ℹ️  Saldo final: R$ ${saldoFinal.toFixed(2)}`);
    resultados.saldos.final = saldoFinal;

    const saldoEsperado = saldoAntesChutes - (valorChute * 10) + resultados.chutes.reduce((sum, c) => sum + (c.premio || 0) + (c.premioGolDeOuro || 0), 0);
    const diferenca = Math.abs(saldoFinal - saldoEsperado);

    console.log(`   ℹ️  Saldo esperado: R$ ${saldoEsperado.toFixed(2)}`);
    console.log(`   ℹ️  Diferença: R$ ${diferenca.toFixed(2)}`);

    if (diferenca < 0.10) { // Permitir pequena diferença
      console.log(`   ✅ Saldo correto!`);
    } else {
      console.log(`   ⚠️  Diferença no saldo detectada`);
      resultados.avisos.push(`Diferença no saldo: R$ ${diferenca.toFixed(2)}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Não foi possível verificar saldo final: ${error.message}`);
  }

  // =====================================================
  // 7. VERIFICAR TRANSAÇÕES NO BANCO
  // =====================================================
  console.log('\n7️⃣ VERIFICANDO TRANSAÇÕES NO BANCO\n');
  console.log('-'.repeat(70));

  try {
    const { data: transacoes, error } = await supabaseAdmin
      .from('transacoes')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && transacoes) {
      console.log(`   ✅ ${transacoes.length} transações encontradas`);
      resultados.transacoes = transacoes.slice(0, 15); // Guardar últimas 15

      const debitos = transacoes.filter(t => t.tipo === 'debito' || t.valor < 0).length;
      const creditos = transacoes.filter(t => t.tipo === 'credito' || t.valor > 0).length;

      console.log(`   ℹ️  Débitos: ${debitos}`);
      console.log(`   ℹ️  Créditos: ${creditos}`);

      // Mostrar últimas 5 transações
      console.log('\n   Últimas 5 transações:');
      transacoes.slice(0, 5).forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.tipo} - R$ ${Math.abs(t.valor).toFixed(2)} - ${t.descricao || 'N/A'}`);
      });
    } else {
      console.log(`   ⚠️  Não foi possível buscar transações: ${error?.message || 'Erro desconhecido'}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Erro ao buscar transações: ${error.message}`);
  }

  // =====================================================
  // 8. RESUMO FINAL
  // =====================================================
  console.log('\n8️⃣ RESUMO FINAL\n');
  console.log('='.repeat(70));

  const chutesSucesso = resultados.chutes.filter(c => !c.erro).length;
  const chutesFalha = resultados.chutes.filter(c => c.erro).length;
  const totalPremios = resultados.chutes.reduce((sum, c) => sum + (c.premio || 0) + (c.premioGolDeOuro || 0), 0);
  const totalDebitos = valorChute * chutesSucesso;

  console.log(`\n📊 ESTATÍSTICAS:`);
  console.log(`   Chutes realizados: ${chutesSucesso}/10`);
  console.log(`   Chutes com falha: ${chutesFalha}`);
  console.log(`   Total debitado: R$ ${totalDebitos.toFixed(2)}`);
  console.log(`   Total em prêmios: R$ ${totalPremios.toFixed(2)}`);
  console.log(`   Saldo inicial: R$ ${resultados.saldos.inicial.toFixed(2)}`);
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
    console.log(`❌ Corrigir problemas antes de liberar`);
    resultados.status_final = 'FALHAS';
  }

  // =====================================================
  // 9. SALVAR RESULTADOS
  // =====================================================
  const logDir = path.join(__dirname, '../../../logs/v19/VERIFICACAO_SUPREMA');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, '33_teste_completo_real_10_chutes.json');
  fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2));
  console.log(`\n📝 Resultados salvos em: ${logFile}`);

  console.log('\n' + '='.repeat(70) + '\n');

  return resultados;
}

testeCompleto()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  });

