/**
 * 🧪 TESTE COMPLETO EM PRODUÇÃO REAL
 * 
 * Este script realiza testes completos usando credenciais reais
 * e gera código PIX para teste de pagamento real.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurações
const CONFIG = {
  backend: {
    url: process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev',
    apiBase: process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev/api'
  },
  credenciais: {
    email: 'free10signer@gmail.com',
    senha: 'Free10signer'
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY
  }
};

// Resultados dos testes
const resultados = {
  timestamp: new Date().toISOString(),
  versao: 'V19.0.0',
  status: 'EM_ANDAMENTO',
  testes: {
    login: {},
    registro: {},
    deposito: {},
    jogo: {},
    saque: {}
  },
  codigoPIX: null,
  tokenJWT: null,
  problemas: [],
  sucessos: []
};

// Função para fazer requisição HTTP/HTTPS
function fazerRequisicao(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, {
      method: options.method || 'GET',
      timeout: options.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let body;
        try {
          body = JSON.parse(data);
        } catch (e) {
          body = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// 1. TESTE DE LOGIN
async function testarLogin() {
  console.log('\n🔐 TESTANDO LOGIN...\n');
  
  try {
    const response = await fazerRequisicao(`${CONFIG.backend.apiBase}/auth/login`, {
      method: 'POST',
      body: {
        email: CONFIG.credenciais.email,
        password: CONFIG.credenciais.senha
      }
    });

    if (response.statusCode === 200 && response.body.success) {
      resultados.tokenJWT = response.body.token || response.body.data?.token;
      resultados.testes.login = {
        status: 'OK',
        token: resultados.tokenJWT ? 'Gerado' : 'Não encontrado',
        usuario: response.body.user || response.body.data?.user
      };
      resultados.sucessos.push('✅ Login realizado com sucesso');
      console.log('✅ Login: OK');
      console.log(`   Token: ${resultados.tokenJWT ? 'Gerado' : 'Não encontrado'}`);
      return true;
    } else {
      resultados.testes.login = {
        status: 'ERRO',
        erro: response.body.message || 'Erro desconhecido',
        statusCode: response.statusCode
      };
      resultados.problemas.push(`❌ Erro no login: ${response.body.message || response.statusCode}`);
      console.log(`❌ Login: ${response.body.message || response.statusCode}`);
      return false;
    }
  } catch (error) {
    resultados.testes.login = {
      status: 'ERRO',
      erro: error.message
    };
    resultados.problemas.push(`❌ Erro ao fazer login: ${error.message}`);
    console.log(`❌ Login: ${error.message}`);
    return false;
  }
}

// 2. TESTE DE REGISTRO (se login falhar)
async function testarRegistro() {
  console.log('\n📝 TESTANDO REGISTRO...\n');
  
  try {
    const response = await fazerRequisicao(`${CONFIG.backend.apiBase}/auth/register`, {
      method: 'POST',
      body: {
        email: CONFIG.credenciais.email,
        password: CONFIG.credenciais.senha,
        nome: 'Teste Automatizado',
        username: 'teste_auto_' + Date.now()
      }
    });

    if (response.statusCode === 200 || response.statusCode === 201) {
      resultados.testes.registro = {
        status: 'OK',
        usuario: response.body.user || response.body.data?.user
      };
      resultados.sucessos.push('✅ Registro realizado com sucesso');
      console.log('✅ Registro: OK');
      
      // Tentar fazer login após registro
      return await testarLogin();
    } else {
      resultados.testes.registro = {
        status: 'ERRO',
        erro: response.body.message || 'Erro desconhecido',
        statusCode: response.statusCode
      };
      resultados.problemas.push(`❌ Erro no registro: ${response.body.message || response.statusCode}`);
      console.log(`❌ Registro: ${response.body.message || response.statusCode}`);
      return false;
    }
  } catch (error) {
    resultados.testes.registro = {
      status: 'ERRO',
      erro: error.message
    };
    resultados.problemas.push(`❌ Erro ao fazer registro: ${error.message}`);
    console.log(`❌ Registro: ${error.message}`);
    return false;
  }
}

// 3. TESTE DE DEPÓSITO PIX
async function testarDepositoPIX() {
  console.log('\n💳 TESTANDO DEPÓSITO PIX...\n');
  
  if (!resultados.tokenJWT) {
    resultados.problemas.push('❌ Token JWT não disponível para criar depósito');
    console.log('❌ Depósito: Token JWT não disponível');
    return false;
  }

  try {
    const response = await fazerRequisicao(`${CONFIG.backend.apiBase}/payments/pix/criar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resultados.tokenJWT}`
      },
      body: {
        valor: 5.00,
        descricao: 'Teste automatizado - Depósito PIX R$5'
      }
    });

    if (response.statusCode === 200 || response.statusCode === 201) {
      const pixData = response.body.data || response.body;
      
      resultados.codigoPIX = pixData.qr_code || pixData.qrCode || pixData.codigo_pix || pixData.codigoPix;
      resultados.testes.deposito = {
        status: 'OK',
        valor: 5.00,
        transactionId: pixData.id || pixData.transaction_id || pixData.transactionId,
        qrCode: resultados.codigoPIX ? 'Gerado' : 'Não encontrado',
        qrCodeBase64: pixData.qr_code_base64 || pixData.qrCodeBase64,
        dadosCompletos: pixData
      };
      
      resultados.sucessos.push('✅ Depósito PIX criado com sucesso');
      console.log('✅ Depósito PIX: OK');
      console.log(`   Valor: R$ 5,00`);
      console.log(`   Transaction ID: ${resultados.testes.deposito.transactionId}`);
      
      if (resultados.codigoPIX) {
        console.log(`\n📱 CÓDIGO PIX GERADO:`);
        console.log(`   ${resultados.codigoPIX}`);
        console.log(`\n💡 INSTRUÇÕES:`);
        console.log(`   1. Copie o código PIX acima`);
        console.log(`   2. Abra seu app de banco`);
        console.log(`   3. Cole o código e faça o pagamento de R$ 5,00`);
        console.log(`   4. Aguarde alguns segundos para o webhook processar`);
        console.log(`   5. Informe quando o pagamento for concluído para continuar os testes\n`);
      }
      
      return true;
    } else {
      resultados.testes.deposito = {
        status: 'ERRO',
        erro: response.body.message || 'Erro desconhecido',
        statusCode: response.statusCode,
        body: response.body
      };
      resultados.problemas.push(`❌ Erro ao criar depósito PIX: ${response.body.message || response.statusCode}`);
      console.log(`❌ Depósito PIX: ${response.body.message || response.statusCode}`);
      console.log(`   Resposta completa:`, JSON.stringify(response.body, null, 2));
      return false;
    }
  } catch (error) {
    resultados.testes.deposito = {
      status: 'ERRO',
      erro: error.message
    };
    resultados.problemas.push(`❌ Erro ao criar depósito PIX: ${error.message}`);
    console.log(`❌ Depósito PIX: ${error.message}`);
    return false;
  }
}

// 4. VERIFICAR SALDO APÓS PAGAMENTO
async function verificarSaldo() {
  console.log('\n💰 VERIFICANDO SALDO...\n');
  
  if (!resultados.tokenJWT) {
    console.log('⚠️ Saldo: Token JWT não disponível');
    return false;
  }

  try {
    const response = await fazerRequisicao(`${CONFIG.backend.apiBase}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${resultados.tokenJWT}`
      }
    });

    if (response.statusCode === 200) {
      const userData = response.body.data || response.body.user || response.body;
      const saldo = userData.saldo || userData.balance || 0;
      
      resultados.testes.saldo = {
        status: 'OK',
        saldo: saldo,
        usuario: userData
      };
      
      console.log(`✅ Saldo atual: R$ ${saldo.toFixed(2)}`);
      
      if (saldo >= 5.00) {
        resultados.sucessos.push(`✅ Saldo verificado: R$ ${saldo.toFixed(2)}`);
        return true;
      } else {
        resultados.problemas.push(`⚠️ Saldo insuficiente: R$ ${saldo.toFixed(2)} (esperado: R$ 5,00)`);
        console.log(`⚠️ Saldo insuficiente para testar jogo`);
        return false;
      }
    } else {
      console.log(`⚠️ Erro ao verificar saldo: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️ Erro ao verificar saldo: ${error.message}`);
    return false;
  }
}

// 5. TESTE DE JOGO
async function testarJogo() {
  console.log('\n⚽ TESTANDO JOGO...\n');
  
  if (!resultados.tokenJWT) {
    resultados.problemas.push('❌ Token JWT não disponível para testar jogo');
    console.log('❌ Jogo: Token JWT não disponível');
    return false;
  }

  // Verificar saldo primeiro
  const saldoOk = await verificarSaldo();
  if (!saldoOk) {
    resultados.problemas.push('⚠️ Saldo insuficiente para testar jogo');
    console.log('⚠️ Jogo: Saldo insuficiente');
    return false;
  }

  try {
    // Criar chute/aposta
    const response = await fazerRequisicao(`${CONFIG.backend.apiBase}/game/shoot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resultados.tokenJWT}`
      },
      body: {
        valor: 1.00,
        zona: Math.floor(Math.random() * 5) + 1 // Zona aleatória de 1 a 5
      }
    });

    if (response.statusCode === 200 || response.statusCode === 201) {
      const gameData = response.body.data || response.body;
      
      resultados.testes.jogo = {
        status: 'OK',
        valorAposta: 1.00,
        resultado: gameData.resultado || gameData.result,
        gol: gameData.gol || false,
        premio: gameData.premio || gameData.reward || 0,
        dadosCompletos: gameData
      };
      
      resultados.sucessos.push('✅ Jogo testado com sucesso');
      console.log('✅ Jogo: OK');
      console.log(`   Valor apostado: R$ 1,00`);
      console.log(`   Resultado: ${gameData.resultado || gameData.result || 'Processado'}`);
      console.log(`   Gol: ${gameData.gol ? 'SIM' : 'NÃO'}`);
      if (gameData.premio || gameData.reward) {
        console.log(`   Prêmio: R$ ${(gameData.premio || gameData.reward).toFixed(2)}`);
      }
      
      return true;
    } else {
      resultados.testes.jogo = {
        status: 'ERRO',
        erro: response.body.message || 'Erro desconhecido',
        statusCode: response.statusCode,
        body: response.body
      };
      resultados.problemas.push(`❌ Erro ao testar jogo: ${response.body.message || response.statusCode}`);
      console.log(`❌ Jogo: ${response.body.message || response.statusCode}`);
      console.log(`   Resposta completa:`, JSON.stringify(response.body, null, 2));
      return false;
    }
  } catch (error) {
    resultados.testes.jogo = {
      status: 'ERRO',
      erro: error.message
    };
    resultados.problemas.push(`❌ Erro ao testar jogo: ${error.message}`);
    console.log(`❌ Jogo: ${error.message}`);
    return false;
  }
}

// 6. TESTE DE SAQUE
async function testarSaque() {
  console.log('\n💸 TESTANDO SAQUE...\n');
  
  if (!resultados.tokenJWT) {
    resultados.problemas.push('❌ Token JWT não disponível para testar saque');
    console.log('❌ Saque: Token JWT não disponível');
    return false;
  }

  try {
    const response = await fazerRequisicao(`${CONFIG.backend.apiBase}/payments/withdraw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resultados.tokenJWT}`
      },
      body: {
        valor: 2.00,
        chavePix: 'free10signer@gmail.com',
        tipoChave: 'EMAIL'
      }
    });

    if (response.statusCode === 200 || response.statusCode === 201) {
      resultados.testes.saque = {
        status: 'OK',
        valor: 2.00,
        saqueId: response.body.id || response.body.data?.id,
        dadosCompletos: response.body.data || response.body
      };
      
      resultados.sucessos.push('✅ Saque testado com sucesso');
      console.log('✅ Saque: OK');
      console.log(`   Valor: R$ 2,00`);
      return true;
    } else {
      resultados.testes.saque = {
        status: 'ERRO',
        erro: response.body.message || 'Erro desconhecido',
        statusCode: response.statusCode
      };
      resultados.problemas.push(`⚠️ Erro ao testar saque: ${response.body.message || response.statusCode}`);
      console.log(`⚠️ Saque: ${response.body.message || response.statusCode}`);
      return false;
    }
  } catch (error) {
    resultados.testes.saque = {
      status: 'ERRO',
      erro: error.message
    };
    resultados.problemas.push(`⚠️ Erro ao testar saque: ${error.message}`);
    console.log(`⚠️ Saque: ${error.message}`);
    return false;
  }
}

// FUNÇÃO PRINCIPAL
async function executar() {
  console.log('\n🧪 EXECUTANDO TESTES COMPLETOS EM PRODUÇÃO REAL\n');
  console.log('='.repeat(70));
  console.log(`\n📧 Email: ${CONFIG.credenciais.email}`);
  console.log(`💰 Valor do Depósito: R$ 5,00\n`);
  console.log('='.repeat(70));
  
  try {
    // 1. Tentar fazer login
    let loginOk = await testarLogin();
    
    // 2. Se login falhar, tentar registro
    if (!loginOk) {
      console.log('\n⚠️ Login falhou, tentando registro...\n');
      loginOk = await testarRegistro();
    }
    
    if (!loginOk) {
      resultados.status = 'ERRO';
      resultados.problemas.push('❌ Não foi possível fazer login ou registro');
      console.log('\n❌ ERRO: Não foi possível fazer login ou registro');
      console.log('   Verifique as credenciais e tente novamente.\n');
    } else {
      // 3. Criar depósito PIX
      const depositoOk = await testarDepositoPIX();
      
      if (depositoOk && resultados.codigoPIX) {
        // Aguardar pagamento do usuário
        console.log('\n' + '='.repeat(70));
        console.log('\n⏳ AGUARDANDO PAGAMENTO PIX...\n');
        console.log('📱 CÓDIGO PIX PARA PAGAMENTO:');
        console.log('\n' + resultados.codigoPIX);
        console.log('\n💡 Após fazer o pagamento, informe "pagamento concluído" para continuar os testes.\n');
        console.log('='.repeat(70));
        
        // Salvar resultados parciais
        resultados.status = 'AGUARDANDO_PAGAMENTO';
        const outputDir = path.join(__dirname, '../../logs/v19/VERIFICACAO_SUPREMA');
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }
        const outputFile = path.join(outputDir, '11_teste_completo_producao_real.json');
        fs.writeFileSync(outputFile, JSON.stringify(resultados, null, 2));
        
        return resultados;
      }
    }
    
    // Atualizar status final
    resultados.status = loginOk ? 'PARCIAL' : 'ERRO';
    
    // Salvar resultados
    const outputDir = path.join(__dirname, '../../logs/v19/VERIFICACAO_SUPREMA');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputFile = path.join(outputDir, '11_teste_completo_producao_real.json');
    fs.writeFileSync(outputFile, JSON.stringify(resultados, null, 2));
    
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMO DOS TESTES:\n');
    console.log(`✅ Sucessos: ${resultados.sucessos.length}`);
    console.log(`⚠️ Problemas: ${resultados.problemas.length}`);
    console.log(`\n📁 Resultados salvos em: ${outputFile}\n`);
    
    return resultados;
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO:', error);
    resultados.status = 'ERRO';
    resultados.erroCritico = error.message;
    throw error;
  }
}

// Função para continuar testes após pagamento
async function continuarTestesAposPagamento() {
  console.log('\n🔄 CONTINUANDO TESTES APÓS PAGAMENTO...\n');
  
  // Aguardar alguns segundos para webhook processar
  console.log('⏳ Aguardando 10 segundos para webhook processar...\n');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Verificar saldo
  const saldoOk = await verificarSaldo();
  
  if (saldoOk) {
    // Testar jogo
    await testarJogo();
    
    // Verificar saldo novamente após jogo
    await verificarSaldo();
    
    // Testar saque (opcional)
    // await testarSaque();
  }
  
  // Atualizar status final
  resultados.status = 'COMPLETO';
  
  // Salvar resultados finais
  const outputDir = path.join(__dirname, '../../logs/v19/VERIFICACAO_SUPREMA');
  const outputFile = path.join(outputDir, '11_teste_completo_producao_real.json');
  fs.writeFileSync(outputFile, JSON.stringify(resultados, null, 2));
  
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 RESUMO FINAL DOS TESTES:\n');
  console.log(`✅ Sucessos: ${resultados.sucessos.length}`);
  console.log(`⚠️ Problemas: ${resultados.problemas.length}`);
  console.log(`\n📁 Resultados salvos em: ${outputFile}\n`);
  
  return resultados;
}

// Executar se chamado diretamente
if (require.main === module) {
  executar()
    .then((resultados) => {
      if (resultados.status === 'AGUARDANDO_PAGAMENTO') {
        console.log('\n✅ Código PIX gerado com sucesso!');
        console.log('   Aguarde o pagamento para continuar os testes.\n');
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { executar, continuarTestesAposPagamento };

