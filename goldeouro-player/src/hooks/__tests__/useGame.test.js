// Testes para o hook useGame - Gol de Ouro Player
import { renderHook, act } from '@testing-library/react';
import { useGame } from '../useGame';
import { mockFetch, cleanupMocks } from '../../utils/testUtils';

// Mock do useAuth
const mockUser = {
  id: '1',
  name: 'João Silva',
  email: 'joao@example.com',
  balance: 1000
};

jest.mock('../useAuth', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

// Mock do gameService
jest.mock('../../services/gameService', () => ({
  getPlayerStats: jest.fn(),
  getGameStatus: jest.fn(),
  joinQueue: jest.fn(),
  leaveQueue: jest.fn(),
  makeShot: jest.fn()
}));

describe('useGame Hook', () => {
  beforeEach(() => {
    cleanupMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  test('inicializa com estado padrão', () => {
    const { result } = renderHook(() => useGame());
    
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.playerStats).toEqual({
      totalShots: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      currentBalance: 1000
    });
    expect(result.current.gameStatus).toEqual({
      isInQueue: false,
      queuePosition: 0,
      currentGame: null,
      canJoinQueue: true
    });
  });

  test('carrega dados do jogador ao inicializar', async () => {
    const mockStats = {
      totalShots: 50,
      totalWins: 30,
      totalLosses: 20,
      winRate: 60,
      currentBalance: 1500
    };

    const mockGameStatus = {
      isInQueue: false,
      queuePosition: 0,
      currentGame: null,
      canJoinQueue: true
    };

    mockFetch(mockStats);
    
    const { result } = renderHook(() => useGame());
    
    await act(async () => {
      await result.current.loadGameData();
    });
    
    expect(result.current.playerStats).toEqual(mockStats);
    expect(result.current.gameStatus).toEqual(mockGameStatus);
    expect(result.current.isLoading).toBe(false);
  });

  test('entra na fila corretamente', async () => {
    const { result } = renderHook(() => useGame());
    
    await act(async () => {
      await result.current.joinQueue(100);
    });
    
    expect(result.current.gameStatus.isInQueue).toBe(true);
  });

  test('sai da fila corretamente', async () => {
    const { result } = renderHook(() => useGame());
    
    // Primeiro entra na fila
    await act(async () => {
      await result.current.joinQueue(100);
    });
    
    // Depois sai da fila
    await act(async () => {
      await result.current.leaveQueue();
    });
    
    expect(result.current.gameStatus.isInQueue).toBe(false);
  });

  test('faz chute corretamente', async () => {
    const { result } = renderHook(() => useGame());
    
    const shotData = {
      angle: 45,
      power: 80,
      position: 'center'
    };
    
    await act(async () => {
      await result.current.makeShot(shotData);
    });
    
    expect(result.current.playerStats.totalShots).toBe(1);
  });

  test('atualiza estatísticas após vitória', async () => {
    const { result } = renderHook(() => useGame());
    
    // Simular vitória
    await act(async () => {
      await result.current.makeShot({ angle: 45, power: 80, position: 'center' });
      // Simular resultado da vitória
      result.current.updateGameResult({ won: true, prize: 200 });
    });
    
    expect(result.current.playerStats.totalWins).toBe(1);
    expect(result.current.playerStats.currentBalance).toBe(1200); // 1000 + 200
  });

  test('atualiza estatísticas após derrota', async () => {
    const { result } = renderHook(() => useGame());
    
    // Simular derrota
    await act(async () => {
      await result.current.makeShot({ angle: 45, power: 80, position: 'center' });
      // Simular resultado da derrota
      result.current.updateGameResult({ won: false, bet: 100 });
    });
    
    expect(result.current.playerStats.totalLosses).toBe(1);
    expect(result.current.playerStats.currentBalance).toBe(900); // 1000 - 100
  });

  test('calcula taxa de vitória corretamente', async () => {
    const { result } = renderHook(() => useGame());
    
    // Simular algumas vitórias e derrotas
    await act(async () => {
      result.current.updateGameResult({ won: true });
      result.current.updateGameResult({ won: true });
      result.current.updateGameResult({ won: false });
    });
    
    expect(result.current.playerStats.winRate).toBe(66.67); // 2/3 * 100
  });

  test('trata erros de API corretamente', async () => {
    const { result } = renderHook(() => useGame());
    
    // Simular erro na API
    mockFetch({ error: 'API Error' }, 500);
    
    await act(async () => {
      await result.current.loadGameData();
    });
    
    expect(result.current.error).toBe('Erro ao carregar dados do jogo');
    expect(result.current.isLoading).toBe(false);
  });

  test('valida dados de entrada do chute', async () => {
    const { result } = renderHook(() => useGame());
    
    // Testar ângulo inválido
    await act(async () => {
      try {
        await result.current.makeShot({ angle: 200, power: 80, position: 'center' });
      } catch (error) {
        expect(error.message).toBe('Ângulo deve estar entre 0 e 180 graus');
      }
    });
    
    // Testar potência inválida
    await act(async () => {
      try {
        await result.current.makeShot({ angle: 45, power: 150, position: 'center' });
      } catch (error) {
        expect(error.message).toBe('Potência deve estar entre 0 e 100');
      }
    });
  });

  test('verifica se pode entrar na fila baseado no saldo', async () => {
    const { result } = renderHook(() => useGame());
    
    // Com saldo suficiente
    expect(result.current.gameStatus.canJoinQueue).toBe(true);
    
    // Simular saldo insuficiente
    await act(async () => {
      result.current.updatePlayerStats({ currentBalance: 50 });
    });
    
    expect(result.current.gameStatus.canJoinQueue).toBe(false);
  });
});
