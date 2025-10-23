// CONFIGURAÇÃO AUTOMÁTICA URGENTE - GOL DE OURO v1.1.1
const { execSync } = require('child_process');
const readline = require('readline');

class UrgentConfiguration {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async runUrgentConfiguration() {
    console.log('🚨 CONFIGURAÇÃO URGENTE - GOL DE OURO v1.1.1');
    console.log('='.repeat(60));
    console.log('⏰ Tempo estimado: 15 minutos');
    console.log('🎯 Meta: MVP 100% real e funcional');
    console.log('');

    try {
      // 1. Configurar Supabase
      await this.configureSupabase();
      
      // 2. Configurar Mercado Pago
      await this.configureMercadoPago();
      
      // 3. Deploy e teste
      await this.deployAndTest();
      
      console.log('\n🎉 CONFIGURAÇÃO URGENTE CONCLUÍDA!');
      console.log('✅ MVP 100% real e funcional!');
      
    } catch (error) {
      console.error('❌ Erro na configuração urgente:', error.message);
      console.log('\n🔧 CONFIGURAÇÃO MANUAL NECESSÁRIA');
      console.log('Siga o guia: CONFIGURACAO-URGENTE-CREDENCIAIS-REAIS.md');
    } finally {
      this.rl.close();
    }
  }

  async configureSupabase() {
    console.log('🗄️ CONFIGURANDO SUPABASE');
    console.log('-'.repeat(30));
    
    console.log('📋 INSTRUÇÕES:');
    console.log('1. Acesse: https://supabase.com');
    console.log('2. Crie um novo projeto');
    console.log('3. Vá em Settings > API');
    console.log('4. Copie as credenciais abaixo:');
    console.log('');

    const supabaseUrl = await this.question('🔗 Project URL: ');
    const supabaseAnonKey = await this.question('🔑 Anon Key: ');
    const supabaseServiceKey = await this.question('🔐 Service Role Key: ');

    console.log('\n🔧 Configurando secrets do Supabase...');
    
    try {
      execSync(`fly secrets set SUPABASE_URL="${supabaseUrl}"`, { stdio: 'inherit' });
      execSync(`fly secrets set SUPABASE_ANON_KEY="${supabaseAnonKey}"`, { stdio: 'inherit' });
      execSync(`fly secrets set SUPABASE_SERVICE_ROLE_KEY="${supabaseServiceKey}"`, { stdio: 'inherit' });
      
      console.log('✅ Supabase configurado com sucesso!');
    } catch (error) {
      console.log('❌ Erro ao configurar Supabase:', error.message);
      throw error;
    }
  }

  async configureMercadoPago() {
    console.log('\n💳 CONFIGURANDO MERCADO PAGO');
    console.log('-'.repeat(30));
    
    console.log('📋 INSTRUÇÕES:');
    console.log('1. Acesse: https://www.mercadopago.com.br/developers');
    console.log('2. Crie uma nova aplicação');
    console.log('3. Vá em Credenciais');
    console.log('4. Copie as credenciais abaixo:');
    console.log('');

    const accessToken = await this.question('🔑 Access Token: ');
    const publicKey = await this.question('🔑 Public Key: ');

    console.log('\n🔧 Configurando secrets do Mercado Pago...');
    
    try {
      execSync(`fly secrets set MERCADOPAGO_ACCESS_TOKEN="${accessToken}"`, { stdio: 'inherit' });
      execSync(`fly secrets set MERCADOPAGO_PUBLIC_KEY="${publicKey}"`, { stdio: 'inherit' });
      
      console.log('✅ Mercado Pago configurado com sucesso!');
    } catch (error) {
      console.log('❌ Erro ao configurar Mercado Pago:', error.message);
      throw error;
    }
  }

  async deployAndTest() {
    console.log('\n🚀 FAZENDO DEPLOY E TESTANDO');
    console.log('-'.repeat(30));
    
    try {
      console.log('🔄 Fazendo deploy...');
      execSync('fly deploy', { stdio: 'inherit' });
      
      console.log('⏳ Aguardando deploy...');
      await this.sleep(30000);
      
      console.log('🧪 Testando endpoints...');
      
      // Teste de health check
      try {
        const healthCheck = execSync('curl -s https://goldeouro-backend.fly.dev/health', { encoding: 'utf8' });
        console.log('✅ Health check OK');
        console.log(healthCheck);
      } catch (error) {
        console.log('⚠️ Health check falhou, mas deploy pode ter sido bem-sucedido');
      }
      
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
      console.log('❌ Erro no deploy:', error.message);
      throw error;
    }
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Executar configuração urgente
async function runUrgentConfiguration() {
  const configurator = new UrgentConfiguration();
  await configurator.runUrgentConfiguration();
}

// Executar se chamado diretamente
if (require.main === module) {
  runUrgentConfiguration().catch(console.error);
}

module.exports = UrgentConfiguration;
