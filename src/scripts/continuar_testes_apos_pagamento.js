/**
 * 🔄 CONTINUAR TESTES APÓS PAGAMENTO PIX
 * 
 * Execute este script após fazer o pagamento PIX para continuar os testes.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
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
  }
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

// Função principal
async function executar() {
  console.log('\n🔄 CONTINUANDO TESTES APÓS PAGAMENTO PIX\n');
  console.log('='.repeat(70));
  
  let tokenJWT = null;
  const resultados = {
    timestamp: new Date().toISOString(),
    sucessos: [],
    problemas: []
  };

  try {
    // 1. Fazer login novamente
    console.log('\n🔐 Fazendo login...\n');
    const loginResponse = await fazerRequisicao(`${CONFIG.backend.apiBase}/auth/login`, {
      method: 'POST',
      body: {
        email: CONFIG.credenciais.email,
        password: CONFIG.credenciais.senha
      }
    });

    if (loginResponse.statusCode === 200 && loginResponse.body.success) {
      tokenJWT = loginResponse.body.token || loginResponse.body.data?.token;
      resultados.sucessos.push('✅ Login realizado com sucesso');
      console.log('✅ Login: OK');
    } else {
      resultados.problemas.push('❌ Erro ao fazer login');
      console.log('❌ Login: Falhou');
      return;
    }

    // 2. Aguardar processamento do webhook
    console.log('\n⏳ Aguardando 15 segundos para webhook processar pagamento...\n');
    await new Promise(resolve => setTimeout(resolve, 15000));

    // 3. Verificar saldo
    console.log('💰 Verificando saldo...\n');
    const userResponse = await fazerRequisicao(`${CONFIG.backend.apiBase}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenJWT}`
      }
    });

    if (userResponse.statusCode === 200) {
      const userData = userResponse.body.data || userResponse.body.user || userResponse.body;
      const saldo = userData.saldo || userData.balance || 0;
      
      console.log(`✅ Saldo atual: R$ ${saldo.toFixed(2)}\n`);
      
      if (saldo >= 5.00) {
        resultados.sucessos.push(`✅ Saldo creditado corretamente: R$ ${saldo.toFixed(2)}`);
        
        // 4. Testar jogo
        console.log('⚽ Testando jogo...\n');
        const gameResponse = await fazerRequisicao(`${CONFIG.backend.apiBase}/games/shoot`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenJWT}`
          },
          body: {
            direction: Math.floor(Math.random() * 5) + 1, // Direção de 1 a 5
            amount: 1.00 // Valor da aposta
          }
        });

        if (gameResponse.statusCode === 200 || gameResponse.statusCode === 201) {
          const gameData = gameResponse.body.data || gameResponse.body;
          resultados.sucessos.push('✅ Jogo testado com sucesso');
          console.log('✅ Jogo: OK');
          console.log(`   Valor apostado: R$ 1,00`);
          console.log(`   Resultado: ${gameData.resultado || gameData.result || 'Processado'}`);
          console.log(`   Gol: ${gameData.gol ? 'SIM ✅' : 'NÃO ❌'}`);
          if (gameData.premio || gameData.reward) {
            console.log(`   Prêmio: R$ ${(gameData.premio || gameData.reward).toFixed(2)}`);
          }
        } else {
          resultados.problemas.push(`⚠️ Erro ao testar jogo: ${gameResponse.body.message || gameResponse.statusCode}`);
          console.log(`⚠️ Jogo: ${gameResponse.body.message || gameResponse.statusCode}`);
        }

        // 5. Verificar saldo após jogo
        console.log('\n💰 Verificando saldo após jogo...\n');
        const userResponse2 = await fazerRequisicao(`${CONFIG.backend.apiBase}/user/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${tokenJWT}`
          }
        });

        if (userResponse2.statusCode === 200) {
          const userData2 = userResponse2.body.data || userResponse2.body.user || userResponse2.body;
          const saldoFinal = userData2.saldo || userData2.balance || 0;
          console.log(`✅ Saldo final: R$ ${saldoFinal.toFixed(2)}\n`);
        }
      } else {
        resultados.problemas.push(`⚠️ Saldo não foi creditado ainda. Saldo atual: R$ ${saldo.toFixed(2)}`);
        console.log(`⚠️ Saldo insuficiente: R$ ${saldo.toFixed(2)}`);
        console.log('   Aguarde mais alguns segundos e execute novamente.\n');
      }
    } else {
      resultados.problemas.push('❌ Erro ao verificar saldo');
      console.log('❌ Erro ao verificar saldo');
    }

    // Resumo final
    console.log('='.repeat(70));
    console.log('\n📊 RESUMO DOS TESTES:\n');
    console.log(`✅ Sucessos: ${resultados.sucessos.length}`);
    resultados.sucessos.forEach(s => console.log(`   ${s}`));
    
    if (resultados.problemas.length > 0) {
      console.log(`\n⚠️ Problemas: ${resultados.problemas.length}`);
      resultados.problemas.forEach(p => console.log(`   ${p}`));
    }
    
    console.log('\n' + '='.repeat(70));
    
    // Salvar resultados
    const outputDir = path.join(__dirname, '../../logs/v19/VERIFICACAO_SUPREMA');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputFile = path.join(outputDir, '12_testes_apos_pagamento.json');
    fs.writeFileSync(outputFile, JSON.stringify(resultados, null, 2));
    console.log(`\n📁 Resultados salvos em: ${outputFile}\n`);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    resultados.problemas.push(`❌ Erro: ${error.message}`);
  }
}

// Executar
if (require.main === module) {
  executar()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { executar };

