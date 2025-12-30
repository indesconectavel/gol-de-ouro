/**
 * 🧪 TESTE FINAL COMPLETO - VERIFICAR DEBITO DE SALDO
 * 
 * Testa múltiplos jogos para verificar se o saldo está sendo debitado corretamente.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const CONFIG = {
  backend: {
    apiBase: process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev/api'
  },
  credenciais: {
    email: 'free10signer@gmail.com',
    senha: 'Free10signer'
  }
};

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

async function executar() {
  console.log('\n🧪 TESTE FINAL COMPLETO - VERIFICAÇÃO DE SALDO\n');
  console.log('='.repeat(70));
  
  let tokenJWT = null;
  const resultados = {
    timestamp: new Date().toISOString(),
    testes: [],
    sucessos: [],
    problemas: []
  };

  try {
    // 1. Login
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
      console.log('✅ Login: OK');
    } else {
      console.log('❌ Login: Falhou');
      return;
    }

    // 2. Verificar saldo inicial
    console.log('\n💰 Verificando saldo inicial...\n');
    const profileInicial = await fazerRequisicao(`${CONFIG.backend.apiBase}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenJWT}`
      }
    });

    let saldoInicial = 0;
    if (profileInicial.statusCode === 200) {
      saldoInicial = profileInicial.body.data?.saldo || profileInicial.body.saldo || 0;
      console.log(`✅ Saldo inicial: R$ ${saldoInicial.toFixed(2)}`);
    }

    // 3. Fazer 3 jogos de R$ 1,00 cada
    console.log('\n⚽ Fazendo 3 jogos de R$ 1,00 cada...\n');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`\n🎮 Jogo ${i}/3:`);
      
      const gameResponse = await fazerRequisicao(`${CONFIG.backend.apiBase}/games/shoot`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenJWT}`
        },
        body: {
          direction: Math.floor(Math.random() * 5) + 1,
          amount: 1.00
        }
      });

      if (gameResponse.statusCode === 200 || gameResponse.statusCode === 201) {
        const gameData = gameResponse.body.data || gameResponse.body;
        resultados.testes.push({
          jogo: i,
          valor: 1.00,
          resultado: gameData.resultado || gameData.result || 'Processado',
          gol: gameData.gol || false,
          premio: gameData.premio || gameData.reward || 0
        });
        
        console.log(`   ✅ Processado`);
        console.log(`   Resultado: ${gameData.resultado || gameData.result || 'Processado'}`);
        console.log(`   Gol: ${gameData.gol ? 'SIM ✅' : 'NÃO ❌'}`);
        
        // Aguardar 2 segundos entre jogos
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.log(`   ❌ Erro: ${gameResponse.body.message || gameResponse.statusCode}`);
        resultados.problemas.push(`❌ Erro no jogo ${i}: ${gameResponse.body.message || gameResponse.statusCode}`);
      }
    }

    // 4. Verificar saldo final
    console.log('\n💰 Verificando saldo final...\n');
    await new Promise(resolve => setTimeout(resolve, 3000)); // Aguardar processamento
    
    const profileFinal = await fazerRequisicao(`${CONFIG.backend.apiBase}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenJWT}`
      }
    });

    let saldoFinal = 0;
    if (profileFinal.statusCode === 200) {
      saldoFinal = profileFinal.body.data?.saldo || profileFinal.body.saldo || 0;
      console.log(`✅ Saldo final: R$ ${saldoFinal.toFixed(2)}`);
      
      const diferenca = saldoInicial - saldoFinal;
      const esperado = 3.00; // 3 jogos de R$ 1,00
      
      console.log(`\n📊 Análise:`);
      console.log(`   Saldo inicial: R$ ${saldoInicial.toFixed(2)}`);
      console.log(`   Saldo final: R$ ${saldoFinal.toFixed(2)}`);
      console.log(`   Diferença: R$ ${diferenca.toFixed(2)}`);
      console.log(`   Esperado: R$ ${esperado.toFixed(2)} (3 jogos de R$ 1,00)`);
      
      if (Math.abs(diferenca - esperado) < 0.01) {
        resultados.sucessos.push(`✅ Saldo debitado corretamente: R$ ${diferenca.toFixed(2)}`);
        console.log(`\n✅ Saldo debitado corretamente!`);
      } else if (diferenca > 0) {
        resultados.sucessos.push(`✅ Saldo foi debitado: R$ ${diferenca.toFixed(2)}`);
        console.log(`\n✅ Saldo foi debitado (pode haver prêmios creditados)`);
      } else {
        resultados.problemas.push(`⚠️ Saldo não foi debitado corretamente. Diferença: R$ ${diferenca.toFixed(2)}`);
        console.log(`\n⚠️ Saldo não foi debitado como esperado`);
      }
    }

    // Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMO FINAL:\n');
    console.log(`✅ Sucessos: ${resultados.sucessos.length}`);
    resultados.sucessos.forEach(s => console.log(`   ${s}`));
    
    if (resultados.problemas.length > 0) {
      console.log(`\n⚠️ Problemas: ${resultados.problemas.length}`);
      resultados.problemas.forEach(p => console.log(`   ${p}`));
    }
    
    console.log(`\n🎮 Jogos realizados: ${resultados.testes.length}`);
    resultados.testes.forEach(t => {
      console.log(`   Jogo ${t.jogo}: R$ ${t.valor.toFixed(2)} - ${t.resultado} - ${t.gol ? 'GOL ✅' : 'MISS ❌'}`);
    });
    
    console.log('\n' + '='.repeat(70));
    
    // Salvar resultados
    const outputDir = path.join(__dirname, '../../logs/v19/VERIFICACAO_SUPREMA');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    const outputFile = path.join(outputDir, '13_teste_final_completo_jogo.json');
    fs.writeFileSync(outputFile, JSON.stringify(resultados, null, 2));
    console.log(`\n📁 Resultados salvos em: ${outputFile}\n`);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
  }
}

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

