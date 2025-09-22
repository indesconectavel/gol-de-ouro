// Teste de fluxo de login
describe('Fluxo de Login', () => {
  beforeEach(() => {
    // Visitar a página de login
    cy.visit('/')
  })

  it('deve exibir a página de login corretamente', () => {
    // Verificar elementos da página de login
    cy.get('h1').should('contain', 'Bem-vindo de volta!')
    cy.get('input[name="email"]').should('be.visible')
    cy.get('input[name="password"]').should('be.visible')
    cy.get('button[type="submit"]').should('contain', 'Entrar')
  })

  it('deve validar campos obrigatórios', () => {
    // Tentar submeter formulário vazio
    cy.get('button[type="submit"]').click()
    
    // Verificar se os campos são obrigatórios (HTML5 validation)
    cy.get('input[name="email"]').should('have.attr', 'required')
    cy.get('input[name="password"]').should('have.attr', 'required')
  })

  it('deve exibir erro com credenciais inválidas', () => {
    // Preencher com credenciais inválidas
    cy.get('input[name="email"]').type('teste@invalido.com')
    cy.get('input[name="password"]').type('senhaerrada')
    cy.get('button[type="submit"]').click()
    
    // Verificar se aparece mensagem de erro
    cy.get('.text-red-500', { timeout: 10000 }).should('be.visible')
  })

  it('deve fazer login com credenciais válidas', () => {
    // Preencher com credenciais válidas (assumindo que existe usuário de teste)
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('button[type="submit"]').click()
    
    // Verificar redirecionamento para dashboard
    cy.url().should('include', '/dashboard')
  })

  it('deve exibir loading state durante login', () => {
    // Preencher formulário
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    
    // Interceptar requisição de login para simular delay
    cy.intercept('POST', '**/auth/login', (req) => {
      req.reply((res) => {
        res.delay(1000) // Simular delay de 1 segundo
        res.send({ statusCode: 200, body: { token: 'fake-token', user: { id: 1, email: 'test@example.com' } } })
      })
    }).as('loginRequest')
    
    cy.get('button[type="submit"]').click()
    
    // Verificar se botão mostra loading
    cy.get('button[type="submit"]').should('contain', 'Entrando...')
    cy.get('button[type="submit"]').should('be.disabled')
  })
})