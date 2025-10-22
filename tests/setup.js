// Setup para testes Jest
const { execSync } = require('child_process');

// Configurar ambiente de teste
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';

// Mock de console para testes
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Limpar mocks após cada teste
afterEach(() => {
  jest.clearAllMocks();
});

// Setup global para testes
beforeAll(() => {
  console.log('🧪 Configurando ambiente de teste...');
});

afterAll(() => {
  console.log('✅ Testes concluídos');
});