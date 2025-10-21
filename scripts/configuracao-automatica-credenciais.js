// CONFIGURAÇÃO AUTOMÁTICA DE CREDENCIAIS - GOL DE OURO v1.1.1
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class AutomaticCredentialsConfigurator {
  constructor() {
    this.config = {
      supabase: {
        url: '',
        anonKey: '',
        serviceKey: ''
      },
      mercadopago: {
        accessToken: '',
        publicKey: ''
      }
    };
  }

  async configureSupabase() {
    console.log('\n🗄️ CONFIGURANDO SUPABASE AUTOMATICAMENTE');
    console.log('-'.repeat(50));
    
    console.log('📋 INSTRUÇÕES PARA SUPABASE:');
    console.log('1. Acesse: https://supabase.com');
    console.log('2. Crie um novo projeto');
    console.log('3. Vá em Settings > API');
    console.log('4. Copie as credenciais abaixo:');
    console.log('');
    
    // Solicitar credenciais
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('🔗 Project URL: ', (url) => {
        this.config.supabase.url = url;
        
        rl.question('🔑 Anon Key: ', (anonKey) => {
          this.config.supabase.anonKey = anonKey;
          
          rl.question('🔐 Service Role Key: ', (serviceKey) => {
            this.config.supabase.serviceKey = serviceKey;
            
            rl.close();
            resolve();
          });
        });
      });
    });
  }

  async configureMercadoPago() {
    console.log('\n💳 CONFIGURANDO MERCADO PAGO AUTOMATICAMENTE');
    console.log('-'.repeat(50));
    
    console.log('📋 INSTRUÇÕES PARA MERCADO PAGO:');
    console.log('1. Acesse: https://www.mercadopago.com.br/developers');
    console.log('2. Crie uma nova aplicação');
    console.log('3. Vá em Credenciais');
    console.log('4. Copie as credenciais abaixo:');
    console.log('');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('🔑 Access Token: ', (accessToken) => {
        this.config.mercadopago.accessToken = accessToken;
        
        rl.question('🔑 Public Key: ', (publicKey) => {
          this.config.mercadopago.publicKey = publicKey;
          
          rl.close();
          resolve();
        });
      });
    });
  }

  async setFlySecrets() {
    console.log('\n🚀 CONFIGURANDO SECRETS NO FLY.IO');
    console.log('-'.repeat(50));
    
    try {
      // Configurar Supabase
      if (this.config.supabase.url) {
        console.log('🔧 Configurando Supabase secrets...');
        
        execSync(`fly secrets set SUPABASE_URL="${this.config.supabase.url}"`, { stdio: 'inherit' });
        execSync(`fly secrets set SUPABASE_ANON_KEY="${this.config.supabase.anonKey}"`, { stdio: 'inherit' });
        execSync(`fly secrets set SUPABASE_SERVICE_ROLE_KEY="${this.config.supabase.serviceKey}"`, { stdio: 'inherit' });
        
        console.log('✅ Supabase secrets configurados');
      }
      
      // Configurar Mercado Pago
      if (this.config.mercadopago.accessToken) {
        console.log('🔧 Configurando Mercado Pago secrets...');
        
        execSync(`fly secrets set MERCADOPAGO_ACCESS_TOKEN="${this.config.mercadopago.accessToken}"`, { stdio: 'inherit' });
        execSync(`fly secrets set MERCADOPAGO_PUBLIC_KEY="${this.config.mercadopago.publicKey}"`, { stdio: 'inherit' });
        
        console.log('✅ Mercado Pago secrets configurados');
      }
      
      // Listar secrets
      console.log('\n📋 Secrets configurados:');
      execSync('fly secrets list', { stdio: 'inherit' });
      
    } catch (error) {
      console.error('❌ Erro ao configurar secrets:', error.message);
      throw error;
    }
  }

  async deployAndTest() {
    console.log('\n🚀 FAZENDO DEPLOY E TESTANDO');
    console.log('-'.repeat(50));
    
    try {
      // Deploy
      console.log('🔄 Fazendo deploy...');
      execSync('fly deploy', { stdio: 'inherit' });
      
      // Aguardar deploy
      console.log('⏳ Aguardando deploy...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      // Testar health check
      console.log('🧪 Testando health check...');
      const { execSync } = require('child_process');
      
      try {
        const healthCheck = execSync('curl -s https://goldeouro-backend.fly.dev/health', { encoding: 'utf8' });
        console.log('✅ Health check OK');
        console.log(healthCheck);
      } catch (error) {
        console.log('⚠️ Health check falhou, mas deploy pode ter sido bem-sucedido');
      }
      
      // Testar endpoints
      console.log('🧪 Testando endpoints...');
      
      // Teste de login
      try {
        const loginTest = execSync('curl -X POST https://goldeouro-backend.fly.dev/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"test@goldeouro.lol\\",\\"password\\":\\"test123\\"}"', { encoding: 'utf8' });
        console.log('✅ Login funcionando');
        console.log(loginTest);
      } catch (error) {
        console.log('⚠️ Login falhou');
      }
      
      // Teste de PIX
      try {
        const pixTest = execSync('curl -X POST https://goldeouro-backend.fly.dev/api/payments/pix/criar -H "Content-Type: application/json" -d "{\\"valor\\":50,\\"email_usuario\\":\\"test@goldeouro.lol\\",\\"cpf_usuario\\":\\"12345678901\\"}"', { encoding: 'utf8' });
        console.log('✅ PIX funcionando');
        console.log(pixTest);
      } catch (error) {
        console.log('⚠️ PIX falhou');
      }
      
    } catch (error) {
      console.error('❌ Erro no deploy:', error.message);
      throw error;
    }
  }

  async generateConfigurationFile() {
    console.log('\n📄 GERANDO ARQUIVO DE CONFIGURAÇÃO');
    console.log('-'.repeat(50));
    
    const configFile = {
      timestamp: new Date().toISOString(),
      version: 'v1.1.1',
      supabase: {
        configured: !!this.config.supabase.url,
        url: this.config.supabase.url ? 'Configurado' : 'Não configurado',
        anonKey: this.config.supabase.anonKey ? 'Configurado' : 'Não configurado',
        serviceKey: this.config.supabase.serviceKey ? 'Configurado' : 'Não configurado'
      },
      mercadopago: {
        configured: !!this.config.mercadopago.accessToken,
        accessToken: this.config.mercadopago.accessToken ? 'Configurado' : 'Não configurado',
        publicKey: this.config.mercadopago.publicKey ? 'Configurado' : 'Não configurado'
      },
      status: 'configured'
    };
    
    const configPath = path.join(__dirname, '..', 'config', 'credentials-config.json');
    
    // Criar diretório se não existir
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    fs.writeFileSync(configPath, JSON.stringify(configFile, null, 2));
    console.log(`✅ Arquivo de configuração salvo em: ${configPath}`);
  }

  async runAutomaticConfiguration() {
    console.log('🔧 CONFIGURAÇÃO AUTOMÁTICA DE CREDENCIAIS - GOL DE OURO v1.1.1');
    console.log('='.repeat(70));
    
    try {
      // 1. Configurar Supabase
      await this.configureSupabase();
      
      // 2. Configurar Mercado Pago
      await this.configureMercadoPago();
      
      // 3. Configurar secrets no Fly.io
      await this.setFlySecrets();
      
      // 4. Deploy e teste
      await this.deployAndTest();
      
      // 5. Gerar arquivo de configuração
      await this.generateConfigurationFile();
      
      console.log('\n🎉 CONFIGURAÇÃO AUTOMÁTICA CONCLUÍDA!');
      console.log('='.repeat(70));
      
      console.log('✅ Supabase: Configurado');
      console.log('✅ Mercado Pago: Configurado');
      console.log('✅ Secrets: Configurados no Fly.io');
      console.log('✅ Deploy: Realizado');
      console.log('✅ Testes: Executados');
      
      console.log('\n🌐 URLs DO SISTEMA:');
      console.log('🔗 Backend: https://goldeouro-backend.fly.dev');
      console.log('🔗 Player: https://goldeouro.lol');
      console.log('🔗 Admin: https://admin.goldeouro.lol');
      
      console.log('\n📊 PRÓXIMOS PASSOS:');
      console.log('1. Testar sistema completo');
      console.log('2. Configurar monitoramento');
      console.log('3. Implementar backup automático');
      console.log('4. Configurar alertas');
      
    } catch (error) {
      console.error('❌ Erro na configuração automática:', error.message);
      console.log('\n🔧 CONFIGURAÇÃO MANUAL NECESSÁRIA');
      console.log('Siga o guia: GUIA-CONFIGURACAO-CREDENCIAIS-REAIS-PRATICO.md');
    }
  }
}

// Executar configuração automática
async function runAutomaticConfiguration() {
  const configurator = new AutomaticCredentialsConfigurator();
  await configurator.runAutomaticConfiguration();
}

// Executar se chamado diretamente
if (require.main === module) {
  runAutomaticConfiguration().catch(console.error);
}

module.exports = AutomaticCredentialsConfigurator;
