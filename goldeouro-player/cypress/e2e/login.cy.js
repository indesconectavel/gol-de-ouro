// Teste E2E para Login - Gol de Ouro Player
describe('Login Flow', () => {
  beforeEach(() => {
    // Visitar a página de login
    cy.visit('/');
  });

  it('deve exibir formulário de login', () => {
    // Verificar se os elementos estão presentes
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
    cy.contains('Entrar').should('be.visible');
  });

  it('deve validar campos obrigatórios', () => {
    // Tentar submeter sem preencher campos
    cy.get('button[type="submit"]').click();
    
    // Verificar mensagens de erro
    cy.contains('Email é obrigatório').should('be.visible');
    cy.contains('Senha é obrigatória').should('be.visible');
  });

  it('deve validar formato do email', () => {
    // Preencher email inválido
    cy.get('input[type="email"]').type('email-invalido');
    cy.get('input[type="password"]').type('password123');
    cy.get('button[type="submit"]').click();
    
    // Verificar mensagem de erro
    cy.contains('Email inválido').should('be.visible');
  });

  it('deve fazer login com sucesso', () => {
    // Preencher formulário
    cy.get('input[type="email"]').type(Cypress.env('TEST_USER_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('TEST_USER_PASSWORD'));
    
    // Submeter formulário
    cy.get('button[type="submit"]').click();
    
    // Verificar redirecionamento para dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');
  });

  it('deve exibir erro para credenciais inválidas', () => {
    // Preencher com credenciais inválidas
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    // Verificar mensagem de erro
    cy.contains('Credenciais inválidas').should('be.visible');
  });

  it('deve navegar para página de registro', () => {
    // Clicar no link de registro
    cy.contains('Criar conta').click();
    
    // Verificar redirecionamento
    cy.url().should('include', '/register');
    cy.contains('Registrar').should('be.visible');
  });

  it('deve manter dados do formulário após erro', () => {
    // Preencher formulário
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    
    // Tentar submeter com credenciais inválidas
    cy.get('button[type="submit"]').click();
    
    // Verificar se os dados foram mantidos
    cy.get('input[type="email"]').should('have.value', 'test@example.com');
    cy.get('input[type="password"]').should('have.value', 'password123');
  });
});
