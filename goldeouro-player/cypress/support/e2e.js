// Suporte para testes E2E - Gol de Ouro Player
import './commands';

// Configurações globais
Cypress.on('uncaught:exception', (err, runnable) => {
  // Não falhar o teste em erros não capturados
  return false;
});

// Configurações de viewport
Cypress.on('window:before:load', (win) => {
  // Configurar viewport
  win.innerWidth = 1280;
  win.innerHeight = 720;
});

// Configurações de localStorage
beforeEach(() => {
  // Limpar localStorage antes de cada teste
  cy.clearLocalStorage();
  
  // Configurar localStorage padrão
  cy.window().then((win) => {
    win.localStorage.setItem('theme', 'dark');
  });
});
