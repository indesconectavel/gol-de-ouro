// Utilitários para testes - Gol de Ouro Player
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { SidebarProvider } from '../contexts/SidebarContext';

// Mock do localStorage
export const mockLocalStorage = () => {
  const store = {};
  
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    })
  };
};

// Mock do fetch
export const mockFetch = (data, status = 200) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data))
    })
  );
};

// Mock do WebSocket
export const mockWebSocket = () => {
  const mockWs = {
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: WebSocket.OPEN
  };
  
  global.WebSocket = jest.fn(() => mockWs);
  return mockWs;
};

// Wrapper para testes com providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialEntries = ['/'],
    ...renderOptions
  } = options;

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthProvider>
        <SidebarProvider>
          {children}
        </SidebarProvider>
      </AuthProvider>
    </BrowserRouter>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    history: { push: jest.fn() }
  };
};

// Helper para simular usuário logado
export const mockLoggedInUser = (user = {}) => {
  const defaultUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    balance: 1000,
    ...user
  };

  localStorage.setItem('token', 'mock-token');
  localStorage.setItem('user', JSON.stringify(defaultUser));
  
  return defaultUser;
};

// Helper para simular usuário não logado
export const mockLoggedOutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Helper para aguardar elementos aparecerem
export const waitForElement = async (selector, timeout = 5000) => {
  return await waitFor(() => {
    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element ${selector} not found`);
    }
    return element;
  }, { timeout });
};

// Helper para simular eventos de teclado
export const simulateKeyPress = (element, key, options = {}) => {
  fireEvent.keyDown(element, { key, ...options });
  fireEvent.keyUp(element, { key, ...options });
};

// Helper para simular drag and drop
export const simulateDragAndDrop = (source, target) => {
  fireEvent.dragStart(source);
  fireEvent.dragOver(target);
  fireEvent.drop(target);
  fireEvent.dragEnd(source);
};

// Helper para simular upload de arquivo
export const simulateFileUpload = (input, file) => {
  Object.defineProperty(input, 'files', {
    value: [file],
    writable: false,
  });
  
  fireEvent.change(input);
};

// Mock de dados de teste
export const mockData = {
  user: {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    balance: 1500,
    avatar: '/images/avatar.jpg'
  },
  
  game: {
    id: 'game-1',
    status: 'waiting',
    players: ['player-1', 'player-2'],
    bet: 100,
    queuePosition: 1
  },
  
  payment: {
    id: 'pix-123',
    amount: 500,
    status: 'pending',
    pixCode: '00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540500.005802BR5913Gol de Ouro6009Sao Paulo62070503***6304',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos
  },
  
  notification: {
    id: 'notif-1',
    type: 'success',
    title: 'Pagamento aprovado',
    message: 'Seu depósito de R$ 500,00 foi processado com sucesso!',
    timestamp: new Date()
  }
};

// Helper para limpar mocks
export const cleanupMocks = () => {
  jest.clearAllMocks();
  localStorage.clear();
  if (global.fetch) {
    global.fetch.mockClear();
  }
  if (global.WebSocket) {
    global.WebSocket.mockClear();
  }
};

// Configuração padrão para testes
export const defaultTestConfig = {
  timeout: 10000,
  retries: 3,
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js']
};

export default {
  mockLocalStorage,
  mockFetch,
  mockWebSocket,
  renderWithProviders,
  mockLoggedInUser,
  mockLoggedOutUser,
  waitForElement,
  simulateKeyPress,
  simulateDragAndDrop,
  simulateFileUpload,
  mockData,
  cleanupMocks,
  defaultTestConfig
};
