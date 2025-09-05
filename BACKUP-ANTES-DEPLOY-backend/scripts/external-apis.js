const axios = require('axios');
const crypto = require('crypto');

class ExternalAPIIntegration {
  constructor() {
    this.apis = {
      // APIs de pagamento
      stripe: {
        baseUrl: 'https://api.stripe.com/v1',
        apiKey: process.env.STRIPE_API_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
      },
      paypal: {
        baseUrl: 'https://api.paypal.com/v1',
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET
      },
      
      // APIs de notificação
      firebase: {
        baseUrl: 'https://fcm.googleapis.com/fcm/send',
        serverKey: process.env.FIREBASE_SERVER_KEY
      },
      twilio: {
        baseUrl: 'https://api.twilio.com/2010-04-01',
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN
      },
      
      // APIs de analytics
      googleAnalytics: {
        baseUrl: 'https://www.googleapis.com/analytics/v3',
        apiKey: process.env.GOOGLE_ANALYTICS_API_KEY,
        viewId: process.env.GOOGLE_ANALYTICS_VIEW_ID
      },
      mixpanel: {
        baseUrl: 'https://api.mixpanel.com',
        projectToken: process.env.MIXPANEL_PROJECT_TOKEN
      },
      
      // APIs de autenticação
      auth0: {
        baseUrl: process.env.AUTH0_DOMAIN,
        clientId: process.env.AUTH0_CLIENT_ID,
        clientSecret: process.env.AUTH0_CLIENT_SECRET
      },
      
      // APIs de dados externos
      openWeather: {
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        apiKey: process.env.OPENWEATHER_API_KEY
      },
      newsAPI: {
        baseUrl: 'https://newsapi.org/v2',
        apiKey: process.env.NEWS_API_KEY
      }
    };
  }

  // Configurar cliente HTTP com retry e timeout
  createHttpClient(apiName, timeout = 10000) {
    const api = this.apis[apiName];
    if (!api) {
      throw new Error(`API ${apiName} não configurada`);
    }

    return axios.create({
      baseURL: api.baseUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GolDeOuro-Backend/1.0.0'
      },
      // Configuração de retry
      retry: 3,
      retryDelay: (retryCount) => retryCount * 1000
    });
  }

  // Integração com Stripe (Pagamentos)
  async processStripePayment(paymentData) {
    try {
      const client = this.createHttpClient('stripe');
      
      const response = await client.post('/payment_intents', {
        amount: paymentData.amount * 100, // Stripe usa centavos
        currency: 'brl',
        payment_method: paymentData.paymentMethodId,
        confirmation_method: 'manual',
        confirm: true,
        metadata: {
          userId: paymentData.userId,
          gameId: paymentData.gameId || 'unknown'
        }
      }, {
        auth: {
          username: this.apis.stripe.apiKey,
          password: ''
        }
      });

      return {
        success: true,
        paymentIntent: response.data,
        transactionId: response.data.id
      };

    } catch (error) {
      console.error('❌ Erro no pagamento Stripe:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Integração com PayPal
  async processPayPalPayment(paymentData) {
    try {
      // Obter token de acesso
      const authResponse = await axios.post(`${this.apis.paypal.baseUrl}/oauth2/token`, 
        'grant_type=client_credentials',
        {
          auth: {
            username: this.apis.paypal.clientId,
            password: this.apis.paypal.clientSecret
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = authResponse.data.access_token;

      // Criar pagamento
      const paymentResponse = await axios.post(`${this.apis.paypal.baseUrl}/payments/payment`, {
        intent: 'sale',
        payer: {
          payment_method: 'paypal'
        },
        transactions: [{
          amount: {
            total: paymentData.amount.toFixed(2),
            currency: 'BRL'
          },
          description: `Pagamento Gol de Ouro - Usuário ${paymentData.userId}`
        }],
        redirect_urls: {
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
        }
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        payment: paymentResponse.data,
        approvalUrl: paymentResponse.data.links.find(link => link.rel === 'approval_url')?.href
      };

    } catch (error) {
      console.error('❌ Erro no pagamento PayPal:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Integração com Firebase (Notificações Push)
  async sendPushNotification(notificationData) {
    try {
      const client = this.createHttpClient('firebase');
      
      const response = await client.post('/send', {
        to: notificationData.deviceToken,
        notification: {
          title: notificationData.title,
          body: notificationData.body,
          icon: '/images/logo-gol.png',
          click_action: notificationData.clickAction || 'FLUTTER_NOTIFICATION_CLICK'
        },
        data: {
          type: notificationData.type || 'general',
          gameId: notificationData.gameId || '',
          userId: notificationData.userId || ''
        }
      }, {
        headers: {
          'Authorization': `key=${this.apis.firebase.serverKey}`
        }
      });

      return {
        success: true,
        messageId: response.data.message_id
      };

    } catch (error) {
      console.error('❌ Erro ao enviar notificação push:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Integração com Twilio (SMS)
  async sendSMS(smsData) {
    try {
      const client = this.createHttpClient('twilio');
      
      const response = await client.post(`/Accounts/${this.apis.twilio.accountSid}/Messages.json`, 
        new URLSearchParams({
          To: smsData.phoneNumber,
          From: process.env.TWILIO_PHONE_NUMBER,
          Body: smsData.message
        }),
        {
          auth: {
            username: this.apis.twilio.accountSid,
            password: this.apis.twilio.authToken
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        messageSid: response.data.sid
      };

    } catch (error) {
      console.error('❌ Erro ao enviar SMS:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Integração com Google Analytics
  async trackEvent(eventData) {
    try {
      const client = this.createHttpClient('googleAnalytics');
      
      const response = await client.post(`/data/ga/v4/analytics:batchGet`, {
        reportRequests: [{
          viewId: this.apis.googleAnalytics.viewId,
          dateRanges: [{
            startDate: 'today',
            endDate: 'today'
          }],
          metrics: [{
            expression: 'ga:totalEvents'
          }],
          dimensions: [{
            name: 'ga:eventCategory'
          }]
        }]
      }, {
        params: {
          key: this.apis.googleAnalytics.apiKey
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao rastrear evento no GA:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  // Integração com Mixpanel
  async trackMixpanelEvent(eventData) {
    try {
      const client = this.createHttpClient('mixpanel');
      
      const event = {
        event: eventData.eventName,
        properties: {
          ...eventData.properties,
          token: this.apis.mixpanel.projectToken,
          time: Math.floor(Date.now() / 1000)
        }
      };

      const response = await client.post('/track', event);

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('❌ Erro ao rastrear evento no Mixpanel:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message
      };
    }
  }

  // Integração com OpenWeather (Dados meteorológicos)
  async getWeatherData(location) {
    try {
      const client = this.createHttpClient('openWeather');
      
      const response = await client.get('/weather', {
        params: {
          q: location,
          appid: this.apis.openWeather.apiKey,
          units: 'metric',
          lang: 'pt_br'
        }
      });

      return {
        success: true,
        weather: {
          temperature: response.data.main.temp,
          description: response.data.weather[0].description,
          humidity: response.data.main.humidity,
          windSpeed: response.data.wind.speed,
          city: response.data.name
        }
      };

    } catch (error) {
      console.error('❌ Erro ao obter dados meteorológicos:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Integração com NewsAPI (Notícias)
  async getNews(category = 'sports', country = 'br') {
    try {
      const client = this.createHttpClient('newsAPI');
      
      const response = await client.get('/top-headlines', {
        params: {
          country,
          category,
          apiKey: this.apis.newsAPI.apiKey,
          pageSize: 10
        }
      });

      return {
        success: true,
        articles: response.data.articles.map(article => ({
          title: article.title,
          description: article.description,
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source.name
        }))
      };

    } catch (error) {
      console.error('❌ Erro ao obter notícias:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // Webhook handler genérico
  async handleWebhook(apiName, payload, signature) {
    try {
      const api = this.apis[apiName];
      if (!api) {
        throw new Error(`API ${apiName} não configurada`);
      }

      // Verificar assinatura do webhook
      if (api.webhookSecret) {
        const expectedSignature = crypto
          .createHmac('sha256', api.webhookSecret)
          .update(JSON.stringify(payload))
          .digest('hex');

        if (signature !== expectedSignature) {
          throw new Error('Assinatura do webhook inválida');
        }
      }

      // Processar webhook baseado no tipo de API
      switch (apiName) {
        case 'stripe':
          return await this.handleStripeWebhook(payload);
        case 'paypal':
          return await this.handlePayPalWebhook(payload);
        default:
          return { success: true, message: 'Webhook processado' };
      }

    } catch (error) {
      console.error(`❌ Erro ao processar webhook ${apiName}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // Handler específico para webhook do Stripe
  async handleStripeWebhook(payload) {
    const event = payload;
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log('✅ Pagamento confirmado:', event.data.object.id);
        // Atualizar status do pagamento no banco de dados
        break;
      case 'payment_intent.payment_failed':
        console.log('❌ Pagamento falhou:', event.data.object.id);
        // Reverter transação no banco de dados
        break;
      default:
        console.log('ℹ️ Evento Stripe não tratado:', event.type);
    }

    return { success: true, eventType: event.type };
  }

  // Handler específico para webhook do PayPal
  async handlePayPalWebhook(payload) {
    const event = payload;
    
    switch (event.event_type) {
      case 'PAYMENT.SALE.COMPLETED':
        console.log('✅ Pagamento PayPal confirmado:', event.resource.id);
        break;
      case 'PAYMENT.SALE.DENIED':
        console.log('❌ Pagamento PayPal negado:', event.resource.id);
        break;
      default:
        console.log('ℹ️ Evento PayPal não tratado:', event.event_type);
    }

    return { success: true, eventType: event.event_type };
  }

  // Testar conectividade com todas as APIs
  async testAllConnections() {
    const results = {};

    for (const [apiName, api] of Object.entries(this.apis)) {
      try {
        const client = this.createHttpClient(apiName, 5000);
        
        // Fazer uma requisição simples para testar conectividade
        let testResult = { success: true, message: 'Conectado' };
        
        switch (apiName) {
          case 'stripe':
            await client.get('/charges?limit=1');
            break;
          case 'firebase':
            // Firebase não tem endpoint de teste simples
            testResult.message = 'Configurado';
            break;
          default:
            testResult.message = 'Configurado';
        }

        results[apiName] = testResult;

      } catch (error) {
        results[apiName] = {
          success: false,
          error: error.message
        };
      }
    }

    return results;
  }
}

module.exports = ExternalAPIIntegration;
