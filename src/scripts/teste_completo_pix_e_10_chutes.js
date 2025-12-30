require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_BASE_URL || 'https://goldeouro-backend-v2.fly.dev';
const EMAIL = 'free10signer@gmail.com';
const SENHA = 'Free10signer';
const VALOR_PIX = 10.00; // R$ 10 para garantir 10 chutes

// Criar diretório de logs se não existir
const logsDir = path.join(__dirname, '../../logs/v19/VERIFICACAO_SUPREMA');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const resultados = {
  timestamp: new Date().toISOString(),
  email: EMAIL,
  valorPix: VALOR_PIX,
  etapas: []
};

async function logEtapa(nome, status, dados = {}) {
  const etapa = {
    nome,
    status,
    timestamp: new Date().toISOString(),
    ...dados
  };
  resultados.etapas.push(etapa);
  console.log(`\n${status === 'sucesso' ? '✅' : '❌'} ${nome}`);
  if (dados.mensagem) console.log(`   ${dados.mensagem}`);
  if (dados.detalhes) console.log(`   ${dados.detalhes}`);
}

async function fazerLogin() {
  try {
    console.log('\n======================================================================');
    console.log('1️⃣  FAZENDO LOGIN');
    console.log('======================================================================\n');
    
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: EMAIL,
      password: SENHA
    });

    // Tentar diferentes formatos de resposta
    const token = response.data.token || 
                  response.data.data?.token || 
                  response.data.access_token ||
                  (response.data.success && response.data.data?.access_token);
    
    const userId = response.data.user?.id || 
                   response.data.data?.user?.id ||
                   response.data.userId;

    if (token) {
      await logEtapa('Login', 'sucesso', {
        mensagem: 'Login realizado com sucesso',
        userId: userId
      });
      
      return { token, userId };
    } else {
      console.error('Resposta completa:', JSON.stringify(response.data, null, 2));
      throw new Error('Token não retornado na resposta');
    }
  } catch (error) {
    await logEtapa('Login', 'erro', {
      mensagem: error.response?.data?.message || error.message,
      resposta: error.response?.data
    });
    throw error;
  }
}

async function gerarPix(token, userId) {
  try {
    console.log('\n======================================================================');
    console.log('2️⃣  GERANDO CÓDIGO PIX');
    console.log('======================================================================\n');
    
    const response = await axios.post(
      `${API_BASE_URL}/api/payments/pix/criar`,
      {
        valor: VALOR_PIX
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    // Tentar diferentes formatos de resposta
    const pixData = response.data.pix || 
                    response.data.data || 
                    response.data;
    
    if (pixData) {
      const codigoPix = pixData.copy_and_paste || 
                        pixData.pix_copy_paste || 
                        pixData.qr_code ||
                        pixData.qr_code_base64 ||
                        (pixData.data && pixData.data.copy_and_paste) ||
                        (pixData.data && pixData.data.pix_copy_paste);
      
      const paymentId = pixData.payment_id || 
                        pixData.id || 
                        pixData.pix_id;
      
      if (codigoPix) {
        await logEtapa('Geração PIX', 'sucesso', {
          mensagem: `PIX gerado com sucesso - Valor: R$ ${VALOR_PIX}`,
          paymentId: paymentId
        });
        
        // Exibir código PIX de forma destacada
        console.log('\n' + '='.repeat(70));
        console.log('💰 CÓDIGO PIX PARA PAGAMENTO');
        console.log('='.repeat(70));
        console.log(`\nValor: R$ ${VALOR_PIX.toFixed(2)}`);
        console.log(`\n📋 CÓDIGO COPIA E COLAR:\n`);
        console.log(codigoPix);
        console.log(`\n${'='.repeat(70)}\n`);
        
        return { codigoPix, paymentId };
      } else {
        console.error('Resposta completa do PIX:', JSON.stringify(response.data, null, 2));
        throw new Error('Código PIX não encontrado na resposta');
      }
    } else {
      console.error('Resposta completa:', JSON.stringify(response.data, null, 2));
      throw new Error('Dados do PIX não retornados');
    }
  } catch (error) {
    await logEtapa('Geração PIX', 'erro', {
      mensagem: error.response?.data?.message || error.message,
      resposta: error.response?.data
    });
    throw error;
  }
}

async function verificarSaldo(token) {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      const saldo = response.data.user?.saldo || response.data.data?.saldo || 0;
      return parseFloat(saldo);
    }
    return 0;
  } catch (error) {
    console.error('Erro ao verificar saldo:', error.message);
    return 0;
  }
}

async function aguardarPagamento(token, saldoInicial) {
  console.log('\n======================================================================');
  console.log('3️⃣  AGUARDANDO PAGAMENTO PIX');
  console.log('======================================================================\n');
  console.log('⏳ Aguardando processamento do webhook (30 segundos)...\n');
  
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  let saldoAtual = await verificarSaldo(token);
  let tentativas = 0;
  const maxTentativas = 10;
  
  while (saldoAtual <= saldoInicial && tentativas < maxTentativas) {
    tentativas++;
    console.log(`   Tentativa ${tentativas}/${maxTentativas}: Saldo atual: R$ ${saldoAtual.toFixed(2)}`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    saldoAtual = await verificarSaldo(token);
  }
  
  if (saldoAtual > saldoInicial) {
    await logEtapa('Pagamento PIX', 'sucesso', {
      mensagem: `Crédito confirmado! Saldo: R$ ${saldoAtual.toFixed(2)}`,
      saldoAnterior: saldoInicial,
      saldoAtual: saldoAtual,
      creditado: saldoAtual - saldoInicial
    });
  } else {
    await logEtapa('Pagamento PIX', 'aviso', {
      mensagem: `Saldo ainda não atualizado. Saldo atual: R$ ${saldoAtual.toFixed(2)}`,
      saldoAnterior: saldoInicial,
      saldoAtual: saldoAtual
    });
  }
  
  return saldoAtual;
}

async function realizarChute(token, numeroChute, direcoes) {
  try {
    const direction = direcoes[numeroChute % direcoes.length];
    const amount = 1.00;
    
    const response = await axios.post(
      `${API_BASE_URL}/api/games/shoot`,
      {
        direction: direction,
        amount: amount
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      const resultado = response.data.result || 'miss';
      const premio = response.data.prize || 0;
      const loteId = response.data.loteId || 'N/A';
      
      return {
        sucesso: true,
        direction,
        resultado,
        premio: parseFloat(premio),
        loteId
      };
    } else {
      return {
        sucesso: false,
        erro: response.data.message || 'Erro desconhecido'
      };
    }
  } catch (error) {
    return {
      sucesso: false,
      erro: error.response?.data?.message || error.message
    };
  }
}

async function testar10Chutes(token) {
  console.log('\n======================================================================');
  console.log('4️⃣  REALIZANDO 10 CHUTES NO JOGO');
  console.log('======================================================================\n');
  
  const direcoes = ['left', 'right', 'center', 'up', 'down'];
  const chutes = [];
  let totalDebitado = 0;
  let totalPremios = 0;
  
  const saldoAntes = await verificarSaldo(token);
  
  for (let i = 1; i <= 10; i++) {
    console.log(`\n   Chute ${i}/10:`);
    console.log('   ' + '-'.repeat(66));
    
    const resultado = await realizarChute(token, i - 1, direcoes);
    
    if (resultado.sucesso) {
      totalDebitado += 1.00;
      totalPremios += resultado.premio;
      
      console.log(`   ✅ Chute processado`);
      console.log(`   ℹ️  Direção: ${resultado.direction}`);
      console.log(`   ℹ️  Resultado: ${resultado.resultado}`);
      console.log(`   ℹ️  Lote ID: ${resultado.loteId}`);
      console.log(`   ℹ️  Prêmio: R$ ${resultado.premio.toFixed(2)}`);
      console.log(`   ℹ️  Progresso: ${i}/10`);
      
      chutes.push({
        numero: i,
        status: 'sucesso',
        ...resultado
      });
    } else {
      console.log(`   ❌ Chute ${i} falhou: ${resultado.erro}`);
      
      chutes.push({
        numero: i,
        status: 'falha',
        erro: resultado.erro
      });
    }
    
    // Pequena pausa entre chutes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const saldoDepois = await verificarSaldo(token);
  
  await logEtapa('Teste 10 Chutes', 'sucesso', {
    mensagem: `${chutes.filter(c => c.status === 'sucesso').length}/10 chutes processados`,
    totalDebitado: totalDebitado,
    totalPremios: totalPremios,
    saldoAntes: saldoAntes,
    saldoDepois: saldoDepois
  });
  
  return {
    chutes,
    totalDebitado,
    totalPremios,
    saldoAntes,
    saldoDepois
  };
}

async function main() {
  try {
    console.log('\n🧪 TESTE COMPLETO: PIX + 10 CHUTES');
    console.log('======================================================================\n');
    
    // 1. Login
    const { token, userId } = await fazerLogin();
    
    // 2. Verificar saldo inicial
    const saldoInicial = await verificarSaldo(token);
    resultados.saldoInicial = saldoInicial;
    console.log(`\n💰 Saldo inicial: R$ ${saldoInicial.toFixed(2)}\n`);
    
    // 3. Gerar PIX
    const { codigoPix, paymentId } = await gerarPix(token, userId);
    resultados.codigoPix = codigoPix;
    resultados.paymentId = paymentId;
    
    // 4. Aguardar pagamento
    console.log('\n⚠️  IMPORTANTE: Copie o código PIX acima e efetue o pagamento.');
    console.log('   Após o pagamento, o sistema continuará automaticamente...\n');
    
    const saldoAposPix = await aguardarPagamento(token, saldoInicial);
    resultados.saldoAposPix = saldoAposPix;
    
    // 5. Testar 10 chutes
    const resultadoChutes = await testar10Chutes(token);
    resultados.resultadoChutes = resultadoChutes;
    
    // 6. Resumo final
    console.log('\n======================================================================');
    console.log('5️⃣  RESUMO FINAL');
    console.log('======================================================================\n');
    
    const chutesSucesso = resultadoChutes.chutes.filter(c => c.status === 'sucesso').length;
    const chutesFalha = resultadoChutes.chutes.filter(c => c.status === 'falha').length;
    
    console.log('📊 ESTATÍSTICAS:');
    console.log(`   Chutes realizados: ${chutesSucesso}/10`);
    console.log(`   Chutes com falha: ${chutesFalha}`);
    console.log(`   Total debitado: R$ ${resultadoChutes.totalDebitado.toFixed(2)}`);
    console.log(`   Total em prêmios: R$ ${resultadoChutes.totalPremios.toFixed(2)}`);
    console.log(`   Saldo após PIX: R$ ${saldoAposPix.toFixed(2)}`);
    console.log(`   Saldo final: R$ ${resultadoChutes.saldoDepois.toFixed(2)}`);
    
    if (chutesFalha > 0) {
      console.log(`\n❌ PROBLEMAS (${chutesFalha}):`);
      resultadoChutes.chutes
        .filter(c => c.status === 'falha')
        .forEach((c, idx) => {
          console.log(`   ${idx + 1}. Chute ${c.numero} falhou: ${c.erro}`);
        });
    }
    
    // Salvar resultados
    const logFile = path.join(logsDir, `36_teste_completo_pix_10_chutes_${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2));
    console.log(`\n📝 Resultados salvos em: ${logFile}\n`);
    
    console.log('======================================================================\n');
    
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error.message);
    resultados.erro = error.message;
    
    const logFile = path.join(logsDir, `36_teste_completo_pix_10_chutes_ERRO_${Date.now()}.json`);
    fs.writeFileSync(logFile, JSON.stringify(resultados, null, 2));
    
    process.exit(1);
  }
}

main();

