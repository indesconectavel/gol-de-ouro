// Teste de fluxo do jogo
describe('Fluxo do Jogo', () => {
  beforeEach(() => {
    // Fazer login antes de cada teste
    cy.login('test@example.com', 'password123')
    cy.visit('/game')
  })

  it('deve exibir a tela do jogo', () => {
    // Verificar elementos do jogo
    cy.get('[data-testid="game-canvas"]').should('be.visible')
    cy.get('[data-testid="power-meter"]').should('be.visible')
    cy.get('[data-testid="shoot-button"]').should('be.visible')
  })

  it('deve exibir loading state ao carregar saldo', () => {
    // Interceptar requisição de saldo para simular loading
    cy.intercept('GET', '**/usuario/perfil', (req) => {
      req.reply((res) => {
        res.delay(1500) // Simular delay de 1.5 segundos
        res.send({ statusCode: 200, body: { balance: 150.00 } })
      })
    }).as('balanceRequest')
    
    cy.visit('/game')
    
    // Verificar se aparece loading spinner
    cy.get('[data-testid="loading-spinner"]').should('be.visible')
  })

  it('deve exibir erro quando falha ao carregar saldo', () => {
    // Interceptar requisição para simular erro
    cy.intercept('GET', '**/usuario/perfil', { statusCode: 500, body: { message: 'Erro ao carregar saldo' } }).as('balanceError')
    
    cy.visit('/game')
    
    // Verificar se aparece mensagem de erro
    cy.get('[data-testid="error-message"]', { timeout: 10000 }).should('be.visible')
  })

  it('deve permitir configurar valor da aposta', () => {
    // Verificar se campo de aposta está visível
    cy.get('[data-testid="bet-amount"]').should('be.visible')
    
    // Testar inserir valor
    cy.get('[data-testid="bet-amount"]').clear().type('10')
    cy.get('[data-testid="bet-amount"]').should('have.value', '10')
  })

  it('deve validar valor mínimo de aposta', () => {
    // Tentar inserir valor muito baixo
    cy.get('[data-testid="bet-amount"]').clear().type('0.50')
    cy.get('[data-testid="shoot-button"]').click()
    
    // Verificar se aparece validação
    cy.get('[data-testid="validation-error"]').should('be.visible')
  })

  it('deve validar saldo insuficiente', () => {
    // Interceptar para simular saldo baixo
    cy.intercept('GET', '**/usuario/perfil', { statusCode: 200, body: { balance: 5.00 } }).as('lowBalance')
    
    cy.visit('/game')
    
    // Tentar apostar mais que o saldo
    cy.get('[data-testid="bet-amount"]').clear().type('10')
    cy.get('[data-testid="shoot-button"]').click()
    
    // Verificar se aparece erro de saldo insuficiente
    cy.get('[data-testid="insufficient-funds-error"]').should('be.visible')
  })

  it('deve executar chute no gol', () => {
    // Interceptar requisição de chute
    cy.intercept('POST', '**/api/games/chutar', { statusCode: 200, body: { success: true, result: 'goal', prize: 20.00 } }).as('shootRequest')
    
    // Configurar aposta
    cy.get('[data-testid="bet-amount"]').clear().type('10')
    
    // Executar chute
    cy.get('[data-testid="shoot-button"]').click()
    
    // Verificar se requisição foi feita
    cy.wait('@shootRequest')
  })

  it('deve exibir resultado do chute', () => {
    // Interceptar requisição de chute com resultado
    cy.intercept('POST', '**/api/games/chutar', { statusCode: 200, body: { success: true, result: 'goal', prize: 20.00 } }).as('shootResult')
    
    // Configurar e executar chute
    cy.get('[data-testid="bet-amount"]').clear().type('10')
    cy.get('[data-testid="shoot-button"]').click()
    
    // Verificar se resultado é exibido
    cy.get('[data-testid="game-result"]', { timeout: 10000 }).should('be.visible')
    cy.get('[data-testid="game-result"]').should('contain', 'Gol!')
  })

  it('deve atualizar saldo após jogo', () => {
    // Interceptar requisições
    cy.intercept('GET', '**/usuario/perfil', { statusCode: 200, body: { balance: 150.00 } }).as('initialBalance')
    cy.intercept('POST', '**/api/games/chutar', { statusCode: 200, body: { success: true, result: 'goal', prize: 20.00 } }).as('shootRequest')
    cy.intercept('GET', '**/usuario/perfil', { statusCode: 200, body: { balance: 160.00 } }).as('updatedBalance')
    
    cy.visit('/game')
    
    // Verificar saldo inicial
    cy.get('[data-testid="user-balance"]').should('contain', 'R$ 150,00')
    
    // Executar chute
    cy.get('[data-testid="bet-amount"]').clear().type('10')
    cy.get('[data-testid="shoot-button"]').click()
    
    // Verificar se saldo foi atualizado
    cy.get('[data-testid="user-balance"]', { timeout: 10000 }).should('contain', 'R$ 160,00')
  })
})
