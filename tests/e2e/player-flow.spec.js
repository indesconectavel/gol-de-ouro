// TESTE E2E - FLUXO COMPLETO DO JOGADOR
// Data: 2025-10-08T02:01:16.602Z

const { test, expect } = require('@playwright/test');

test.describe('Fluxo Completo do Jogador', () => {
  test('Deve completar fluxo completo de registro até jogo', async ({ page }) => {
    // 1. Acessar página inicial
    await page.goto('http://localhost:5174');
    await expect(page).toHaveTitle(/Gol de Ouro/);
    
    // 2. Navegar para registro
    await page.click('text=Registrar');
    await expect(page).toHaveURL(/.*register/);
    
    // 3. Preencher formulário de registro
    await page.fill('input[name="username"]', 'teste-jogador');
    await page.fill('input[name="email"]', 'teste@exemplo.com');
    await page.fill('input[name="password"]', 'senha123');
    await page.fill('input[name="confirmPassword"]', 'senha123');
    await page.check('input[name="terms"]');
    
    // 4. Submeter registro
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // 5. Verificar dashboard
    await expect(page.locator('text=Saldo')).toBeVisible();
    await expect(page.locator('text=Jogar')).toBeVisible();
    
    // 6. Navegar para jogo
    await page.click('text=Jogar');
    await expect(page).toHaveURL(/.*game/);
    
    // 7. Verificar interface do jogo
    await expect(page.locator('.game-field')).toBeVisible();
    await expect(page.locator('.bet-amount')).toBeVisible();
    
    // 8. Fazer aposta
    await page.fill('input[name="betAmount"]', '10');
    await page.click('button[text="Apostar"]');
    
    // 9. Executar chute
    await page.click('.zone-1');
    await expect(page.locator('.result')).toBeVisible();
    
    // 10. Verificar resultado
    await expect(page.locator('.game-result')).toBeVisible();
  });

  test('Deve completar fluxo de login e jogo', async ({ page }) => {
    // 1. Acessar página de login
    await page.goto('http://localhost:5174/login');
    
    // 2. Preencher credenciais
    await page.fill('input[name="email"]', 'teste@exemplo.com');
    await page.fill('input[name="password"]', 'senha123');
    
    // 3. Fazer login
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // 4. Verificar dashboard
    await expect(page.locator('text=Saldo')).toBeVisible();
  });
});

test.describe('Fluxo do Painel Admin', () => {
  test('Deve acessar painel admin e gerenciar usuários', async ({ page }) => {
    // 1. Acessar painel admin
    await page.goto('http://localhost:5173');
    
    // 2. Fazer login como admin
    await page.fill('input[name="email"]', 'admin@goldeouro.com');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // 3. Verificar dashboard admin
    await expect(page.locator('text=Dashboard Admin')).toBeVisible();
    
    // 4. Navegar para usuários
    await page.click('text=Usuários');
    await expect(page.locator('text=Lista de Usuários')).toBeVisible();
    
    // 5. Verificar funcionalidades
    await expect(page.locator('text=Adicionar Usuário')).toBeVisible();
    await expect(page.locator('text=Exportar')).toBeVisible();
  });
});
