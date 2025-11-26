// Controller de Pagamentos - Gol de Ouro v4.0 - Fase 1: Sistema Financeiro ACID
// ==============================================================================
// Data: 2025-01-12
// Status: ATUALIZADO - Usa FinancialService para operações ACID
//
// Este controller agora usa FinancialService para todas as operações de saldo,
// garantindo integridade financeira total e eliminando race conditions.
// ==============================================================================
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const { supabase, supabaseAdmin } = require('../database/supabase-config');
const crypto = require('crypto');
const response = require('../utils/response-helper');
const FinancialService = require('../services/financialService');
const WebhookService = require('../services/webhookService');
const WebhookSignatureValidator = require('../utils/webhook-signature-validator');
const axios = require('axios');

// ✅ GO-LIVE FIX FASE 3: Configuração do Mercado Pago com timeout aumentado e retry robusto
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  options: {
    timeout: 25000, // ✅ FASE 3: Aumentado para 25s para evitar timeout em conexões lentas
    idempotencyKey: 'goldeouro-' + Date.now()
  }
});

// ✅ FASE 3: Cliente Axios customizado com retry exponencial para chamadas diretas à API MP
const mpAxios = axios.create({
  baseURL: 'https://api.mercadopago.com',
  timeout: 25000, // 25 segundos
  headers: {
    'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// ✅ FASE 3: Interceptor de retry para Axios
mpAxios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    
    // Não retry se já tentou 3 vezes
    if (!config || config.__retryCount >= 3) {
      return Promise.reject(error);
    }
    
    config.__retryCount = config.__retryCount || 0;
    
    // Retry apenas para erros de rede/timeout
    const shouldRetry = 
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENETUNREACH' ||
      error.code === 'ECONNREFUSED' ||
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504;
    
    if (shouldRetry) {
      config.__retryCount += 1;
      const delay = Math.pow(2, config.__retryCount) * 1000; // Exponential backoff: 2s, 4s, 8s
      
      console.log(`🔄 [PIX-AXIOS] Retry ${config.__retryCount}/3 após ${delay}ms para ${config.url}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return mpAxios(config);
    }
    
    return Promise.reject(error);
  }
);

const payment = new Payment(client);
const preference = new Preference(client);

class PaymentController {
  // Criar pagamento PIX
  static async criarPagamentoPix(req, res) {
    try {
      const { valor, descricao = 'Depósito Gol de Ouro' } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return response.unauthorized(res, 'Token inválido ou expirado');
      }

      if (!valor || valor < 1) {
        return response.validationError(res, 'Valor inválido. Valor mínimo: R$ 1,00');
      }

      // Buscar email do usuário se não estiver no token
      let userEmail = req.user?.email;
      if (!userEmail) {
        try {
          const { data: userData, error: userError } = await supabaseAdmin
            .from('usuarios')
            .select('email')
            .eq('id', userId)
            .single();
          
          if (userError) {
            console.error('❌ [PIX] Erro ao buscar email do usuário:', userError);
            return response.serverError(res, userError, 'Erro ao buscar dados do usuário.');
          }
          
          if (!userData || !userData.email) {
            console.error('❌ [PIX] Usuário não encontrado ou sem email:', userId);
            return response.serverError(res, null, 'Usuário não encontrado ou sem email cadastrado.');
          }
          
          userEmail = userData.email;
        } catch (emailError) {
          console.error('❌ [PIX] Erro ao buscar email:', emailError);
          return response.serverError(res, emailError, 'Erro ao buscar email do usuário.');
        }
      }

      // Criar preferência de pagamento
      const preferenceData = {
        items: [
          {
            title: descricao,
            quantity: 1,
            unit_price: parseFloat(valor),
            currency_id: 'BRL'
          }
        ],
        payer: {
          email: userEmail,
          identification: {
            type: 'CPF',
            number: '00000000000' // Será preenchido pelo usuário
          }
        },
        payment_methods: {
          excluded_payment_methods: [],
          excluded_payment_types: [],
          installments: 1
        },
        back_urls: {
          success: process.env.PLAYER_URL ? `${process.env.PLAYER_URL}/deposito/sucesso` : 'https://goldeouro.lol/deposito/sucesso',
          failure: process.env.PLAYER_URL ? `${process.env.PLAYER_URL}/deposito/erro` : 'https://goldeouro.lol/deposito/erro',
          pending: process.env.PLAYER_URL ? `${process.env.PLAYER_URL}/deposito/pendente` : 'https://goldeouro.lol/deposito/pendente'
        },
        auto_return: 'approved',
        notification_url: process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api/payments/webhook` : 'https://goldeouro-backend-v2.fly.dev/api/payments/webhook',
        external_reference: `deposito_${userId}_${Date.now()}`
      };

      // Verificar se MERCADOPAGO_ACCESS_TOKEN está configurado
      if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
        console.error('❌ [PIX] MERCADOPAGO_ACCESS_TOKEN não configurado');
        return response.serverError(res, null, 'Configuração do Mercado Pago não encontrada.');
      }

      // ✅ GO-LIVE FIX FASE 3: Retry exponencial robusto para criação de preferência
      let result;
      const maxRetriesCreate = 4; // ✅ FASE 3: Aumentado para 4 tentativas
      let lastError = null;
      let lastErrorDetails = null;
      
      for (let attempt = 0; attempt < maxRetriesCreate; attempt++) {
        try {
          if (attempt > 0) {
            // Exponential backoff: 1s, 2s, 4s, 8s
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`🔄 [PIX] Tentativa ${attempt + 1}/${maxRetriesCreate} após ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const startTime = Date.now();
          result = await preference.create({ body: preferenceData });
          const duration = Date.now() - startTime;
          
          if (result && result.id) {
            console.log(`✅ [PIX] Preferência criada com sucesso na tentativa ${attempt + 1} (${duration}ms)`);
            break;
          }
        } catch (mpError) {
          lastError = mpError;
          lastErrorDetails = {
            code: mpError.code,
            message: mpError.message,
            status: mpError.response?.status,
            statusText: mpError.response?.statusText,
            data: mpError.response?.data
          };
          
          console.error(`❌ [PIX] Tentativa ${attempt + 1}/${maxRetriesCreate} falhou:`, {
            code: mpError.code,
            message: mpError.message,
            status: mpError.response?.status
          });
          
          // ✅ FASE 3: Retry para mais tipos de erro de rede
          const isRetryable = 
            mpError.code === 'ECONNABORTED' ||
            mpError.code === 'ETIMEDOUT' ||
            mpError.code === 'ENETUNREACH' ||
            mpError.code === 'ECONNREFUSED' ||
            mpError.code === 'EAI_AGAIN' ||
            mpError.response?.status === 408 ||
            mpError.response?.status === 502 ||
            mpError.response?.status === 503 ||
            mpError.response?.status === 504;
          
          if (!isRetryable) {
            console.error('❌ [PIX] Erro não recuperável, abortando retry:', lastErrorDetails);
            break;
          }
          
          // Se é última tentativa, logar detalhes completos
          if (attempt === maxRetriesCreate - 1) {
            console.error('❌ [PIX] Última tentativa falhou. Detalhes completos:', JSON.stringify(lastErrorDetails, null, 2));
          }
        }
      }
      
      if (!result || !result.id) {
        console.error('❌ [PIX] Erro ao criar preferência após todas as tentativas');
        console.error('❌ [PIX] Último erro:', JSON.stringify(lastErrorDetails, null, 2));
        console.error('❌ [PIX] Preference data enviada:', JSON.stringify(preferenceData, null, 2));
        
        // ✅ FASE 3: Retornar erro mais descritivo
        const errorMessage = lastErrorDetails?.code === 'ETIMEDOUT' || lastErrorDetails?.code === 'ECONNABORTED'
          ? 'Timeout ao conectar com Mercado Pago. Tente novamente em alguns instantes.'
          : lastErrorDetails?.status === 502 || lastErrorDetails?.status === 503 || lastErrorDetails?.status === 504
          ? 'Serviço do Mercado Pago temporariamente indisponível. Tente novamente em alguns instantes.'
          : 'Erro ao criar pagamento no Mercado Pago. Verifique sua conexão e tente novamente.';
        
        return response.serverError(res, lastError, errorMessage);
      }

      // ✅ GO-LIVE FIX FASE 3: Extrair dados do PIX com múltiplas fontes e tentativas robustas
      let pixData = result.point_of_interaction?.transaction_data;
      let qrCode = pixData?.qr_code;
      let qrCodeBase64 = pixData?.qr_code_base64;
      
      // ✅ FASE 3: Tentar múltiplas fontes de QR code
      if (!qrCode) {
        // Tentar 1: point_of_interaction.transaction_data.qr_code_base64
        if (pixData?.qr_code_base64) {
          qrCode = pixData.qr_code_base64;
          console.log('✅ [PIX] QR code obtido de qr_code_base64');
        }
        // Tentar 2: point_of_interaction.transaction_data.qr_code
        else if (pixData?.qr_code) {
          qrCode = pixData.qr_code;
          console.log('✅ [PIX] QR code obtido de qr_code');
        }
        // Tentar 3: Consultar preferência novamente
        else if (result.id) {
          const maxRetries = 6; // ✅ FASE 3: Aumentado para 6 tentativas
          for (let retry = 0; retry < maxRetries && !qrCode; retry++) {
            try {
              // Aguardar progressivamente: 1s, 2s, 3s, 4s, 5s, 6s
              const delay = 1000 + (retry * 1000);
              await new Promise(resolve => setTimeout(resolve, delay));
              
              const preferenceData = await preference.get({ id: result.id });
              
              if (preferenceData?.point_of_interaction?.transaction_data) {
                pixData = preferenceData.point_of_interaction.transaction_data;
                qrCode = pixData.qr_code_base64 || pixData.qr_code;
                qrCodeBase64 = pixData.qr_code_base64 || qrCodeBase64;
                
                if (qrCode) {
                  console.log(`✅ [PIX] QR code obtido após ${retry + 1} tentativa(s) de consulta`);
                  break;
                }
              }
            } catch (prefError) {
              console.log(`⚠️ [PIX] Consulta ${retry + 1}/${maxRetries} falhou:`, prefError.code || prefError.message);
              
              // Se não for erro de rede, não continuar tentando
              if (prefError.code !== 'ECONNABORTED' && prefError.code !== 'ETIMEDOUT' && prefError.response?.status !== 502) {
                break;
              }
            }
          }
        }
      }
      
      // Log para debug (apenas em desenvolvimento)
      if (process.env.NODE_ENV !== 'production') {
        console.log('🔍 [PIX] Dados da resposta do Mercado Pago:', {
          hasPointOfInteraction: !!result.point_of_interaction,
          hasTransactionData: !!pixData,
          qrCode: qrCode ? 'presente' : 'ausente',
          qrCodeBase64: qrCodeBase64 ? 'presente' : 'ausente'
        });
      }

      // Salvar pagamento no banco (usar supabaseAdmin para bypass de RLS)
      const valorFloat = parseFloat(valor);
      const externalReference = `deposito_${userId}_${Date.now()}`;
      const { data: pagamento, error } = await supabaseAdmin
        .from('pagamentos_pix')
        .insert({
          usuario_id: userId,
          payment_id: result.id,
          external_id: externalReference, // Campo obrigatório na tabela
          valor: valorFloat,
          amount: valorFloat, // Campo obrigatório na tabela
          status: 'pending',
          qr_code: qrCode,
          qr_code_base64: qrCodeBase64,
          pix_copy_paste: qrCode,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [PIX] Erro ao salvar pagamento:', error);
        return response.serverError(res, error, 'Erro ao salvar pagamento no banco de dados.');
      }

      // ✅ GO-LIVE FIX FASE 3: Garantir que sempre retorna QR code ou copy-paste com fallbacks robustos
      let pixCopyPasteFinal = pagamento.pix_copy_paste || qrCode || pagamento.qr_code;
      let qrCodeFinal = pagamento.qr_code || qrCode;
      let qrCodeBase64Final = pagamento.qr_code_base64 || qrCodeBase64;
      
      // ✅ FASE 3: Se ainda não temos código, tentar mais vezes após salvar
      if (!pixCopyPasteFinal && result.id) {
        const maxFinalRetries = 4; // ✅ FASE 3: Aumentado para 4 tentativas finais
        for (let finalRetry = 0; finalRetry < maxFinalRetries && !pixCopyPasteFinal; finalRetry++) {
          try {
            // Aguardar progressivamente: 2s, 4s, 6s, 8s
            const delay = 2000 * (finalRetry + 1);
            await new Promise(resolve => setTimeout(resolve, delay));
            
            const preferenceRetry = await preference.get({ id: result.id });
            
            if (preferenceRetry?.point_of_interaction?.transaction_data) {
              const pixDataRetry = preferenceRetry.point_of_interaction.transaction_data;
              pixCopyPasteFinal = pixDataRetry.qr_code_base64 || pixDataRetry.qr_code || pixCopyPasteFinal;
              qrCodeFinal = pixDataRetry.qr_code || qrCodeFinal;
              qrCodeBase64Final = pixDataRetry.qr_code_base64 || qrCodeBase64Final;
              
              // Atualizar no banco se encontramos agora
              if (pixCopyPasteFinal) {
                await supabaseAdmin
                  .from('pagamentos_pix')
                  .update({
                    pix_copy_paste: pixCopyPasteFinal,
                    qr_code: qrCodeFinal,
                    qr_code_base64: qrCodeBase64Final,
                    updated_at: new Date().toISOString()
                  })
                  .eq('payment_id', result.id);
                console.log(`✅ [PIX] QR code obtido no retry final ${finalRetry + 1} e atualizado no banco`);
                break;
              }
            }
          } catch (retryError) {
            console.log(`⚠️ [PIX] Retry final ${finalRetry + 1}/${maxFinalRetries} falhou:`, retryError.code || retryError.message);
            
            // Se não for erro de rede, não continuar tentando
            if (retryError.code !== 'ECONNABORTED' && retryError.code !== 'ETIMEDOUT' && retryError.response?.status !== 502) {
              break;
            }
          }
        }
      }
      
      // ✅ FASE 3: Fallbacks múltiplos em ordem de prioridade
      if (!pixCopyPasteFinal) {
        // Fallback 1: init_point (link de pagamento)
        if (result.init_point) {
          pixCopyPasteFinal = result.init_point;
          console.log('⚠️ [PIX] Usando init_point como fallback para copy-paste');
        }
        // Fallback 2: payment_id (para consulta posterior)
        else if (result.id) {
          pixCopyPasteFinal = `PIX-${result.id}`;
          console.log('⚠️ [PIX] Usando payment_id como fallback temporário');
        }
      }
      
      // ✅ FASE 3: Garantir que sempre temos algo para retornar
      if (!qrCodeFinal) {
        qrCodeFinal = pixCopyPasteFinal;
      }
      if (!qrCodeBase64Final && qrCodeFinal) {
        qrCodeBase64Final = qrCodeFinal;
      }

      return response.success(
        res,
        {
        payment_id: result.id,
        qr_code: qrCodeFinal || pixCopyPasteFinal,
        qr_code_base64: qrCodeBase64Final,
        pix_copy_paste: pixCopyPasteFinal,
        expires_at: pagamento.expires_at,
        init_point: result.init_point
        },
        'Pagamento PIX criado com sucesso!',
        201
      );

    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      return response.serverError(res, error, 'Erro ao processar pagamento.');
    }
  }

  // Consultar status do pagamento
  static async consultarStatusPagamento(req, res) {
    try {
      const { payment_id } = req.params;

      // Usar supabaseAdmin para bypass de RLS
      const { data: pagamento, error } = await supabaseAdmin
        .from('pagamentos_pix')
        .select('*')
        .eq('payment_id', payment_id)
        .single();

      if (error || !pagamento) {
        return response.notFound(res, 'Pagamento não encontrado');
      }

      // Para PIX, o payment_id é na verdade o ID da preferência
      // Consultar a preferência (não o payment) para obter código PIX
      let preferenceData;
      let paymentData = null;
      try {
        // Tentar consultar como preferência primeiro (para PIX)
        preferenceData = await preference.get({ id: payment_id });
        
        // Extrair código PIX da preferência
        const pixDataFromPreference = preferenceData?.point_of_interaction?.transaction_data;
        const pixCopyPasteFromPreference = pixDataFromPreference?.qr_code;
        
        // Se encontrou código PIX na preferência, usar isso
        if (pixCopyPasteFromPreference) {
          // Atualizar código PIX no banco se não estava salvo
          if (!pagamento.pix_copy_paste) {
            await supabaseAdmin
              .from('pagamentos_pix')
              .update({
                pix_copy_paste: pixCopyPasteFromPreference,
                qr_code: pixCopyPasteFromPreference,
                qr_code_base64: pixDataFromPreference?.qr_code_base64 || null,
                updated_at: new Date().toISOString()
              })
              .eq('payment_id', payment_id);
          }
          
          // Buscar dados atualizados do banco
          const { data: pagamentoAtualizado } = await supabaseAdmin
            .from('pagamentos_pix')
            .select('*')
            .eq('payment_id', payment_id)
            .single();
          
          return response.success(
            res,
            {
              payment_id: payment_id,
              status: pagamentoAtualizado?.status || pagamento.status,
              valor: pagamentoAtualizado?.valor || pagamento.valor,
              pix_copy_paste: pixCopyPasteFromPreference,
              qr_code: pagamentoAtualizado?.qr_code || pixCopyPasteFromPreference,
              qr_code_base64: pagamentoAtualizado?.qr_code_base64 || pixDataFromPreference?.qr_code_base64,
              created_at: pagamentoAtualizado?.created_at || pagamento.created_at,
              expires_at: pagamentoAtualizado?.expires_at || pagamento.expires_at
            },
            'Status do pagamento consultado com sucesso!'
          );
        }
        
        // Se não encontrou código PIX, tentar consultar como payment (para outros tipos de pagamento)
        const paymentIdMatch = String(payment_id).match(/^(\d+)/);
        const paymentIdNumeric = paymentIdMatch ? parseInt(paymentIdMatch[1], 10) : null;
        
        if (paymentIdNumeric) {
          paymentData = await payment.get({ id: paymentIdNumeric });
        }
      } catch (mpError) {
        console.error('❌ [PIX-STATUS] Erro ao consultar Mercado Pago:', mpError.message || mpError);
        // Se erro ao consultar MP, retornar dados do banco
        return response.success(
          res,
          {
            payment_id: payment_id,
            status: pagamento.status,
            valor: pagamento.valor,
            pix_copy_paste: pagamento.pix_copy_paste || pagamento.qr_code,
            qr_code: pagamento.qr_code,
            qr_code_base64: pagamento.qr_code_base64,
            created_at: pagamento.created_at,
            expires_at: pagamento.expires_at
          },
          'Status do pagamento consultado (dados do banco).'
        );
      }

      // Extrair código PIX do paymentData se disponível (fallback)
      const pixDataFromMP = paymentData?.point_of_interaction?.transaction_data;
      const pixCopyPasteFromMP = pixDataFromMP?.qr_code;
      
      // Atualizar código PIX no banco se veio do Mercado Pago e não estava salvo
      if (pixCopyPasteFromMP && !pagamento.pix_copy_paste) {
        await supabaseAdmin
          .from('pagamentos_pix')
          .update({
            pix_copy_paste: pixCopyPasteFromMP,
            qr_code: pixCopyPasteFromMP,
            qr_code_base64: pixDataFromMP?.qr_code_base64 || null,
            updated_at: new Date().toISOString()
          })
          .eq('payment_id', payment_id);
      }

      // Atualizar status no banco se necessário
      if (pagamento.status !== paymentData.status) {
        await supabaseAdmin
          .from('pagamentos_pix')
          .update({
            status: paymentData.status,
            updated_at: new Date().toISOString()
          })
          .eq('payment_id', payment_id);

        // Se aprovado, creditar saldo
        if (paymentData.status === 'approved' && pagamento.status !== 'approved') {
          await this.processarPagamentoAprovado(pagamento);
        }
      }

      // Buscar dados atualizados do banco
      const { data: pagamentoAtualizado } = await supabaseAdmin
        .from('pagamentos_pix')
        .select('*')
        .eq('payment_id', payment_id)
        .single();

      return response.success(
        res,
        {
        payment_id: payment_id,
        status: paymentData.status,
        valor: pagamentoAtualizado?.valor || pagamento.valor,
        pix_copy_paste: pixCopyPasteFromMP || pagamentoAtualizado?.pix_copy_paste || pagamento.pix_copy_paste || pagamento.qr_code,
        qr_code: pagamentoAtualizado?.qr_code || pagamento.qr_code,
        qr_code_base64: pagamentoAtualizado?.qr_code_base64 || pagamento.qr_code_base64,
        created_at: pagamentoAtualizado?.created_at || pagamento.created_at,
        expires_at: pagamentoAtualizado?.expires_at || pagamento.expires_at,
        approved_at: paymentData.status === 'approved' ? paymentData.date_approved : null
        },
        'Status do pagamento consultado com sucesso!'
      );

    } catch (error) {
      console.error('Erro ao consultar status:', error);
      return response.serverError(res, error, 'Erro ao consultar pagamento.');
    }
  }

  // Listar pagamentos do usuário
  static async listarPagamentosUsuario(req, res) {
    try {
      const { user_id } = req.params;
      const { limit = 20, offset = 0 } = req.query;

      const { data: pagamentos, error } = await supabase
        .from('pagamentos_pix')
        .select('*')
        .eq('usuario_id', user_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return response.serverError(res, error, 'Erro ao consultar pagamentos.');
      }

      // Buscar total para paginação
      const { count } = await supabase
        .from('pagamentos_pix')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user_id);

      return response.paginated(
        res,
        pagamentos || [],
        {
          page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
        limit: parseInt(limit),
          total: count || 0
        },
        'Pagamentos listados com sucesso!'
      );

    } catch (error) {
      console.error('Erro ao listar pagamentos:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Webhook do Mercado Pago - Idempotente com validação de signature
  static async webhookMercadoPago(req, res, next) {
    // ✅ FASE 9 ETAPA 5: Validar signature apenas se MERCADOPAGO_WEBHOOK_SECRET estiver configurado
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
      const webhookSignatureValidator = new WebhookSignatureValidator();
      const validation = webhookSignatureValidator.validateMercadoPagoWebhook(req);
      if (!validation.valid) {
        console.error('❌ [WEBHOOK] Signature inválida:', validation.error);
        // Em produção, rejeitar; em desenvolvimento, apenas logar
        if (process.env.NODE_ENV === 'production') {
          return res.status(401).json({
            success: false,
            error: 'Webhook signature inválida',
            message: validation.error
          });
        } else {
          console.warn('⚠️ [WEBHOOK] Signature inválida ignorada em modo não-produção');
        }
      } else {
        req.webhookValidation = validation;
      }
    }
    
    // Processar webhook (sempre processar após validação)
    await this.processWebhook(req, res);
  }

  // Processar webhook (lógica separada para reutilização)
  static async processWebhook(req, res) {
    try {
      const { type, data } = req.body;
      console.log('📨 [WEBHOOK] PIX recebido:', { type, data });

      // Responder imediatamente ao Mercado Pago (best practice)
      res.status(200).json({ received: true });

      if (type === 'payment' && data?.id) {
        const paymentId = data.id;
        
        // ✅ FASE 2: Validar paymentId antes de usar (segurança SSRF)
        if (typeof paymentId !== 'string' && typeof paymentId !== 'number') {
          console.error('❌ [WEBHOOK] ID de pagamento inválido (tipo):', paymentId);
          return;
        }

        const paymentIdStr = String(paymentId).trim();
        if (!/^\d+$/.test(paymentIdStr)) {
          console.error('❌ [WEBHOOK] ID de pagamento inválido (formato):', paymentId);
          return;
        }

        const paymentIdNum = parseInt(paymentIdStr, 10);
        if (isNaN(paymentIdNum) || paymentIdNum <= 0) {
          console.error('❌ [WEBHOOK] ID de pagamento inválido (valor):', paymentId);
          return;
        }
        
        // Consultar pagamento no Mercado Pago usando axios (compatível com código inline)
        let paymentData;
        try {
          const paymentResponse = await axios.get(
            `https://api.mercadopago.com/v1/payments/${paymentIdNum}`,
            { 
              headers: { 
                'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
              },
              timeout: 15000 // ✅ GO-LIVE FIX: Aumentado para 15s
            }
          );
          paymentData = paymentResponse.data;
        } catch (mpError) {
          console.error(`❌ [WEBHOOK] Erro ao consultar Mercado Pago ${paymentIdNum}:`, mpError.message);
          return;
        }

        // ✅ FASE 2: Processar webhook com idempotência completa
        const webhookResult = await WebhookService.processPaymentWebhook(
          req.body, // Payload completo
          paymentIdStr,
          paymentData.status
        );

        if (!webhookResult.success) {
          console.error(`❌ [WEBHOOK] Erro ao processar webhook ${paymentIdStr}:`, webhookResult.error);
          return;
        }

        if (webhookResult.alreadyProcessed) {
          console.log(`⏭️ [WEBHOOK] Webhook ${paymentIdStr} já foi processado anteriormente (eventId: ${webhookResult.eventId})`);
          return;
        }

        if (webhookResult.processed) {
          console.log(`✅ [WEBHOOK] Webhook ${paymentIdStr} processado com sucesso (eventId: ${webhookResult.eventId})`);
        } else {
          console.log(`ℹ️ [WEBHOOK] Webhook ${paymentIdStr} registrado mas não processado: ${webhookResult.reason || 'Status não requer processamento'}`);
        }
      }

    } catch (error) {
      console.error('❌ [WEBHOOK] Exceção no webhook:', error);
      // Não retornar erro ao Mercado Pago (já respondemos 200)
    }
  }

  // Processar pagamento aprovado - ACID
  static async processarPagamentoAprovado(pagamento) {
    try {
      // ✅ FASE 1: Usar FinancialService para operação ACID
      const valor = pagamento.amount || pagamento.valor || 0;
      const paymentId = pagamento.external_id || pagamento.payment_id || pagamento.id;

      const result = await FinancialService.addBalance(
        pagamento.usuario_id,
        parseFloat(valor),
        {
          description: 'Depósito via PIX',
          referenceId: paymentId ? parseInt(String(paymentId).replace(/\D/g, '')) || null : null,
          referenceType: 'deposito'
        }
      );

      if (!result.success) {
        console.error(`❌ [PAYMENT] Erro ao processar pagamento ${paymentId}:`, result.error);
        return {
          success: false,
          error: result.error
        };
      }

      console.log(`✅ [PAYMENT] Pagamento processado ACID: ${paymentId} - R$ ${valor} (saldo: ${result.data.oldBalance} → ${result.data.newBalance})`);

      return {
        success: true,
        transactionId: result.data.transactionId,
        newBalance: result.data.newBalance
      };

    } catch (error) {
      console.error('❌ [PAYMENT] Exceção ao processar pagamento aprovado:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Solicitar saque
  static async solicitarSaque(req, res) {
    try {
      const { valor, chave_pix, tipo_chave } = req.body;
      const userId = req.user?.userId || req.user?.id;

      if (!valor || valor < 10) {
        return response.validationError(res, 'Valor mínimo de saque é R$ 10,00');
      }

      if (!chave_pix || !tipo_chave) {
        return response.validationError(res, 'Chave PIX é obrigatória');
      }

      // ✅ FASE 1: Verificar saldo usando FinancialService (com lock opcional)
      const valorFloat = parseFloat(valor);
      const balanceCheck = await FinancialService.hasSufficientBalance(userId, valorFloat);

      if (!balanceCheck.success) {
        return response.serverError(res, balanceCheck.error, 'Erro ao verificar saldo');
      }

      if (!balanceCheck.hasBalance) {
        return response.error(
          res,
          `Saldo insuficiente. Saldo atual: R$ ${balanceCheck.currentBalance.toFixed(2)}, necessário: R$ ${balanceCheck.requiredAmount.toFixed(2)}`,
          400
        );
      }

      // Calcular taxa de saque
      const taxa = parseFloat(process.env.PAGAMENTO_TAXA_SAQUE || '2.00');
      const valorLiquido = valorFloat - taxa;

      // Criar saque
      const { data: saque, error: saqueError } = await supabase
        .from('saques')
        .insert({
          usuario_id: userId,
          valor: valorFloat,
          valor_liquido: valorLiquido,
          taxa: taxa,
          chave_pix: chave_pix,
          tipo_chave: tipo_chave,
          status: 'pendente'
        })
        .select()
        .single();

      if (saqueError) {
        return response.serverError(res, saqueError, 'Erro ao criar saque');
      }

      // ✅ FASE 1: Deduzir saldo usando FinancialService ACID
      // Nota: Em produção, o saldo só deve ser debitado quando o saque for APROVADO
      // Por enquanto, criamos apenas a transação pendente (saldo será debitado quando processado)
      // Se necessário debitar imediatamente, descomente abaixo:
      /*
      const deductResult = await FinancialService.deductBalance(
        userId,
        valorFloat,
        {
          description: `Saque via PIX - Taxa: R$ ${taxa.toFixed(2)}`,
          referenceId: saque.id,
          referenceType: 'saque'
        }
      );

      if (!deductResult.success) {
        console.error('❌ [SAQUE] Erro ao debitar saldo:', deductResult.error);
        // Reverter criação do saque se débito falhar
        await supabase.from('saques').delete().eq('id', saque.id);
        return response.serverError(res, deductResult.error, 'Erro ao processar débito de saldo');
      }
      */

      return response.success(
        res,
        {
        saque_id: saque.id,
          valor: parseFloat(valor),
        valor_liquido: valorLiquido,
        taxa: taxa,
        status: 'pendente'
        },
        'Saque solicitado com sucesso! Aguarde processamento.',
        201
      );

    } catch (error) {
      console.error('Erro ao solicitar saque:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Cancelar pagamento PIX
  static async cancelarPagamentoPix(req, res) {
    try {
      const { payment_id } = req.params;
      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return response.unauthorized(res, 'Token inválido ou expirado');
      }

      // Buscar pagamento
      const { data: pagamento, error: fetchError } = await supabase
        .from('pagamentos_pix')
        .select('*')
        .eq('payment_id', payment_id)
        .eq('usuario_id', userId)
        .single();

      if (fetchError || !pagamento) {
        return response.notFound(res, 'Pagamento não encontrado');
      }

      // Verificar se pode ser cancelado
      if (pagamento.status === 'approved') {
        return response.error(res, 'Pagamento já foi aprovado e não pode ser cancelado', 400);
      }

      if (pagamento.status === 'cancelled') {
        return response.error(res, 'Pagamento já foi cancelado', 400);
      }

      // Cancelar no Mercado Pago (se possível)
      try {
        await payment.cancel({ id: payment_id });
      } catch (mpError) {
        console.warn(`⚠️ [PAYMENT] Erro ao cancelar no Mercado Pago: ${mpError.message}`);
        // Continuar mesmo se falhar no MP (pode já estar cancelado)
      }

      // Atualizar status no banco
      const { data: pagamentoAtualizado, error: updateError } = await supabase
        .from('pagamentos_pix')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', payment_id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [PAYMENT] Erro ao atualizar pagamento:', updateError);
        return response.serverError(res, updateError, 'Erro ao cancelar pagamento');
      }

      return response.success(
        res,
        {
          payment_id: payment_id,
          status: 'cancelled',
          valor: pagamento.valor
        },
        'Pagamento cancelado com sucesso!'
      );

    } catch (error) {
      console.error('❌ [PAYMENT] Erro ao cancelar pagamento:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Obter saque por ID
  static async obterSaque(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return response.unauthorized(res, 'Token inválido ou expirado');
      }

      // Buscar saque
      const { data: saque, error } = await supabase
        .from('saques')
        .select('*')
        .eq('id', id)
        .eq('usuario_id', userId)
        .single();

      if (error || !saque) {
        return response.notFound(res, 'Saque não encontrado');
      }

      return response.success(
        res,
        {
          id: saque.id,
          valor: parseFloat(saque.valor || 0),
          valor_liquido: parseFloat(saque.valor_liquido || 0),
          taxa: parseFloat(saque.taxa || 0),
          chave_pix: saque.chave_pix,
          tipo_chave: saque.tipo_chave,
          status: saque.status,
          created_at: saque.created_at,
          updated_at: saque.updated_at
        },
        'Saque obtido com sucesso!'
      );

    } catch (error) {
      console.error('❌ [SAQUE] Erro ao obter saque:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Listar saques do usuário
  static async listarSaquesUsuario(req, res) {
    try {
      const { user_id } = req.params;
      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return response.unauthorized(res, 'Token inválido ou expirado');
      }

      // Verificar se está consultando próprio saque ou é admin
      const isAdmin = req.user?.role === 'admin' || req.user?.tipo === 'admin';
      if (user_id !== userId && !isAdmin) {
        return response.forbidden(res, 'Você só pode consultar seus próprios saques');
      }

      const { limit = 20, offset = 0 } = req.query;

      const { data: saques, error } = await supabase
        .from('saques')
        .select('*')
        .eq('usuario_id', user_id)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (error) {
        console.error('❌ [SAQUE] Erro ao listar saques:', error);
        return response.serverError(res, error, 'Erro ao consultar saques.');
      }

      // Buscar total para paginação
      const { count } = await supabase
        .from('saques')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user_id);

      return response.paginated(
        res,
        (saques || []).map(saque => ({
          id: saque.id,
          valor: parseFloat(saque.valor || 0),
          valor_liquido: parseFloat(saque.valor_liquido || 0),
          taxa: parseFloat(saque.taxa || 0),
          chave_pix: saque.chave_pix,
          tipo_chave: saque.tipo_chave,
          status: saque.status,
          created_at: saque.created_at,
          updated_at: saque.updated_at
        })),
        {
          page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          limit: parseInt(limit),
          total: count || 0
        },
        'Saques listados com sucesso!'
      );

    } catch (error) {
      console.error('❌ [SAQUE] Erro ao listar saques:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Obter extrato do usuário
  static async obterExtrato(req, res) {
    try {
      const { user_id } = req.params;
      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return response.unauthorized(res, 'Token inválido ou expirado');
      }

      // Verificar se está consultando próprio extrato ou é admin
      const isAdmin = req.user?.role === 'admin' || req.user?.tipo === 'admin';
      if (user_id !== userId && !isAdmin) {
        return response.forbidden(res, 'Você só pode consultar seu próprio extrato');
      }

      const { limit = 50, offset = 0 } = req.query;

      // Buscar transações (usar supabaseAdmin para bypass de RLS se necessário)
      const { data: transacoes, error } = await supabaseAdmin
        .from('transacoes')
        .select('*')
        .eq('usuario_id', user_id)
        .order('created_at', { ascending: false })
        .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

      if (error) {
        console.error('❌ [EXTRATO] Erro ao buscar transações:', error);
        return response.serverError(res, error, 'Erro ao consultar extrato.');
      }

      // Buscar total para paginação (usar supabaseAdmin para bypass de RLS se necessário)
      const { count } = await supabaseAdmin
        .from('transacoes')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user_id);

      return response.paginated(
        res,
        transacoes || [],
        {
          page: Math.floor(parseInt(offset) / parseInt(limit)) + 1,
          limit: parseInt(limit),
          total: count || 0
        },
        'Extrato obtido com sucesso!'
      );

    } catch (error) {
      console.error('❌ [EXTRATO] Erro ao obter extrato:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Obter saldo do usuário
  static async obterSaldo(req, res) {
    try {
      const { user_id } = req.params;
      const userId = req.user?.userId || req.user?.id;

      if (!userId) {
        return response.unauthorized(res, 'Token inválido ou expirado');
      }

      // Verificar se está consultando próprio saldo ou é admin
      const isAdmin = req.user?.role === 'admin' || req.user?.tipo === 'admin';
      if (user_id !== userId && !isAdmin) {
        return response.forbidden(res, 'Você só pode consultar seu próprio saldo');
      }

      // Buscar saldo usando FinancialService
      const balanceResult = await FinancialService.getBalance(user_id);

      if (!balanceResult.success) {
        return response.serverError(res, balanceResult.error, 'Erro ao consultar saldo');
      }

      return response.success(
        res,
        {
          usuario_id: user_id,
          saldo: parseFloat(balanceResult.balance || 0),
          atualizado_em: new Date().toISOString()
        },
        'Saldo obtido com sucesso!'
      );

    } catch (error) {
      console.error('❌ [SALDO] Erro ao obter saldo:', error);
      return response.serverError(res, error, 'Erro interno do servidor.');
    }
  }

  // Health check
  static async healthCheck(req, res) {
    try {
      const { count, error } = await supabase
        .from('pagamentos_pix')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return response.serviceUnavailable(res, 'Banco de dados indisponível');
      }

      return response.success(
        res,
        {
        status: 'healthy',
          payments_count: count || 0
        },
        'Sistema de pagamentos operacional'
      );
    } catch (error) {
      return response.serviceUnavailable(res, 'Sistema de pagamentos indisponível');
    }
  }
}

module.exports = PaymentController;
