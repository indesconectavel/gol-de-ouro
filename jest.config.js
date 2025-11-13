/**
 * JEST CONFIGURATION - GOL DE OURO
 * ==================================
 * Configuração do Jest para testes automatizados
 * Data: 13 de Novembro de 2025
 * Versão: 1.2.0
 */

module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Timeout aumentado para evitar erros de timeout
  testTimeout: 30000, // 30 segundos
  
  // Limitar workers para evitar problemas de concorrência
  maxWorkers: 1,
  
  // Modo verboso para melhor debugging
  verbose: true,
  
  // Não coletar cobertura por padrão (pode ser habilitado com --coverage)
  collectCoverage: false,
  
  // Padrões de arquivos de teste
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],
  
  // Ignorar diretórios
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.git/'
  ],
  
  // Extensões de arquivo suportadas
  moduleFileExtensions: ['js', 'json'],
  
  // Transformações (nenhuma por enquanto, usando CommonJS)
  transform: {},
  
  // Setup files
  setupFilesAfterEnv: [],
  
  // Coverage
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/dist/**',
    '!**/build/**',
    '!jest.config.js'
  ]
};
