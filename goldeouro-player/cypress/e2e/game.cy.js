// Teste E2E para Jogo - Gol de Ouro Player
describe('Game Flow', () => {
  beforeEach(() => {
    // Fazer login antes de cada teste
    cy.login();
    cy.visit('/game');
  });

  it('deve exibir tela do jogo corretamente', () => {
    // Verificar elementos principais
    cy.get('#game-root').should('be.visible');
    cy.get('.hud-header').should('be.visible');
    cy.get('.hud-actions').should('be.visible');
    cy.get('.hud-bottom-left').should('be.visible');
    cy.get('.hud-bottom-right').should('be.visible');
  });

  it('deve exibir informações do jogador', () => {
    // Verificar se as informações estão visíveis
    cy.contains('Saldo').should('be.visible');
    cy.contains('Chutes').should('be.visible');
    cy.contains('Vitórias').should('be.visible');
  });

  it('deve permitir entrar na fila', () => {
    // Clicar no botão "Em Jogo"
    cy.contains('Em Jogo').click();
    
    // Verificar se entrou na fila
    cy.contains('Na Fila').should('be.visible');
    cy.contains('Posição na fila').should('be.visible');
  });

  it('deve permitir sair da fila', () => {
    // Entrar na fila primeiro
    cy.contains('Em Jogo').click();
    cy.contains('Na Fila').should('be.visible');
    
    // Sair da fila
    cy.contains('Sair da Fila').click();
    cy.contains('Em Jogo').should('be.visible');
  });

  it('deve exibir chat quando clicado', () => {
    // Clicar no ícone de chat
    cy.get('.chat-toggle').click();
    
    // Verificar se o chat está visível
    cy.get('.chat-panel').should('be.visible');
    cy.get('input[placeholder*="mensagem"]').should('be.visible');
  });

  it('deve permitir enviar mensagem no chat', () => {
    // Abrir chat
    cy.get('.chat-toggle').click();
    
    // Digitar mensagem
    const message = 'Olá, pessoal!';
    cy.get('input[placeholder*="mensagem"]').type(message);
    
    // Enviar mensagem
    cy.get('button[type="submit"]').click();
    
    // Verificar se a mensagem apareceu
    cy.contains(message).should('be.visible');
  });

  it('deve exibir controles de áudio', () => {
    // Verificar se os controles de áudio estão presentes
    cy.get('.audio-toggle').should('be.visible');
    cy.get('.volume-control').should('be.visible');
  });

  it('deve permitir alternar áudio', () => {
    // Clicar no toggle de áudio
    cy.get('.audio-toggle').click();
    
    // Verificar se o estado mudou
    cy.get('.audio-toggle').should('have.class', 'muted');
    
    // Clicar novamente para ativar
    cy.get('.audio-toggle').click();
    cy.get('.audio-toggle').should('not.have.class', 'muted');
  });

  it('deve exibir informações de nível', () => {
    // Verificar se as informações de nível estão visíveis
    cy.contains('Nível').should('be.visible');
    cy.get('.level-progress').should('be.visible');
  });

  it('deve navegar para outras páginas', () => {
    // Testar navegação para Dashboard
    cy.contains('Jogador').click();
    cy.url().should('include', '/dashboard');
    
    // Voltar para o jogo
    cy.visit('/game');
    
    // Testar navegação para Perfil
    cy.get('a[href="/profile"]').click();
    cy.url().should('include', '/profile');
  });

  it('deve ser responsivo em diferentes tamanhos de tela', () => {
    // Testar em mobile
    cy.viewport(375, 667);
    cy.get('#game-root').should('be.visible');
    
    // Testar em tablet
    cy.viewport(768, 1024);
    cy.get('#game-root').should('be.visible');
    
    // Testar em desktop
    cy.viewport(1280, 720);
    cy.get('#game-root').should('be.visible');
  });

  it('deve exibir loading durante carregamento', () => {
    // Interceptar requisições para simular loading
    cy.intercept('GET', '**/api/game/**', { delay: 1000 }).as('gameData');
    
    // Recarregar página
    cy.reload();
    
    // Verificar se o loading está visível
    cy.contains('Carregando').should('be.visible');
    
    // Aguardar carregamento
    cy.wait('@gameData');
    cy.contains('Carregando').should('not.exist');
  });
});
