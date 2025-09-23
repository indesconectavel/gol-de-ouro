// Teste de fluxo do dashboard
describe('Fluxo do Dashboard', () => {
  beforeEach(() => {
    // Fazer login via API antes de cada teste
    cy.loginApi('test@example.com', 'password123')
    cy.visitAuthed('/dashboard')
  })

  it('deve exibir o dashboard após login', () => {
    // Verificar elementos do dashboard
    cy.get('h1').should('contain', 'Dashboard')
    cy.get('[data-testid="user-balance"]').should('be.visible')
    cy.get('[data-testid="game-stats"]').should('be.visible')
  })

  it('deve exibir loading state ao carregar dados', () => {
    // Interceptar requisições para simular loading
    cy.intercept('GET', '**/usuario/perfil', (req) => {
      req.reply((res) => {
        res.delay(2000) // Simular delay de 2 segundos
        res.send({ statusCode: 200, body: { balance: 150.00, gamesPlayed: 5 } })
      })
    }).as('profileRequest')
    
    cy.visit('/dashboard')
    
    // Verificar se aparece loading spinner
    cy.get('[data-testid="loading-spinner"]').should('be.visible')
  })

  it('deve exibir erro quando falha ao carregar dados', () => {
    // Interceptar requisição para simular erro
    cy.intercept('GET', '**/usuario/perfil', { statusCode: 500, body: { message: 'Erro interno do servidor' } }).as('profileError')
    
    cy.visit('/dashboard')
    
    // Verificar se aparece mensagem de erro
    cy.get('[data-testid="error-message"]', { timeout: 10000 }).should('be.visible')
  })

  it('deve exibir empty state quando não há dados', () => {
    // Interceptar requisição para simular dados vazios
    cy.intercept('GET', '**/usuario/perfil', { statusCode: 200, body: { balance: 0, gamesPlayed: 0, recentGames: [] } }).as('emptyProfile')
    
    cy.visit('/dashboard')
    
    // Verificar se aparece empty state
    cy.get('[data-testid="empty-state"]').should('be.visible')
  })

  it('deve navegar para o jogo', () => {
    cy.get('[data-testid="play-game-button"]').click()
    cy.url().should('include', '/game')
  })

  it('deve navegar para o perfil', () => {
    cy.get('[data-testid="profile-button"]').click()
    cy.url().should('include', '/profile')
  })

  it('deve navegar para saque', () => {
    cy.get('[data-testid="withdraw-button"]').click()
    cy.url().should('include', '/withdraw')
  })
})

