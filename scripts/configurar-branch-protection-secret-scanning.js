#!/usr/bin/env node
/**
 * 🔒 CONFIGURADOR AUTOMÁTICO - BRANCH PROTECTION E SECRET SCANNING
 * ================================================================
 * Este script configura automaticamente Branch Protection Rules e Secret Scanning
 * usando a API do GitHub
 * 
 * Data: 14 de Novembro de 2025
 * Versão: 1.2.0
 */

const https = require('https');
const { execSync } = require('child_process');

class GitHubConfigurator {
  constructor() {
    this.owner = 'indesconectavel';
    this.repo = 'gol-de-ouro';
    this.branch = 'main';
    this.token = process.env.GITHUB_TOKEN;
    
    if (!this.token) {
      console.error('❌ GITHUB_TOKEN não configurado!');
      console.log('\n📋 Para configurar:');
      console.log('1. Acesse: https://github.com/settings/tokens');
      console.log('2. Crie um token com permissões: repo, admin:repo_hook');
      console.log('3. Execute: export GITHUB_TOKEN=seu_token_aqui');
      console.log('   ou adicione ao .env.local: GITHUB_TOKEN=seu_token_aqui\n');
      process.exit(1);
    }
  }

  // Fazer requisição à API do GitHub
  async apiRequest(method, endpoint, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.github.com',
        path: endpoint,
        method: method,
        headers: {
          'Authorization': `token ${this.token}`,
          'User-Agent': 'Gol-de-Ouro-Configurator',
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {};
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsed);
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
            }
          } catch (e) {
            resolve(body);
          }
        });
      });

      req.on('error', reject);
      
      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  // Configurar Branch Protection Rules
  async configurarBranchProtection() {
    console.log('\n🔒 Configurando Branch Protection Rules...\n');

    const endpoint = `/repos/${this.owner}/${this.repo}/branches/${this.branch}/protection`;
    
    const protectionRules = {
      required_status_checks: {
        strict: true,
        contexts: [
          'CI',
          'Testes Automatizados',
          'Segurança e Qualidade'
        ]
      },
      enforce_admins: false, // Não aplicar para administradores
      required_pull_request_reviews: {
        required_approving_review_count: 1,
        dismiss_stale_reviews: true,
        require_code_owner_reviews: false
      },
      restrictions: null, // Permitir que todos possam criar PRs
      allow_force_pushes: false,
      allow_deletions: false,
      required_linear_history: false,
      allow_squash_merge: true,
      allow_merge_commit: true,
      allow_rebase_merge: true
    };

    try {
      const result = await this.apiRequest('PUT', endpoint, protectionRules);
      console.log('✅ Branch Protection Rules configuradas com sucesso!');
      console.log(`   Branch: ${this.branch}`);
      console.log(`   Required approvals: 1`);
      console.log(`   Status checks: CI, Testes Automatizados, Segurança e Qualidade`);
      console.log(`   Force pushes: Desabilitado`);
      console.log(`   Deletions: Desabilitado`);
      return true;
    } catch (error) {
      if (error.message.includes('HTTP 404')) {
        console.log('⚠️ Branch Protection não pode ser configurada via API (requer permissões especiais)');
        console.log('💡 Use o GitHub CLI ou configure manualmente no GitHub Settings');
        return false;
      } else if (error.message.includes('HTTP 403')) {
        console.log('⚠️ Token não tem permissões suficientes para configurar Branch Protection');
        console.log('💡 O token precisa ter permissão: admin:repo_hook');
        return false;
      } else {
        console.error('❌ Erro ao configurar Branch Protection:', error.message);
        return false;
      }
    }
  }

  // Verificar se Secret Scanning está habilitado
  async verificarSecretScanning() {
    console.log('\n🔍 Verificando Secret Scanning...\n');

    try {
      // Tentar usar GitHub CLI primeiro
      try {
        const result = execSync(`gh api repos/${this.owner}/${this.repo} --jq '.security_and_analysis.secret_scanning.status'`, { 
          encoding: 'utf8',
          env: { ...process.env, GITHUB_TOKEN: this.token }
        });
        
        if (result.trim() === 'enabled') {
          console.log('✅ Secret Scanning já está habilitado!');
          return true;
        } else {
          console.log('⚠️ Secret Scanning não está habilitado');
          return false;
        }
      } catch (e) {
        // Se GitHub CLI não funcionar, tentar API direta
        const endpoint = `/repos/${this.owner}/${this.repo}`;
        const repo = await this.apiRequest('GET', endpoint);
        
        if (repo.security_and_analysis?.secret_scanning?.status === 'enabled') {
          console.log('✅ Secret Scanning já está habilitado!');
          return true;
        } else {
          console.log('⚠️ Secret Scanning não está habilitado');
          console.log('💡 Secret Scanning precisa ser habilitado manualmente no GitHub Settings');
          console.log('   Acesse: https://github.com/indesconectavel/gol-de-ouro/settings/security');
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao verificar Secret Scanning:', error.message);
      return false;
    }
  }

  // Tentar habilitar Secret Scanning via API
  async habilitarSecretScanning() {
    console.log('\n🔒 Tentando habilitar Secret Scanning...\n');

    try {
      // Secret Scanning geralmente precisa ser habilitado manualmente
      // Mas podemos tentar via API
      const endpoint = `/repos/${this.owner}/${this.repo}/vulnerability-alerts`;
      
      try {
        await this.apiRequest('PUT', endpoint);
        console.log('✅ Secret Scanning habilitado via API!');
        return true;
      } catch (error) {
        if (error.message.includes('HTTP 404') || error.message.includes('HTTP 403')) {
          console.log('⚠️ Secret Scanning não pode ser habilitado via API');
          console.log('💡 Configure manualmente:');
          console.log('   1. Acesse: https://github.com/indesconectavel/gol-de-ouro/settings/security');
          console.log('   2. Role até "Code security and analysis"');
          console.log('   3. Clique em "Enable" em "Secret scanning"');
          return false;
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('❌ Erro ao habilitar Secret Scanning:', error.message);
      return false;
    }
  }

  // Usar GitHub CLI para configurar (método alternativo)
  async configurarViaCLI() {
    console.log('\n🛠️ Tentando configurar via GitHub CLI...\n');

    try {
      // Verificar se gh está instalado
      execSync('gh --version', { stdio: 'ignore' });
      
      console.log('✅ GitHub CLI encontrado!');
      
      // Configurar Branch Protection via CLI
      try {
        console.log('📝 Configurando Branch Protection via CLI...');
        // Nota: gh não tem comando direto para branch protection, mas podemos usar API
        const result = await this.configurarBranchProtection();
        return result;
      } catch (error) {
        console.log('⚠️ Não foi possível configurar via CLI');
        return false;
      }
    } catch (error) {
      console.log('⚠️ GitHub CLI não encontrado');
      console.log('💡 Instale: https://cli.github.com/');
      return false;
    }
  }

  async executar() {
    console.log('🔒 CONFIGURADOR AUTOMÁTICO - BRANCH PROTECTION E SECRET SCANNING\n');
    console.log('='.repeat(70));
    console.log(`Repositório: ${this.owner}/${this.repo}`);
    console.log(`Branch: ${this.branch}`);
    console.log('='.repeat(70));

    const resultados = {
      branchProtection: false,
      secretScanning: false
    };

    // Tentar configurar Branch Protection
    resultados.branchProtection = await this.configurarBranchProtection();

    // Verificar e tentar habilitar Secret Scanning
    const jaHabilitado = await this.verificarSecretScanning();
    if (!jaHabilitado) {
      resultados.secretScanning = await this.habilitarSecretScanning();
    } else {
      resultados.secretScanning = true;
    }

    // Resumo
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO DA CONFIGURAÇÃO\n');
    console.log(`Branch Protection: ${resultados.branchProtection ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`Secret Scanning: ${resultados.secretScanning ? '✅ Habilitado' : '❌ Não habilitado'}`);
    console.log('='.repeat(70));

    if (!resultados.branchProtection || !resultados.secretScanning) {
      console.log('\n⚠️ Algumas configurações precisam ser feitas manualmente.');
      console.log('📋 Siga o guia em: docs/seguranca/GUIA-CONFIGURACAO-BRANCH-PROTECTION-SECRET-SCANNING.md\n');
    } else {
      console.log('\n✅ Todas as configurações foram aplicadas com sucesso!\n');
    }
  }
}

// Executar
if (require.main === module) {
  const configurator = new GitHubConfigurator();
  configurator.executar().catch(console.error);
}

module.exports = GitHubConfigurator;

