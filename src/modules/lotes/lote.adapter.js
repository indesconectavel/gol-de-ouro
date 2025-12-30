/**
 * LOTE ADAPTER - Adapta leitura de server-fly.js para DB
 * Usado durante migração para extrair estado de memória
 */

/**
 * Extrair estado de lotes em memória do server-fly.js
 * @param {object} serverInstance - Instância do servidor (com lotesAtivos)
 * @returns {Promise<array>} Array de lotes em formato para migração
 */
function extractLotesFromMemory(serverInstance) {
  const lotesAtivos = serverInstance.lotesAtivos || new Map();
  const lotes = [];

  for (const [loteId, lote] of lotesAtivos.entries()) {
    lotes.push({
      id: lote.id || loteId,
      valor: lote.valor || lote.valorAposta,
      ativo: lote.ativo !== undefined ? lote.ativo : lote.status === 'active',
      chutes: lote.chutes || [],
      winnerIndex: lote.winnerIndex,
      posicao_atual: lote.chutes?.length || 0,
      status: lote.status || 'active',
      totalArrecadado: lote.totalArrecadado || 0,
      premioTotal: lote.premioTotal || 0
    });
  }

  return lotes;
}

/**
 * Criar snapshot JSON do estado atual
 * @param {object} serverInstance - Instância do servidor
 * @param {string} outputPath - Caminho para salvar snapshot
 */
async function createSnapshot(serverInstance, outputPath) {
  const fs = require('fs').promises;
  const lotes = extractLotesFromMemory(serverInstance);
  
  const snapshot = {
    timestamp: new Date().toISOString(),
    lotes: lotes,
    contadorChutesGlobal: serverInstance.contadorChutesGlobal || 0,
    ultimoGolDeOuro: serverInstance.ultimoGolDeOuro || 0
  };

  await fs.writeFile(outputPath, JSON.stringify(snapshot, null, 2), 'utf8');
  return snapshot;
}

module.exports = {
  extractLotesFromMemory,
  createSnapshot
};

