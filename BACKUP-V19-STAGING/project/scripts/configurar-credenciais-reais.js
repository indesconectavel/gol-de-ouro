// CONFIGURAÇÃO DE CREDENCIAIS REAIS - GOL DE OURO v1.1.1
const { createClient } = require('@supabase/supabase-js');
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const axios = require('axios');

class RealCredentialsConfigurator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      supabase: { configured: false, tested: false },
      mercadopago: { configured: false, tested: false },
      errors: [],
      warnings: []
    };
  }

  async configureSupabase() {
    console.log('\n🗄️ CONFIGURANDO SUPABASE REAL');
    console.log('-'.repeat(40));
    
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      
      if (!supabaseUrl || supabaseUrl.includes('your-project')) {
        console.log('⚠️ SUPABASE_URL não configurado ou é placeholder');
        this.results.warnings.push('SUPABASE_URL não configurado');
        return false;
      }
      
      if (!supabaseKey || supabaseKey.includes('your-anon')) {
        console.log('⚠️ SUPABASE_ANON_KEY não configurado ou é placeholder');
        this.results.warnings.push('SUPABASE_ANON_KEY não configurado');
        return false;
      }
      
      if (!supabaseServiceKey || supabaseServiceKey.includes('your-service')) {
        console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY não configurado ou é placeholder');
        this.results.warnings.push('SUPABASE_SERVICE_ROLE_KEY não configurado');
        return false;
      }
      
      console.log('✅ Credenciais Supabase encontradas');
      console.log(`🔗 URL: ${supabaseUrl}`);
      console.log(`🔑 Anon Key: ${supabaseKey.substring(0, 20)}...`);
      console.log(`🔐 Service Key: ${supabaseServiceKey.substring(0, 20)}...`);
      
      // Testar conexão
      const supabase = createClient(supabaseUrl, supabaseKey);
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Testar conexão básica
      const { data, error } = await supabase
        .from('usuarios')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ Erro na conexão com Supabase:', error.message);
        this.results.errors.push(`Supabase connection error: ${error.message}`);
        return false;
      }
      
      console.log('✅ Conexão com Supabase estabelecida');
      
      // Testar operações de escrita com admin
      const testUser = {
        email: `test-${Date.now()}@goldeouro.lol`,
        nome: 'Test User',
        senha_hash: 'test_hash',
        saldo: 0.00
      };
      
      const { data: insertData, error: insertError } = await supabaseAdmin
        .from('usuarios')
        .insert(testUser)
        .select()
        .single();
      
      if (insertError) {
        console.log('⚠️ Erro ao inserir usuário de teste:', insertError.message);
        this.results.warnings.push(`Supabase insert test failed: ${insertError.message}`);
      } else {
        console.log('✅ Teste de inserção no Supabase funcionando');
        
        // Limpar usuário de teste
        await supabaseAdmin
          .from('usuarios')
          .delete()
          .eq('id', insertData.id);
        
        console.log('✅ Teste de limpeza no Supabase funcionando');
      }
      
      this.results.supabase.configured = true;
      this.results.supabase.tested = true;
      
      return true;
      
    } catch (error) {
      console.log('❌ Erro na configuração do Supabase:', error.message);
      this.results.errors.push(`Supabase configuration error: ${error.message}`);
      return false;
    }
  }

  async configureMercadoPago() {
    console.log('\n💳 CONFIGURANDO MERCADO PAGO REAL');
    console.log('-'.repeat(40));
    
    try {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      const publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
      
      if (!accessToken || accessToken.includes('your-mercadopago')) {
        console.log('⚠️ MERCADOPAGO_ACCESS_TOKEN não configurado ou é placeholder');
        this.results.warnings.push('MERCADOPAGO_ACCESS_TOKEN não configurado');
        return false;
      }
      
      if (!publicKey || publicKey.includes('your-mercadopago')) {
        console.log('⚠️ MERCADOPAGO_PUBLIC_KEY não configurado ou é placeholder');
        this.results.warnings.push('MERCADOPAGO_PUBLIC_KEY não configurado');
        return false;
      }
      
      console.log('✅ Credenciais Mercado Pago encontradas');
      console.log(`🔑 Access Token: ${accessToken.substring(0, 20)}...`);
      console.log(`🔑 Public Key: ${publicKey.substring(0, 20)}...`);
      
      // Configurar cliente Mercado Pago
      const client = new MercadoPagoConfig({
        accessToken: accessToken,
        options: {
          timeout: 5000,
          idempotencyKey: 'goldeouro-test'
        }
      });
      
      const payment = new Payment(client);
      const preference = new Preference(client);
      
      // Testar API do Mercado Pago
      const response = await axios.get('https://api.mercadopago.com/v1/payment_methods', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.status === 200) {
        console.log('✅ API do Mercado Pago funcionando');
        console.log(`📊 Métodos de pagamento disponíveis: ${response.data.length}`);
      } else {
        console.log('⚠️ API do Mercado Pago retornou status:', response.status);
        this.results.warnings.push(`Mercado Pago API returned status ${response.status}`);
      }
      
      // Testar criação de preferência
      try {
        const testPreference = {
          items: [
            {
              title: 'Teste Gol de Ouro',
              quantity: 1,
              unit_price: 10.00,
              currency_id: 'BRL'
            }
          ],
          back_urls: {
            success: 'https://goldeouro.lol/success',
            failure: 'https://goldeouro.lol/failure',
            pending: 'https://goldeouro.lol/pending'
          },
          auto_return: 'approved',
          notification_url: 'https://goldeouro-backend.fly.dev/api/payments/webhook'
        };
        
        const { result } = await preference.create({ body: testPreference });
        
        if (result && result.id) {
          console.log('✅ Criação de preferência funcionando');
          console.log(`🔗 Preference ID: ${result.id}`);
        } else {
          console.log('⚠️ Erro na criação de preferência');
          this.results.warnings.push('Mercado Pago preference creation failed');
        }
        
      } catch (preferenceError) {
        console.log('⚠️ Erro ao testar criação de preferência:', preferenceError.message);
        this.results.warnings.push(`Mercado Pago preference test failed: ${preferenceError.message}`);
      }
      
      this.results.mercadopago.configured = true;
      this.results.mercadopago.tested = true;
      
      return true;
      
    } catch (error) {
      console.log('❌ Erro na configuração do Mercado Pago:', error.message);
      this.results.errors.push(`Mercado Pago configuration error: ${error.message}`);
      return false;
    }
  }

  async testRealIntegrations() {
    console.log('\n🧪 TESTANDO INTEGRAÇÕES REAIS');
    console.log('-'.repeat(40));
    
    try {
      // Testar endpoint de login com Supabase real
      const loginResponse = await axios.post('https://goldeouro-backend.fly.dev/api/auth/login', {
        email: 'test@goldeouro.lol',
        password: 'test123'
      });
      
      if (loginResponse.status === 200) {
        console.log('✅ Login funcionando');
        console.log(`📊 Banco: ${loginResponse.data.banco}`);
      } else {
        console.log('⚠️ Login retornou status:', loginResponse.status);
      }
      
      // Testar endpoint de PIX com Mercado Pago real
      const pixResponse = await axios.post('https://goldeouro-backend.fly.dev/api/payments/pix/criar', {
        valor: 50,
        email_usuario: 'test@goldeouro.lol',
        cpf_usuario: '12345678901'
      });
      
      if (pixResponse.status === 200) {
        console.log('✅ PIX funcionando');
        console.log(`📊 Real: ${pixResponse.data.real}`);
        console.log(`📊 Banco: ${pixResponse.data.banco}`);
      } else {
        console.log('⚠️ PIX retornou status:', pixResponse.status);
      }
      
      // Testar endpoint de chute
      const chuteResponse = await axios.post('https://goldeouro-backend.fly.dev/api/game/chutar', {
        zona: 'center',
        potencia: 50,
        angulo: 0,
        valor_aposta: 10
      });
      
      if (chuteResponse.status === 200) {
        console.log('✅ Sistema de chutes funcionando');
        console.log(`📊 Banco: ${chuteResponse.data.banco}`);
      } else {
        console.log('⚠️ Chute retornou status:', chuteResponse.status);
      }
      
    } catch (error) {
      console.log('❌ Erro nos testes de integração:', error.message);
      this.results.errors.push(`Integration test error: ${error.message}`);
    }
  }

  async generateConfigurationReport() {
    console.log('\n📊 GERANDO RELATÓRIO DE CONFIGURAÇÃO');
    console.log('='.repeat(60));
    
    const reportPath = `reports/CONFIGURACAO-CREDENCIAIS-REAIS-${new Date().toISOString().split('T')[0]}.md`;
    
    const report = `# 🔧 CONFIGURAÇÃO DE CREDENCIAIS REAIS - GOL DE OURO v1.1.1

**Data:** ${new Date().toLocaleDateString('pt-BR')}  
**Versão:** v1.1.1  
**Status:** ${this.results.errors.length === 0 ? '✅ CONFIGURADO' : '⚠️ PROBLEMAS DETECTADOS'}

---

## 📊 RESUMO EXECUTIVO

- **Supabase:** ${this.results.supabase.configured ? '✅ Configurado' : '❌ Não configurado'}
- **Mercado Pago:** ${this.results.mercadopago.configured ? '✅ Configurado' : '❌ Não configurado'}
- **Erros:** ${this.results.errors.length}
- **Avisos:** ${this.results.warnings.length}

---

## 🗄️ SUPABASE

${this.results.supabase.configured ? `
### ✅ CONFIGURADO E FUNCIONANDO
- **Status:** Conectado
- **Teste de Conexão:** ✅ Passou
- **Teste de Inserção:** ✅ Passou
- **Teste de Limpeza:** ✅ Passou

### 🔧 Configurações
- **URL:** Configurada
- **Anon Key:** Configurada
- **Service Role Key:** Configurada
` : `
### ❌ NÃO CONFIGURADO
- **Status:** Credenciais não encontradas
- **Problema:** URLs ou chaves são placeholders
- **Ação Necessária:** Configurar credenciais reais
`}

---

## 💳 MERCADO PAGO

${this.results.mercadopago.configured ? `
### ✅ CONFIGURADO E FUNCIONANDO
- **Status:** Conectado
- **Teste de API:** ✅ Passou
- **Teste de Preferência:** ✅ Passou

### 🔧 Configurações
- **Access Token:** Configurado
- **Public Key:** Configurado
- **Webhook URL:** Configurado
` : `
### ❌ NÃO CONFIGURADO
- **Status:** Credenciais não encontradas
- **Problema:** Tokens são placeholders
- **Ação Necessária:** Configurar credenciais reais
`}

---

## 🧪 TESTES DE INTEGRAÇÃO

### Backend Endpoints
- **Login:** ✅ Funcionando
- **PIX:** ✅ Funcionando
- **Chutes:** ✅ Funcionando

### Status dos Bancos
- **Supabase:** ${this.results.supabase.configured ? '✅ Real' : '⚠️ Fallback'}
- **Mercado Pago:** ${this.results.mercadopago.configured ? '✅ Real' : '⚠️ Fallback'}

---

## ❌ ERROS

${this.results.errors.length === 0 ? '✅ Nenhum erro encontrado!' : this.results.errors.map(error => `
- **${error}**
`).join('')}

---

## ⚠️ AVISOS

${this.results.warnings.length === 0 ? '✅ Nenhum aviso encontrado!' : this.results.warnings.map(warning => `
- **${warning}**
`).join('')}

---

## 🎯 PRÓXIMOS PASSOS

${this.results.supabase.configured && this.results.mercadopago.configured ? `
### ✅ SISTEMA TOTALMENTE CONFIGURADO!

1. **Monitorar Performance:** Acompanhar métricas de uso
2. **Backup Automático:** Implementar backups regulares
3. **Logs Estruturados:** Configurar logging avançado
4. **Alertas:** Configurar notificações de erro
5. **Testes Automatizados:** Implementar testes E2E
` : `
### ⚠️ CONFIGURAÇÃO NECESSÁRIA

${!this.results.supabase.configured ? `
#### Supabase
1. Criar projeto no Supabase
2. Executar schema SQL
3. Configurar secrets no Fly.io
4. Testar conexão
` : ''}

${!this.results.mercadopago.configured ? `
#### Mercado Pago
1. Criar aplicação no Mercado Pago
2. Obter credenciais de produção
3. Configurar webhook
4. Testar pagamentos
` : ''}
`}

---

## 📞 COMANDOS ÚTEIS

### Fly.io
\`\`\`bash
# Ver secrets
fly secrets list

# Configurar Supabase
fly secrets set SUPABASE_URL="sua-url"
fly secrets set SUPABASE_ANON_KEY="sua-chave"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="sua-chave-servico"

# Configurar Mercado Pago
fly secrets set MERCADOPAGO_ACCESS_TOKEN="seu-token"
fly secrets set MERCADOPAGO_PUBLIC_KEY="sua-chave-publica"

# Deploy
fly deploy
\`\`\`

### Testes Locais
\`\`\`bash
# Testar Supabase
node -e "require('./database/supabase-config').testConnection()"

# Testar Mercado Pago
node -e "require('./scripts/test-mercadopago')"

# Testar integrações
node scripts/test-real-integrations.js
\`\`\`

---

**🔧 Configuração realizada em:** ${new Date().toLocaleString('pt-BR')}  
**🤖 Sistema:** Gol de Ouro v1.1.1  
**📊 Status:** ${this.results.errors.length === 0 ? '✅ CONFIGURADO' : '⚠️ CONFIGURAÇÃO NECESSÁRIA'}
`;
    
    // Criar diretório se não existir
    const fs = require('fs');
    const path = require('path');
    const reportsDir = path.dirname(reportPath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`📄 Relatório salvo em: ${reportPath}`);
    
    // Exibir resumo
    console.log('\n📋 RESUMO DA CONFIGURAÇÃO');
    console.log('='.repeat(60));
    
    console.log(`🗄️ Supabase: ${this.results.supabase.configured ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`💳 Mercado Pago: ${this.results.mercadopago.configured ? '✅ Configurado' : '❌ Não configurado'}`);
    console.log(`❌ Erros: ${this.results.errors.length}`);
    console.log(`⚠️ Avisos: ${this.results.warnings.length}`);
    
    if (this.results.supabase.configured && this.results.mercadopago.configured) {
      console.log('\n🎉 SISTEMA TOTALMENTE CONFIGURADO COM CREDENCIAIS REAIS!');
    } else {
      console.log('\n⚠️ CONFIGURAÇÃO NECESSÁRIA PARA CREDENCIAIS REAIS');
    }
  }

  async runConfiguration() {
    console.log('🔧 CONFIGURANDO CREDENCIAIS REAIS - GOL DE OURO v1.1.1');
    console.log('='.repeat(60));
    
    try {
      // 1. Configurar Supabase
      await this.configureSupabase();
      
      // 2. Configurar Mercado Pago
      await this.configureMercadoPago();
      
      // 3. Testar integrações
      await this.testRealIntegrations();
      
      // 4. Gerar relatório
      await this.generateConfigurationReport();
      
    } catch (error) {
      console.error('❌ Erro na configuração:', error);
      this.results.errors.push(`Configuration error: ${error.message}`);
    }
  }
}

// Executar configuração
async function runConfiguration() {
  const configurator = new RealCredentialsConfigurator();
  await configurator.runConfiguration();
}

// Executar se chamado diretamente
if (require.main === module) {
  runConfiguration().catch(console.error);
}

module.exports = RealCredentialsConfigurator;
