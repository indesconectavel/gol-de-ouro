/**
 * VITEST CONFIG - Configuração do Vitest para testes
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.{test,spec}.js'],
    exclude: ['node_modules', 'dist'],
    setupFiles: ['./src/tests/setup.js'],
    timeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '*.config.js'
      ]
    }
  }
});

