#!/usr/bin/env node

/**
 * LIMPEZA DE ARQUIVOS TEMPORÁRIOS
 * Remove arquivos de teste e scripts temporários
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 LIMPANDO ARQUIVOS TEMPORÁRIOS...\n');

const arquivosParaRemover = [
  'test-api.js',
  'test-frontend-backend.js',
  'test-new-endpoints.js',
  'test-final-fixes.js',
  'fix-cors.ps1',
  'fix-memory-leaks.js',
  'monitor-memory.js',
  'start-optimized.js',
  'fix-production-issues.js',
  'check-production.js',
  'fix-frontend-backend-connection.js',
  'quick-fix.js',
  'fix-all-bugs.js',
  'fix-render-deploy.js',
  'fix-all-frontend-bugs.js',
  'populate-all-cards.js',
  'validador-dados-ficticios.js',
  'corrigir-frontend.js',
  'validacao-sistema-completo.js',
  'validacao-final-sistema.js',
  'limpar-arquivos-temporarios.js'
];

const arquivosParaManter = [
  'ESTADO-FUNCIONAL-FINAL.json',
  'ESTADO-FUNCIONAL-FINAL.md',
  'SISTEMA-PRONTO-ETAPA-6.md',
  'SISTEMA-CORRECAO-BUGS-RECORRENTES.md',
  'RELATORIO-CORRECOES-FINAIS.md',
  'CORRECOES-FINAIS-IMPLEMENTADAS.md',
  'CORRECOES-FINAIS-AUDIO-INTERFACE.md',
  'VERIFICACAO-SONS-ESPECIFICOS.md',
  'ALTERACOES-EMOJIS-INTERFACE.md',
  'ALTERACOES-EMOJIS-VOLUME.md',
  'RELATORIO-POPULACAO-CARDS.md',
  'render-env-config.txt',
  'GUIA-CORRECAO-PRODUCAO.md',
  'CONFIGURACAO-RENDER-COMPLETA.md',
  'SISTEMA-CONFIGURADO-PRONTO.md',
  'RELATORIO-CORRECAO-COMPLETA.md',
  'AUDITORIA-COMPLETA-SISTEMA.md',
  'VALIDACAO-SISTEMA-COMPLETO.md',
  'PROBLEMAS-RESOLVIDOS-FINAL.md',
  'RELATORIO-CORRECAO-BUGS.md',
  'CORRECAO-URGENTE-RENDER.md',
  'RELATORIO-FINAL-CONFIGURACAO.md'
];

let removidos = 0;
let mantidos = 0;

console.log('📁 Removendo arquivos temporários...');
arquivosParaRemover.forEach(arquivo => {
  if (fs.existsSync(arquivo)) {
    try {
      fs.unlinkSync(arquivo);
      console.log(`   ✅ Removido: ${arquivo}`);
      removidos++;
    } catch (error) {
      console.log(`   ❌ Erro ao remover ${arquivo}: ${error.message}`);
    }
  }
});

console.log('\n📁 Verificando arquivos mantidos...');
arquivosParaManter.forEach(arquivo => {
  if (fs.existsSync(arquivo)) {
    console.log(`   ✅ Mantido: ${arquivo}`);
    mantidos++;
  }
});

console.log('\n📋 RESUMO DA LIMPEZA:');
console.log(`   🗑️ Arquivos removidos: ${removidos}`);
console.log(`   📁 Arquivos mantidos: ${mantidos}`);
console.log(`   📊 Total processado: ${removidos + mantidos}`);

console.log('\n✅ LIMPEZA CONCLUÍDA!');
console.log('🎯 Sistema pronto para ETAPA 6 - Frontend Jogador');
