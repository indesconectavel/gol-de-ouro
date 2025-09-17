// Comandos customizados do Cypress - Gol de Ouro Player

// Comando para fazer login
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.visit('/');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Comando para fazer logout
Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="logout-button"]').click();
  cy.url().should('include', '/');
});

// Comando para aguardar carregamento
Cypress.Commands.add('waitForLoad', () => {
  cy.get('[data-testid="loading"]').should('not.exist');
});

// Comando para interceptar API
Cypress.Commands.add('mockApi', (method, url, response) => {
  cy.intercept(method, url, response).as('apiCall');
});

// Comando para simular upload de arquivo
Cypress.Commands.add('uploadFile', (selector, filePath) => {
  cy.get(selector).selectFile(filePath);
});

// Comando para simular drag and drop
Cypress.Commands.add('dragAndDrop', (source, target) => {
  cy.get(source).trigger('dragstart');
  cy.get(target).trigger('drop');
});

// Comando para verificar responsividade
Cypress.Commands.add('checkResponsive', (width, height) => {
  cy.viewport(width, height);
  cy.get('body').should('be.visible');
});

// Comando para simular teclas
Cypress.Commands.add('typeKeys', (selector, keys) => {
  cy.get(selector).type(keys);
});

// Comando para verificar acessibilidade
Cypress.Commands.add('checkA11y', () => {
  cy.injectAxe();
  cy.checkA11y();
});
