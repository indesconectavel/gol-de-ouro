// Sistema de Login DEFINITIVO - Gol de Ouro Player
import { login, checkMeta } from './services/apiService.js';

// Função de login global
window.goldeouroLogin = async (email, password) => {
  try {
    console.log('🚀 Iniciando login...');
    const result = await login(email, password);
    console.log('✅ Login realizado com sucesso!');
    return result;
  } catch (error) {
    console.error('❌ Falha no login:', error);
    throw error;
  }
};

// Função de verificação de meta global
window.goldeouroCheckMeta = async () => {
  try {
    console.log('🔍 Verificando meta...');
    const result = await checkMeta();
    console.log('✅ Meta verificado com sucesso!');
    return result;
  } catch (error) {
    console.error('❌ Falha na verificação de meta:', error);
    throw error;
  }
};

// Auto-executar verificação de meta
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎮 Gol de Ouro Player carregado!');
  window.goldeouroCheckMeta().catch(console.error);
});

console.log('🎯 Sistema de Login DEFINITIVO carregado!');
