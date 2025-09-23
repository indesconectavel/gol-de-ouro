describe('Gol de Ouro - Fluxo Completo do Jogo', () => {
  beforeEach(() => {
    // Fazer login via API antes de cada teste
    cy.loginApi('test@example.com', 'password123')
    cy.visitAuthed('/')
  })

  it('deve carregar a página inicial corretamente', () => {
    cy.contains('GOL DE OURO').should('be.visible')
    cy.contains('CHUTAR').should('be.visible')
    cy.get('[data-testid="game-field"]').should('be.visible')
  })

  it('deve exibir as zonas de gol corretamente', () => {
    // Verifica se todas as zonas de gol estão presentes
    cy.get('[data-testid="zone-1"]').should('be.visible')
    cy.get('[data-testid="zone-2"]').should('be.visible')
    cy.get('[data-testid="zone-3"]').should('be.visible')
    cy.get('[data-testid="zone-4"]').should('be.visible')
    cy.get('[data-testid="zone-5"]').should('be.visible')
  })

  it('deve permitir fazer um chute', () => {
    // Clica na primeira zona de gol
    cy.get('[data-testid="zone-1"]').click()
    
    // Verifica se o estado mudou para "Chutando..."
    cy.contains('Chutando...').should('be.visible')
    
    // Aguarda o resultado
    cy.contains(/GOL!|DEFENDEU!/, { timeout: 5000 }).should('be.visible')
  })

  it('deve atualizar o saldo após o chute', () => {
    // Verifica o saldo inicial
    cy.contains('R$ 21,00').should('be.visible')
    
    // Faz um chute
    cy.get('[data-testid="zone-1"]').click()
    
    // Verifica se o saldo foi reduzido
    cy.contains('R$ 20,00').should('be.visible')
  })

  it('deve exibir estatísticas do jogo', () => {
    cy.contains('Estatísticas').should('be.visible')
    cy.contains('Chutes: 0').should('be.visible')
    cy.contains('Gols: 0').should('be.visible')
    cy.contains('Precisão: 0%').should('be.visible')
  })

  it('deve navegar entre as páginas', () => {
    // Testa navegação para Dashboard
    cy.contains('Dashboard').click()
    cy.url().should('include', '/dashboard')
    
    // Volta para o jogo
    cy.contains('Jogar').click()
    cy.url().should('include', '/game')
    
    // Testa navegação para Perfil
    cy.contains('Perfil').click()
    cy.url().should('include', '/profile')
    
    // Volta para o jogo
    cy.contains('Jogar').click()
    cy.url().should('include', '/game')
  })

  it('deve exibir controles de som', () => {
    cy.get('[data-testid="sound-controls"]').should('be.visible')
    cy.get('[data-testid="mute-button"]').should('be.visible')
    cy.get('[data-testid="volume-slider"]').should('be.visible')
  })

  it('deve permitir ajustar o volume', () => {
    cy.get('[data-testid="volume-slider"]').invoke('val', 0.5).trigger('change')
    cy.get('[data-testid="volume-slider"]').should('have.value', 0.5)
  })

  it('deve permitir mutar/desmutar o som', () => {
    cy.get('[data-testid="mute-button"]').click()
    cy.get('[data-testid="mute-button"]').should('contain', '🔇')
    
    cy.get('[data-testid="mute-button"]').click()
    cy.get('[data-testid="mute-button"]').should('contain', '🔊')
  })
})
