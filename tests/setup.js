// Setup para testes - Gol de Ouro v1.1.1
const { supabase } = require('../database/supabase-config');

// Configurar timeout para testes
jest.setTimeout(30000);

// Mock do console para reduzir ruído nos testes
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Setup global para testes
beforeAll(async () => {
  console.log('🧪 Configurando ambiente de testes...');
  
  // Verificar conexão com banco de dados
  try {
    const { data, error } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (error) {
      console.warn('⚠️ Aviso: Não foi possível conectar ao banco de dados para testes');
    } else {
      console.log('✅ Conexão com banco de dados estabelecida');
    }
  } catch (error) {
    console.warn('⚠️ Aviso: Erro ao testar conexão com banco de dados:', error.message);
  }
});

afterAll(async () => {
  console.log('🧹 Limpando ambiente de testes...');
  
  // Restaurar console original
  global.console = originalConsole;
});

// Mock de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.MERCADOPAGO_ACCESS_TOKEN = 'test-access-token';
process.env.BACKEND_URL = 'http://localhost:3000';
process.env.PLAYER_URL = 'http://localhost:5174';
process.env.FRONTEND_URL = 'http://localhost:5173';
