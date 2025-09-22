// Importar comandos customizados
import './commands'

// Configurações globais do Cypress
Cypress.on('uncaught:exception', (err, runnable) => {
  // Não falhar o teste em erros não capturados do React
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  if (err.message.includes('Non-Error promise rejection')) {
    return false
  }
  return true
})

// Configurações de viewport
Cypress.on('window:before:load', (win) => {
  // Configurar viewport para testes mobile
  win.innerWidth = 1280
  win.innerHeight = 720
})

// Interceptar requisições de API por padrão
beforeEach(() => {
  // Interceptar requisições de health check
  cy.intercept('GET', '**/health', { statusCode: 200, body: { status: 'ok' } }).as('healthCheck')
  
  // Interceptar requisições de perfil do usuário
  cy.intercept('GET', '**/usuario/perfil', { 
    statusCode: 200, 
    body: { 
      id: 1, 
      email: 'test@example.com', 
      balance: 150.00, 
      gamesPlayed: 5 
    } 
  }).as('userProfile')
})

// Configurações de timeout
Cypress.config('defaultCommandTimeout', 10000)
Cypress.config('requestTimeout', 10000)
Cypress.config('responseTimeout', 10000)