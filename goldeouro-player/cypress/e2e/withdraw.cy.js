// Teste de fluxo de saque
describe('Fluxo de Saque', () => {
  beforeEach(() => {
    // Fazer login antes de cada teste
    cy.login('test@example.com', 'password123')
    cy.visit('/withdraw')
  })

  it('deve exibir a tela de saque', () => {
    // Verificar elementos da tela de saque
    cy.get('h1').should('contain', 'Saque')
    cy.get('[data-testid="withdraw-form"]').should('be.visible')
    cy.get('[data-testid="amount-input"]').should('be.visible')
    cy.get('[data-testid="pix-key-input"]').should('be.visible')
  })

  it('deve exibir loading state ao carregar dados', () => {
    // Interceptar requisições para simular loading
    cy.intercept('GET', '**/usuario/perfil', (req) => {
      req.reply((res) => {
        res.delay(2000) // Simular delay de 2 segundos
        res.send({ statusCode: 200, body: { balance: 150.00 } })
      })
    }).as('profileRequest')
    
    cy.visit('/withdraw')
    
    // Verificar se aparece loading spinner
    cy.get('[data-testid="loading-spinner"]').should('be.visible')
  })

  it('deve exibir erro quando falha ao carregar dados', () => {
    // Interceptar requisição para simular erro
    cy.intercept('GET', '**/usuario/perfil', { statusCode: 500, body: { message: 'Erro ao carregar perfil' } }).as('profileError')
    
    cy.visit('/withdraw')
    
    // Verificar se aparece mensagem de erro
    cy.get('[data-testid="error-message"]', { timeout: 10000 }).should('be.visible')
  })

  it('deve validar campos obrigatórios', () => {
    // Tentar submeter formulário vazio
    cy.get('[data-testid="submit-withdraw"]').click()
    
    // Verificar se campos são obrigatórios
    cy.get('[data-testid="amount-input"]').should('have.attr', 'required')
    cy.get('[data-testid="pix-key-input"]').should('have.attr', 'required')
  })

  it('deve validar valor mínimo de saque', () => {
    // Tentar inserir valor muito baixo
    cy.get('[data-testid="amount-input"]').type('5')
    cy.get('[data-testid="pix-key-input"]').type('test@example.com')
    cy.get('[data-testid="submit-withdraw"]').click()
    
    // Verificar se aparece validação
    cy.get('[data-testid="validation-error"]').should('be.visible')
    cy.get('[data-testid="validation-error"]').should('contain', 'Valor mínimo')
  })

  it('deve validar saldo insuficiente', () => {
    // Interceptar para simular saldo baixo
    cy.intercept('GET', '**/usuario/perfil', { statusCode: 200, body: { balance: 5.00 } }).as('lowBalance')
    
    cy.visit('/withdraw')
    
    // Tentar sacar mais que o saldo
    cy.get('[data-testid="amount-input"]').type('10')
    cy.get('[data-testid="pix-key-input"]').type('test@example.com')
    cy.get('[data-testid="submit-withdraw"]').click()
    
    // Verificar se aparece erro de saldo insuficiente
    cy.get('[data-testid="insufficient-funds-error"]').should('be.visible')
  })

  it('deve validar chave PIX', () => {
    // Testar chave PIX inválida
    cy.get('[data-testid="amount-input"]').type('50')
    cy.get('[data-testid="pix-key-input"]').type('chave-invalida')
    cy.get('[data-testid="submit-withdraw"]').click()
    
    // Verificar se aparece erro de validação
    cy.get('[data-testid="pix-validation-error"]').should('be.visible')
  })

  it('deve processar saque com sucesso', () => {
    // Interceptar requisição de saque
    cy.intercept('POST', '**/api/payments/pix/criar', { statusCode: 200, body: { success: true, transactionId: 'tx123', status: 'pending' } }).as('withdrawRequest')
    
    // Preencher formulário
    cy.get('[data-testid="amount-input"]').type('50')
    cy.get('[data-testid="pix-key-input"]').type('test@example.com')
    cy.get('[data-testid="submit-withdraw"]').click()
    
    // Verificar se requisição foi feita
    cy.wait('@withdrawRequest')
    
    // Verificar se aparece mensagem de sucesso
    cy.get('[data-testid="success-message"]', { timeout: 10000 }).should('be.visible')
  })

  it('deve exibir loading state durante processamento', () => {
    // Interceptar requisição com delay
    cy.intercept('POST', '**/api/payments/pix/criar', (req) => {
      req.reply((res) => {
        res.delay(2000) // Simular delay de 2 segundos
        res.send({ statusCode: 200, body: { success: true, transactionId: 'tx123' } })
      })
    }).as('withdrawRequest')
    
    // Preencher e submeter formulário
    cy.get('[data-testid="amount-input"]').type('50')
    cy.get('[data-testid="pix-key-input"]').type('test@example.com')
    cy.get('[data-testid="submit-withdraw"]').click()
    
    // Verificar se botão mostra loading
    cy.get('[data-testid="submit-withdraw"]').should('contain', 'Processando...')
    cy.get('[data-testid="submit-withdraw"]').should('be.disabled')
  })

  it('deve exibir histórico de saques', () => {
    // Interceptar requisição de histórico
    cy.intercept('GET', '**/api/payments/pix/usuario', { 
      statusCode: 200, 
      body: { 
        transactions: [
          { id: 1, amount: 50, status: 'completed', createdAt: '2025-01-01' },
          { id: 2, amount: 30, status: 'pending', createdAt: '2025-01-02' }
        ]
      }
    }).as('withdrawHistory')
    
    cy.visit('/withdraw')
    
    // Verificar se histórico é exibido
    cy.get('[data-testid="withdraw-history"]').should('be.visible')
    cy.get('[data-testid="withdraw-item"]').should('have.length', 2)
  })

  it('deve exibir empty state quando não há histórico', () => {
    // Interceptar requisição com dados vazios
    cy.intercept('GET', '**/api/payments/pix/usuario', { 
      statusCode: 200, 
      body: { transactions: [] }
    }).as('emptyHistory')
    
    cy.visit('/withdraw')
    
    // Verificar se aparece empty state
    cy.get('[data-testid="empty-history"]').should('be.visible')
  })
})
