// Teste de fluxo de login - VERSÃO SIMPLIFICADA
describe('Fluxo de Login', () => {
  beforeEach(() => {
    // Visitar a página de login
    cy.visit('/')
    // Aguardar app carregar
    cy.get('#root').should('be.visible')
    cy.wait(2000) // Aguardar React renderizar
  })

  it('deve exibir a página de login corretamente', () => {
    // Verificar elementos da página de login
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('contain', 'Entrar')
    cy.get('button[type="submit"]').should('be.visible')
  })

  it('deve validar campos obrigatórios', () => {
    // Tentar submeter formulário vazio
    cy.get('button[type="submit"]').click()
    
    // Verificar se os campos são obrigatórios (HTML5 validation)
    cy.get('input[type="email"]').should('have.attr', 'required')
    cy.get('input[type="password"]').should('have.attr', 'required')
  })

  it('deve permitir preencher formulário', () => {
    // Preencher formulário
    cy.get('input[type="email"]').type('test@example.com')
    cy.get('input[type="password"]').type('password123')
    
    // Verificar se os valores foram preenchidos
    cy.get('input[type="email"]').should('have.value', 'test@example.com')
    cy.get('input[type="password"]').should('have.value', 'password123')
  })

  it('deve ter botão de submit funcional', () => {
    // Verificar se botão existe e é clicável
    cy.get('button[type="submit"]').should('be.visible')
    cy.get('button[type="submit"]').should('not.be.disabled')
    cy.get('button[type="submit"]').click()
  })
})