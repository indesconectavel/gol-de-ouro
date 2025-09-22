// Comandos customizados do Cypress

// Comando para fazer login
Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.visit('/')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })
})

// Comando para interceptar requisições de API
Cypress.Commands.add('mockApi', (method, url, response, statusCode = 200) => {
  cy.intercept(method, url, {
    statusCode,
    body: response
  }).as(`${method.toLowerCase()}_${url.split('/').pop()}`)
})

// Comando para simular delay em requisições
Cypress.Commands.add('mockApiWithDelay', (method, url, response, delay = 1000) => {
  cy.intercept(method, url, (req) => {
    req.reply((res) => {
      res.delay(delay)
      res.send({ statusCode: 200, body: response })
    })
  }).as(`${method.toLowerCase()}_${url.split('/').pop()}_delayed`)
})

// Comando para verificar loading state
Cypress.Commands.add('checkLoadingState', (element) => {
  cy.get(element).should('be.visible')
  cy.get(element).should('contain', 'Carregando')
})

// Comando para verificar error state
Cypress.Commands.add('checkErrorState', (element) => {
  cy.get(element, { timeout: 10000 }).should('be.visible')
  cy.get(element).should('contain', 'Erro')
})

// Comando para verificar empty state
Cypress.Commands.add('checkEmptyState', (element) => {
  cy.get(element).should('be.visible')
  cy.get(element).should('contain', 'Nenhum')
})

// Comando para preencher formulário de saque
Cypress.Commands.add('fillWithdrawForm', (amount, pixKey) => {
  cy.get('[data-testid="amount-input"]').clear().type(amount)
  cy.get('[data-testid="pix-key-input"]').clear().type(pixKey)
})

// Comando para configurar aposta no jogo
Cypress.Commands.add('setBetAmount', (amount) => {
  cy.get('[data-testid="bet-amount"]').clear().type(amount)
})

// Comando para executar chute no jogo
Cypress.Commands.add('shootBall', () => {
  cy.get('[data-testid="shoot-button"]').click()
})

// Comando para verificar saldo do usuário
Cypress.Commands.add('checkBalance', (expectedBalance) => {
  cy.get('[data-testid="user-balance"]').should('contain', expectedBalance)
})

// Comando para navegar para página
Cypress.Commands.add('navigateTo', (page) => {
  cy.get(`[data-testid="${page}-button"]`).click()
  cy.url().should('include', `/${page}`)
})

// Comando para verificar se elemento está visível e contém texto
Cypress.Commands.add('shouldBeVisibleAndContain', (selector, text) => {
  cy.get(selector).should('be.visible')
  cy.get(selector).should('contain', text)
})

// Comando para aguardar carregamento de dados
Cypress.Commands.add('waitForDataLoad', (timeout = 10000) => {
  cy.get('[data-testid="loading-spinner"]', { timeout }).should('not.exist')
})

// Comando para verificar se não há tela branca
Cypress.Commands.add('checkNoWhiteScreen', () => {
  cy.get('body').should('not.have.class', 'white-screen')
  cy.get('body').should('not.have.css', 'background-color', 'rgb(255, 255, 255)')
})