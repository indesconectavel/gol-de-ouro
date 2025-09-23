describe('Gol de Ouro - Navegação entre Páginas', () => {
  beforeEach(() => {
    // Fazer login via API antes de cada teste
    cy.loginApi('test@example.com', 'password123')
    cy.visitAuthed('/')
  })

  it('deve navegar para Dashboard', () => {
    cy.contains('Dashboard').click()
    cy.url().should('include', '/dashboard')
    cy.contains('Dashboard').should('be.visible')
    cy.contains('Saldo Atual').should('be.visible')
    cy.contains('R$ 21,00').should('be.visible')
  })

  it('deve navegar para Perfil', () => {
    cy.contains('Perfil').click()
    cy.url().should('include', '/profile')
    cy.contains('Meu Perfil').should('be.visible')
    cy.contains('Informações Pessoais').should('be.visible')
  })

  it('deve navegar para Saque', () => {
    cy.contains('Saque').click()
    cy.url().should('include', '/withdraw')
    cy.contains('Solicitar Saque').should('be.visible')
    cy.contains('Valor do Saque').should('be.visible')
  })

  it('deve navegar de volta para o Jogo', () => {
    // Vai para Dashboard
    cy.contains('Dashboard').click()
    cy.url().should('include', '/dashboard')
    
    // Volta para o Jogo
    cy.contains('Jogar').click()
    cy.url().should('include', '/game')
    cy.contains('CHUTAR').should('be.visible')
  })

  it('deve manter o estado do usuário entre páginas', () => {
    // Verifica saldo na página inicial
    cy.contains('R$ 21,00').should('be.visible')
    
    // Vai para Dashboard
    cy.contains('Dashboard').click()
    cy.contains('R$ 21,00').should('be.visible')
    
    // Vai para Perfil
    cy.contains('Perfil').click()
    cy.contains('R$ 21,00').should('be.visible')
    
    // Volta para o Jogo
    cy.contains('Jogar').click()
    cy.contains('R$ 21,00').should('be.visible')
  })

  it('deve exibir menu de navegação responsivo', () => {
    // Testa em desktop
    cy.viewport(1280, 720)
    cy.get('[data-testid="navigation-menu"]').should('be.visible')
    
    // Testa em mobile
    cy.viewport(375, 667)
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible')
    cy.get('[data-testid="mobile-menu-button"]').click()
    cy.get('[data-testid="navigation-menu"]').should('be.visible')
  })

  it('deve fechar menu mobile ao clicar em um link', () => {
    cy.viewport(375, 667)
    cy.get('[data-testid="mobile-menu-button"]').click()
    cy.get('[data-testid="navigation-menu"]').should('be.visible')
    
    cy.contains('Dashboard').click()
    cy.url().should('include', '/dashboard')
    cy.get('[data-testid="navigation-menu"]').should('not.be.visible')
  })
})
