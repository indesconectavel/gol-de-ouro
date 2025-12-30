/**
 * 🔍 VALIDAÇÃO DE DATA-TESTID
 * Script para validar presença de data-testid em produção
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const FRONTEND_URL = 'https://www.goldeouro.lol';
const REPORT_DIR = path.join(__dirname, '../../docs/e2e');

const results = {
  timestamp: new Date().toISOString(),
  frontendUrl: FRONTEND_URL,
  login: {},
  register: {},
  status: 'PENDING'
};

// Utilitários
const utils = {
  log(message, type = 'info') {
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    }[type] || 'ℹ️';
    console.log(`${prefix} ${message}`);
  },

  async ensureDir(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // Ignorar se já existe
    }
  },

  async waitForElement(page, selector, timeout = 10000) {
    try {
      await page.waitForSelector(selector, { timeout });
      return await page.$(selector);
    } catch (error) {
      return null;
    }
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

/**
 * VALIDAR DATA-TESTID
 */
async function validateDataTestID() {
  utils.log('🔍 INICIANDO VALIDAÇÃO DE DATA-TESTID', 'info');
  
  await utils.ensureDir(REPORT_DIR);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  page.setDefaultTimeout(40000);
  
  try {
    // Validar Login
    utils.log('Validando data-testid na página de Login...');
    await page.goto(`${FRONTEND_URL}/login`, { waitUntil: 'networkidle2', timeout: 40000 });
    await utils.delay(3000);
    
    const loginSelectors = {
      'email-input': '[data-testid="email-input"]',
      'password-input': '[data-testid="password-input"]',
      'submit-button': '[data-testid="submit-button"]'
    };
    
    for (const [key, selector] of Object.entries(loginSelectors)) {
      const element = await utils.waitForElement(page, selector, 5000);
      const found = !!element;
      results.login[key] = {
        selector,
        found,
        status: found ? 'ENCONTRADO' : 'NÃO ENCONTRADO'
      };
      
      if (found) {
        utils.log(`  ✅ ${key}: ENCONTRADO`, 'success');
      } else {
        utils.log(`  ❌ ${key}: NÃO ENCONTRADO`, 'error');
      }
    }
    
    // Validar Register
    utils.log('Validando data-testid na página de Registro...');
    await page.goto(`${FRONTEND_URL}/register`, { waitUntil: 'networkidle2', timeout: 40000 });
    await utils.delay(3000);
    
    const registerSelectors = {
      'email-input': '[data-testid="email-input"]',
      'password-input': '[data-testid="password-input"]',
      'username-input': '[data-testid="username-input"]',
      'submit-button': '[data-testid="submit-button"]'
    };
    
    for (const [key, selector] of Object.entries(registerSelectors)) {
      const element = await utils.waitForElement(page, selector, 5000);
      const found = !!element;
      results.register[key] = {
        selector,
        found,
        status: found ? 'ENCONTRADO' : 'NÃO ENCONTRADO'
      };
      
      if (found) {
        utils.log(`  ✅ ${key}: ENCONTRADO`, 'success');
      } else {
        utils.log(`  ❌ ${key}: NÃO ENCONTRADO`, 'error');
      }
    }
    
    // Calcular status
    const allSelectors = Object.values(results.login).concat(Object.values(results.register));
    const foundCount = allSelectors.filter(s => s.found).length;
    const totalCount = allSelectors.length;
    
    if (foundCount === totalCount) {
      results.status = 'TODOS_ENCONTRADOS';
    } else if (foundCount > 0) {
      results.status = 'PARCIAL';
    } else {
      results.status = 'NENHUM_ENCONTRADO';
    }
    
    // Salvar relatório
    const reportPath = path.join(REPORT_DIR, 'data-testid-check.json');
    await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
    utils.log(`Relatório salvo: ${reportPath}`, 'success');
    
    // Resumo
    utils.log('\n=== RESUMO ===', 'info');
    utils.log(`Encontrados: ${foundCount}/${totalCount}`, foundCount === totalCount ? 'success' : 'warning');
    utils.log(`Status: ${results.status}`, results.status === 'TODOS_ENCONTRADOS' ? 'success' : 'warning');
    
  } catch (error) {
    utils.log(`❌ Erro: ${error.message}`, 'error');
    results.error = error.message;
  } finally {
    await browser.close();
  }
  
  return results;
}

// Executar se chamado diretamente
if (require.main === module) {
  validateDataTestID()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Erro na execução:', error);
      process.exit(1);
    });
}

module.exports = { validateDataTestID };

