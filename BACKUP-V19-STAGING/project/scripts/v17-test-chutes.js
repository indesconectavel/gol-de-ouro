/**
 * V17 TEST CHUTES
 * Executa 10 chutes reais e valida resultados
 */

const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const BACKEND_URL = 'https://goldeouro-backend-v2.fly.dev';
const REPORTS_DIR = path.join(__dirname, '..', 'docs', 'GO-LIVE', 'V17');

const USER_EMAIL = 'test_v16_diag_1764865077736@example.com';
const USER_PASSWORD = 'Test123456!';

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function testarChutes() {
  console.log('\n🎯 V17 TESTANDO CHUTES\n');
  
  const resultado = {
    inicio: new Date().toISOString(),
    token: null,
    chutes: [],
    sucesso: 0,
    falhas: 0,
    loteId: null,
    erros: []
  };

  try {
    await ensureDir(REPORTS_DIR);

    // Login
    try {
      const r = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: USER_EMAIL,
        password: USER_PASSWORD
      }, { timeout: 15000, validateStatus: () => true });

      if (r.status === 200) {
        resultado.token = r.data?.token || r.data?.data?.token;
      } else {
        resultado.erros.push('FAIL_SALDO: Login falhou');
        return resultado;
      }
    } catch (e) {
      resultado.erros.push(`FAIL_SALDO: ${e.message}`);
      return resultado;
    }

    if (!resultado.token) {
      resultado.erros.push('FAIL_SALDO: Token não obtido');
      return resultado;
    }

    // Executar 10 chutes
    const directions = ['TL', 'TR', 'C', 'BL', 'BR'];
    
    for (let i = 0; i < 10; i++) {
      try {
        const r = await axios.post(`${BACKEND_URL}/api/games/shoot`, {
          direction: directions[i % directions.length],
          amount: 1
        }, {
          headers: { 'Authorization': `Bearer ${resultado.token}` },
          timeout: 15000,
          validateStatus: () => true
        });

        const chute = {
          index: i + 1,
          direction: directions[i % directions.length],
          status: r.status,
          success: r.status === 200 || r.status === 201,
          data: r.data,
          timestamp: new Date().toISOString()
        };

        resultado.chutes.push(chute);
        
        if (chute.success) {
          resultado.sucesso++;
          if (r.data?.loteId) resultado.loteId = r.data.loteId;
        } else {
          resultado.falhas++;
          if (r.data?.message?.includes('Saldo')) {
            resultado.erros.push('FAIL_SALDO');
          } else {
            resultado.erros.push(`FAIL_CHUTE: ${r.data?.message || 'Erro desconhecido'}`);
          }
        }

        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (e) {
        resultado.falhas++;
        resultado.chutes.push({
          index: i + 1,
          error: e.message,
          success: false
        });
        resultado.erros.push(`FAIL_CHUTE: ${e.message}`);
      }
    }

    resultado.fim = new Date().toISOString();
    
    const report = `# 🎯 V17 TESTE DE CHUTES
## Data: ${new Date().toISOString().split('T')[0]}

## Resultados:
- Total: ${resultado.chutes.length}
- Sucesso: ${resultado.sucesso}
- Falhas: ${resultado.falhas}
- Taxa de Sucesso: ${(resultado.sucesso / 10 * 100).toFixed(1)}%

## Lote ID:
${resultado.loteId || 'N/A'}

## Detalhes dos Chutes:
${JSON.stringify(resultado.chutes, null, 2)}

## Erros:
${resultado.erros.length > 0 ? resultado.erros.map(e => `- ${e}`).join('\n') : 'Nenhum'}

## Status: ${resultado.sucesso === 10 ? '✅ OK' : resultado.erros.includes('FAIL_SALDO') ? '❌ FAIL_SALDO' : '⚠️ COM FALHAS'}
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, '02-CHUTES.md'), report, 'utf8');
    console.log(`✅ Teste de chutes concluído: ${resultado.sucesso}/10 sucesso`);
    return resultado;
  } catch (error) {
    resultado.erros.push(`Erro crítico: ${error.message}`);
    resultado.fim = new Date().toISOString();
    return resultado;
  }
}

if (require.main === module) {
  testarChutes().then(r => {
    console.log('\nResultado:', JSON.stringify(r, null, 2));
    process.exit(r.erros.includes('FAIL_SALDO') ? 1 : 0);
  });
}

module.exports = { testarChutes };

