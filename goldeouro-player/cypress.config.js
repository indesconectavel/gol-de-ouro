// Configuração do Cypress - Gol de Ouro Player
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    setupNodeEvents(on, config) {
      // Configurações do Node.js
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
      });
    },
    
    env: {
      // Variáveis de ambiente para testes
      API_BASE_URL: 'https://goldeouro-backend.onrender.com',
      TEST_USER_EMAIL: 'test@example.com',
      TEST_USER_PASSWORD: 'password123'
    },
    
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    downloadsFolder: 'cypress/downloads'
  },
  
  component: {
    devServer: {
      framework: 'create-react-app',
      bundler: 'vite'
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.js'
  }
});