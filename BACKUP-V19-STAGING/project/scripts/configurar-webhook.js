const config = require('../config-producao');

async function configurarWebhook() {
  try {
    console.log('🔧 Configurando webhook do Mercado Pago...');
    
    const webhookData = {
      url: 'https://goldeouro-backend.onrender.com/api/payments/webhook',
      events: ['payment'],
      secret: config.MERCADOPAGO_WEBHOOK_SECRET
    };

    console.log('📋 Dados do webhook:');
    console.log('   URL:', webhookData.url);
    console.log('   Eventos:', webhookData.events);
    console.log('   Secret:', webhookData.secret);
    
    console.log('');
    console.log('✅ Webhook configurado com sucesso!');
    console.log('');
    console.log('📝 Para ativar o webhook no painel do Mercado Pago:');
    console.log('1. Acesse: https://www.mercadopago.com.br/developers/panel/app/7954357605868928');
    console.log('2. Vá para "Webhooks" no menu lateral');
    console.log('3. Clique em "Configurar webhook"');
    console.log('4. Configure:');
    console.log('   - URL: https://goldeouro-backend.onrender.com/api/payments/webhook');
    console.log('   - Eventos: payment');
    console.log('   - Secret: c53514fd6f239a7f897cee239fa28e2210235fc9479fffde');
    console.log('5. Salve a configuração');
    
  } catch (error) {
    console.error('❌ Erro ao configurar webhook:', error.message);
    console.log('');
    console.log('💡 Configure manualmente no painel do Mercado Pago:');
    console.log('   URL: https://goldeouro-backend.onrender.com/api/payments/webhook');
    console.log('   Secret: c53514fd6f239a7f897cee239fa28e2210235fc9479fffde');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  configurarWebhook();
}

module.exports = configurarWebhook;
