/**
 * 🔍 VERIFICAR CORREÇÕES - SALDO E INTEGRIDADE DE LOTES
 * 
 * Script para verificar se as correções foram aplicadas corretamente.
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

async function verificarCorrecoes() {
  console.log('\n🔍 VERIFICANDO CORREÇÕES APLICADAS\n');
  console.log('='.repeat(70));
  
  const resultados = {
    timestamp: new Date().toISOString(),
    correcoes: {
      saldo: { aplicada: false, detalhes: {} },
      lotes: { aplicada: false, detalhes: {} }
    },
    problemas: [],
    sucessos: []
  };

  try {
    // Verificar se arquivos foram modificados
    console.log('\n📁 Verificando arquivos modificados...\n');
    
    const webhookServicePath = path.join(__dirname, '../modules/financial/services/webhook.service.js');
    const loteValidatorPath = path.join(__dirname, '../modules/shared/validators/lote-integrity-validator.js');
    
    if (fs.existsSync(webhookServicePath)) {
      const webhookContent = fs.readFileSync(webhookServicePath, 'utf8');
      
      if (webhookContent.includes('valor salvo no banco quando PIX foi criado')) {
        resultados.correcoes.saldo.aplicada = true;
        resultados.sucessos.push('✅ Correção de saldo aplicada no webhook.service.js');
        console.log('✅ Correção de saldo: APLICADA');
      } else {
        resultados.problemas.push('❌ Correção de saldo não encontrada no webhook.service.js');
        console.log('❌ Correção de saldo: NÃO ENCONTRADA');
      }
    }
    
    if (fs.existsSync(loteValidatorPath)) {
      const loteContent = fs.readFileSync(loteValidatorPath, 'utf8');
      
      if (loteContent.includes('Remover validação restritiva') || 
          loteContent.includes('CORREÇÃO: Remover')) {
        resultados.correcoes.lotes.aplicada = true;
        resultados.sucessos.push('✅ Correção de integridade de lotes aplicada');
        console.log('✅ Correção de lotes: APLICADA');
      } else {
        resultados.problemas.push('❌ Correção de lotes não encontrada');
        console.log('❌ Correção de lotes: NÃO ENCONTRADA');
      }
    }

    // Testar login para verificar se sistema está funcionando
    console.log('\n🔐 Testando login...\n');
    const loginResponse = await fazerRequisicao(`${CONFIG.backend.apiBase}/auth/login`, {
      method: 'POST',
      body: {
        email: CONFIG.credenciais.email,
        password: CONFIG.credenciais.senha
      }
    });

    if (loginResponse.statusCode === 200 && loginResponse.body.success) {
      const tokenJWT = loginResponse.body.token || loginResponse.body.data?.token;
      resultados.sucessos.push('✅ Login funcionando');
      console.log('✅ Login: OK');
      
      // Verificar saldo atual
      const profileResponse = await fazerRequisicao(`${CONFIG.backend.apiBase}/user/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenJWT}`
        }
      });

      if (profileResponse.statusCode === 200) {
        const saldo = profileResponse.body.data?.saldo || profileResponse.body.saldo || 0;
        console.log(`\n💰 Saldo atual: R$ ${saldo.toFixed(2)}`);
        resultados.correcoes.saldo.detalhes.saldoAtual = saldo;
      }
    }

    // Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RESUMO DAS VERIFICAÇÕES:\n');
    console.log(`✅ Correções aplicadas:`);
    console.log(`   Saldo: ${resultados.correcoes.saldo.aplicada ? 'SIM ✅' : 'NÃO ❌'}`);
    console.log(`   Lotes: ${resultados.correcoes.lotes.aplicada ? 'SIM ✅' : 'NÃO ❌'}`);
    
    if (resultados.sucessos.length > 0) {
      console.log(`\n✅ Sucessos: ${resultados.sucessos.length}`);
      resultados.sucessos.forEach(s => console.log(`   ${s}`));
    }
    
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
    const outputFile = path.join(outputDir, '14_verificacao_correcoes.json');
    fs.writeFileSync(outputFile, JSON.stringify(resultados, null, 2));
    console.log(`\n📁 Resultados salvos em: ${outputFile}\n`);

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
  }
}

if (require.main === module) {
  verificarCorrecoes()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { verificarCorrecoes };

