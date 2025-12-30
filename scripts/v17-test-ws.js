/**
 * V17 TEST WEBSOCKET
 * Testa conexão WebSocket e captura eventos
 */

const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
require('dotenv').config();

const WS_URL = 'wss://goldeouro-backend-v2.fly.dev';
const REPORTS_DIR = path.join(__dirname, '..', 'docs', 'GO-LIVE', 'V17');

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function testarWebSocket() {
  console.log('\n🔌 V17 TESTANDO WEBSOCKET\n');
  
  const resultado = {
    inicio: new Date().toISOString(),
    conectado: false,
    eventos: [],
    eventoLoteFinalizado: null,
    erros: []
  };

  try {
    await ensureDir(REPORTS_DIR);

    await new Promise((resolve) => {
      const ws = new WebSocket(WS_URL);
      const timeout = setTimeout(() => {
        ws.close();
        resolve();
      }, 10000);

      ws.on('open', () => {
        resultado.conectado = true;
        console.log('✅ WebSocket conectado');
      });

      ws.on('message', (data) => {
        try {
          const evento = JSON.parse(data.toString());
          resultado.eventos.push({
            timestamp: new Date().toISOString(),
            tipo: evento.type || evento.event || 'unknown',
            data: evento
          });

          if (evento.type === 'lote-finalizado' || evento.event === 'lote-finalizado') {
            resultado.eventoLoteFinalizado = evento;
          }
        } catch (e) {
          resultado.eventos.push({
            timestamp: new Date().toISOString(),
            raw: data.toString()
          });
        }
      });

      ws.on('error', (err) => {
        resultado.erros.push(`WebSocket error: ${err.message}`);
      });

      ws.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    resultado.fim = new Date().toISOString();
    
    const report = `# 🔌 V17 TESTE WEBSOCKET
## Data: ${new Date().toISOString().split('T')[0]}

## Conexão:
- Conectado: ${resultado.conectado ? '✅' : '❌'}
- Eventos Recebidos: ${resultado.eventos.length}

## Evento Lote Finalizado:
${resultado.eventoLoteFinalizado ? JSON.stringify(resultado.eventoLoteFinalizado, null, 2) : 'Não recebido'}

## Todos os Eventos:
${JSON.stringify(resultado.eventos, null, 2)}

## Erros:
${resultado.erros.length > 0 ? resultado.erros.map(e => `- ${e}`).join('\n') : 'Nenhum'}

## Status: ${resultado.conectado ? '✅ OK' : '❌ FALHOU'}
`;
    
    await fs.writeFile(path.join(REPORTS_DIR, '03-WS.md'), report, 'utf8');
    console.log(`✅ Teste WebSocket concluído: ${resultado.conectado ? 'Conectado' : 'Falhou'}, ${resultado.eventos.length} eventos`);
    return resultado;
  } catch (error) {
    resultado.erros.push(`Erro crítico: ${error.message}`);
    resultado.fim = new Date().toISOString();
    return resultado;
  }
}

if (require.main === module) {
  testarWebSocket().then(r => {
    console.log('\nResultado:', JSON.stringify(r, null, 2));
    process.exit(0);
  });
}

module.exports = { testarWebSocket };

