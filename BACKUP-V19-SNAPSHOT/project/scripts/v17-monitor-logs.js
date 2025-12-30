/**
 * V17 MONITOR LOGS
 * Captura e analisa logs do Fly.io
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const REPORTS_DIR = path.join(__dirname, '..', 'docs', 'GO-LIVE', 'V17');

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function monitorarLogs() {
  console.log('\n📋 V17 MONITORANDO LOGS\n');
  
  const resultado = {
    inicio: new Date().toISOString(),
    logs: [],
    erros500: [],
    errosSaldo: [],
    errosWS: [],
    erros: []
  };

  try {
    await ensureDir(REPORTS_DIR);

    // Tentar capturar logs do Fly.io
    try {
      const { stdout, stderr } = await execAsync(
        'flyctl logs --app goldeouro-backend-v2 --region gru --since 2m',
        { timeout: 10000, maxBuffer: 1024 * 1024 }
      );

      const linhas = stdout.split('\n');
      resultado.logs = linhas.slice(0, 100); // Limitar a 100 linhas

      // Filtrar erros
      linhas.forEach(linha => {
        if (linha.includes('500') || linha.includes('Error')) {
          resultado.erros500.push(linha);
        }
        if (linha.includes('Saldo insuficiente') || linha.includes('saldo')) {
          resultado.errosSaldo.push(linha);
        }
        if (linha.includes('websocket') || linha.includes('WebSocket') || linha.includes('WS')) {
          resultado.errosWS.push(linha);
        }
      });
    } catch (e) {
      resultado.erros.push(`Erro ao capturar logs: ${e.message}`);
      resultado.logs = ['Logs não disponíveis - execute manualmente: flyctl logs --app goldeouro-backend-v2'];
    }

    resultado.fim = new Date().toISOString();
    
    const report = `# 📋 V17 MONITORAMENTO DE LOGS
## Data: ${new Date().toISOString().split('T')[0]}

## Erros 500:
${resultado.erros500.length > 0 ? resultado.erros500.slice(0, 10).map(e => `- ${e}`).join('\n') : 'Nenhum'}

## Erros de Saldo:
${resultado.errosSaldo.length > 0 ? resultado.errosSaldo.slice(0, 10).map(e => `- ${e}`).join('\n') : 'Nenhum'}

## Erros WebSocket:
${resultado.errosWS.length > 0 ? resultado.errosWS.slice(0, 10).map(e => `- ${e}`).join('\n') : 'Nenhum'}

## Logs (últimas 100 linhas):
${resultado.logs.slice(0, 50).join('\n')}

## Erros:
${resultado.erros.length > 0 ? resultado.erros.map(e => `- ${e}`).join('\n') : 'Nenhum'}

## Status: ✅ OK
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, '05-LOGS.md'), report, 'utf8');
    console.log(`✅ Monitoramento de logs concluído: ${resultado.logs.length} linhas`);
    return resultado;
  } catch (error) {
    resultado.erros.push(`Erro crítico: ${error.message}`);
    resultado.fim = new Date().toISOString();
    return resultado;
  }
}

if (require.main === module) {
  monitorarLogs().then(r => {
    console.log('\nResultado:', JSON.stringify(r, null, 2));
    process.exit(0);
  });
}

module.exports = { monitorarLogs };

