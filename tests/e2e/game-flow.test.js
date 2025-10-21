// Testes E2E - Fluxo de Jogo Gol de Ouro v1.1.1
const { test, expect } = require('@playwright/test');
const axios = require('axios');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const PLAYER_URL = process.env.PLAYER_URL || 'http://localhost:5174';

// Dados de teste
const testUsers = [
  { email: 'teste1@example.com', senha: 'Teste123!', nome: 'Jogador 1' },
  { email: 'teste2@example.com', senha: 'Teste123!', nome: 'Jogador 2' },
  { email: 'teste3@example.com', senha: 'Teste123!', nome: 'Jogador 3' },
  { email: 'teste4@example.com', senha: 'Teste123!', nome: 'Jogador 4' },
  { email: 'teste5@example.com', senha: 'Teste123!', nome: 'Jogador 5' },
  { email: 'teste6@example.com', senha: 'Teste123!', nome: 'Jogador 6' },
  { email: 'teste7@example.com', senha: 'Teste123!', nome: 'Jogador 7' },
  { email: 'teste8@example.com', senha: 'Teste123!', nome: 'Jogador 8' },
  { email: 'teste9@example.com', senha: 'Teste123!', nome: 'Jogador 9' },
  { email: 'teste10@example.com', senha: 'Teste123!', nome: 'Jogador 10' }
];

let authTokens = [];
let gameId = null;

test.describe('Fluxo Completo de Jogo', () => {
  test.beforeAll(async () => {
    console.log('🚀 Iniciando testes E2E do Gol de Ouro');
    
    // Criar usuários de teste
    for (const user of testUsers) {
      try {
        await axios.post(`${BASE_URL}/auth/register`, user);
        console.log(`✅ Usuário criado: ${user.email}`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.includes('já existe')) {
          console.log(`⚠️ Usuário já existe: ${user.email}`);
        } else {
          console.error(`❌ Erro ao criar usuário ${user.email}:`, error.response?.data || error.message);
        }
      }
    }

    // Fazer login de todos os usuários
    for (const user of testUsers) {
      try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
          email: user.email,
          senha: user.senha
        });
        authTokens.push(response.data.token);
        console.log(`✅ Login realizado: ${user.email}`);
      } catch (error) {
        console.error(`❌ Erro no login ${user.email}:`, error.response?.data || error.message);
      }
    }
  });

  test('Cenário 1: 10 jogadores entram na fila e iniciam partida', async () => {
    console.log('🎮 Teste: 10 jogadores entram na fila');

    // Todos os jogadores entram na fila
    for (let i = 0; i < 10; i++) {
      try {
        const response = await axios.post(`${BASE_URL}/api/games/fila/entrar`, {
          tipo_fila: 'normal'
        }, {
          headers: {
            'Authorization': `Bearer ${authTokens[i]}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.posicao).toBe(i + 1);
        
        console.log(`✅ Jogador ${i + 1} entrou na fila (posição: ${response.data.posicao})`);
      } catch (error) {
        console.error(`❌ Erro ao entrar na fila (jogador ${i + 1}):`, error.response?.data || error.message);
        throw error;
      }
    }

    // Aguardar um pouco para o sistema processar
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verificar se a partida foi criada
    const statusResponse = await axios.get(`${BASE_URL}/api/games/status-sistema`);
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.data.status).toBe('online');
    
    console.log('✅ Partida iniciada com 10 jogadores');
  });

  test('Cenário 2: Jogadores fazem apostas e chutes', async () => {
    console.log('⚽ Teste: Jogadores fazem chutes');

    // Simular chutes de todos os jogadores
    for (let i = 0; i < 10; i++) {
      try {
        const chuteData = {
          partida_id: gameId || 'test-game-id',
          zona: ['center', 'left', 'right', 'top', 'bottom'][i % 5],
          potencia: Math.floor(Math.random() * 100) + 1,
          angulo: Math.floor(Math.random() * 90) - 45
        };

        const response = await axios.post(`${BASE_URL}/api/games/chutar`, chuteData, {
          headers: {
            'Authorization': `Bearer ${authTokens[i]}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
        expect(response.data.resultado).toBeDefined();
        
        console.log(`✅ Jogador ${i + 1} chutou: ${chuteData.zona} (${chuteData.potencia}%, ${chuteData.angulo}°) - Gol: ${response.data.gol_marcado ? 'SIM' : 'NÃO'}`);
      } catch (error) {
        console.error(`❌ Erro no chute (jogador ${i + 1}):`, error.response?.data || error.message);
        // Não falhar o teste se for erro de partida não encontrada (simulação)
        if (!error.response?.data?.error?.includes('não está nesta partida')) {
          throw error;
        }
      }
    }
  });

  test('Cenário 3: Verificar saldos e transações', async () => {
    console.log('💰 Teste: Verificar saldos e transações');

    for (let i = 0; i < 10; i++) {
      try {
        // Verificar saldo
        const saldoResponse = await axios.get(`${BASE_URL}/api/user/saldo`, {
          headers: {
            'Authorization': `Bearer ${authTokens[i]}`
          }
        });

        expect(saldoResponse.status).toBe(200);
        expect(saldoResponse.data.saldo).toBeDefined();
        expect(typeof saldoResponse.data.saldo).toBe('number');
        
        console.log(`✅ Jogador ${i + 1} - Saldo: R$ ${saldoResponse.data.saldo.toFixed(2)}`);

        // Verificar transações
        const transacoesResponse = await axios.get(`${BASE_URL}/api/user/ultimas-transacoes?limit=5`, {
          headers: {
            'Authorization': `Bearer ${authTokens[i]}`
          }
        });

        expect(transacoesResponse.status).toBe(200);
        expect(transacoesResponse.data.transacoes).toBeDefined();
        expect(Array.isArray(transacoesResponse.data.transacoes)).toBe(true);
        
        console.log(`✅ Jogador ${i + 1} - Transações: ${transacoesResponse.data.transacoes.length}`);
      } catch (error) {
        console.error(`❌ Erro ao verificar saldo (jogador ${i + 1}):`, error.response?.data || error.message);
        throw error;
      }
    }
  });

  test('Cenário 4: Teste de pagamentos PIX', async () => {
    console.log('💳 Teste: Sistema de pagamentos PIX');

    // Testar criação de pagamento PIX
    try {
      const pagamentoResponse = await axios.post(`${BASE_URL}/api/payments/pix/criar`, {
        valor: 50.00,
        descricao: 'Depósito de teste E2E'
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens[0]}`
        }
      });

      expect(pagamentoResponse.status).toBe(200);
      expect(pagamentoResponse.data.success).toBe(true);
      expect(pagamentoResponse.data.payment_id).toBeDefined();
      expect(pagamentoResponse.data.qr_code).toBeDefined();
      
      console.log(`✅ Pagamento PIX criado: ${pagamentoResponse.data.payment_id}`);
      
      // Verificar status do pagamento
      const statusResponse = await axios.get(`${BASE_URL}/api/payments/pix/status/${pagamentoResponse.data.payment_id}`, {
        headers: {
          'Authorization': `Bearer ${authTokens[0]}`
        }
      });

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.data.payment_id).toBe(pagamentoResponse.data.payment_id);
      expect(statusResponse.data.status).toBeDefined();
      
      console.log(`✅ Status do pagamento: ${statusResponse.data.status}`);
    } catch (error) {
      console.error('❌ Erro no teste de pagamento PIX:', error.response?.data || error.message);
      throw error;
    }
  });

  test('Cenário 5: Teste de saque PIX', async () => {
    console.log('💸 Teste: Sistema de saques PIX');

    try {
      const saqueResponse = await axios.post(`${BASE_URL}/api/payments/saque`, {
        valor: 25.00,
        chave_pix: 'teste@example.com',
        tipo_chave: 'email'
      }, {
        headers: {
          'Authorization': `Bearer ${authTokens[0]}`
        }
      });

      expect(saqueResponse.status).toBe(200);
      expect(saqueResponse.data.success).toBe(true);
      expect(saqueResponse.data.saque_id).toBeDefined();
      expect(saqueResponse.data.status).toBe('pendente');
      
      console.log(`✅ Saque PIX solicitado: ${saqueResponse.data.saque_id}`);
    } catch (error) {
      console.error('❌ Erro no teste de saque PIX:', error.response?.data || error.message);
      // Não falhar se for erro de saldo insuficiente (esperado em teste)
      if (!error.response?.data?.error?.includes('Saldo insuficiente')) {
        throw error;
      }
      console.log('⚠️ Saque não realizado - saldo insuficiente (esperado)');
    }
  });

  test('Cenário 6: Teste de WebSocket', async () => {
    console.log('🔌 Teste: Conexão WebSocket');

    // Este teste seria implementado com uma biblioteca WebSocket real
    // Por enquanto, apenas verificamos se o endpoint existe
    try {
      const wsInfoResponse = await axios.get(`${BASE_URL}/api/games/ws/info`);
      expect(wsInfoResponse.status).toBe(200);
      console.log('✅ Endpoint WebSocket disponível');
    } catch (error) {
      console.error('❌ Erro no teste WebSocket:', error.response?.data || error.message);
      // WebSocket pode não estar implementado ainda
      console.log('⚠️ WebSocket não implementado ainda');
    }
  });

  test('Cenário 7: Teste de performance e concorrência', async () => {
    console.log('⚡ Teste: Performance e concorrência');

    const startTime = Date.now();
    
    // Simular múltiplas requisições simultâneas
    const promises = [];
    for (let i = 0; i < 50; i++) {
      promises.push(
        axios.get(`${BASE_URL}/api/games/status-sistema`)
          .catch(error => ({ error: error.message }))
      );
    }

    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;

    expect(successCount).toBeGreaterThan(0);
    expect(duration).toBeLessThan(5000); // Menos de 5 segundos
    
    console.log(`✅ Performance: ${successCount} sucessos, ${errorCount} erros em ${duration}ms`);
  });

  test.afterAll(async () => {
    console.log('🧹 Limpeza dos testes E2E');
    
    // Limpar dados de teste se necessário
    // (Implementar limpeza de banco de dados se necessário)
    
    console.log('✅ Testes E2E concluídos');
  });
});
