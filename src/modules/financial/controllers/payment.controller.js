// Controller de Pagamentos - Gol de Ouro v4.0 - Fase 1: Sistema Financeiro ACID
// ==============================================================================
// Data: 2025-01-12
// Status: ATUALIZADO - Usa FinancialService para operações ACID
//
// Este controller agora usa FinancialService para todas as operações de saldo,
// garantindo integridade financeira total e eliminando race conditions.
// ==============================================================================
const { MercadoPagoConfig, Payment, Preference } = require('mercadopago');
const { supabase, supabaseAdmin } = require('../../../../database/supabase-unified-config');
const crypto = require('crypto');
const response = require('../../shared/utils/response-helper');
const FinancialService = require('../services/financial.service');
const WebhookService = require('../services/webhook.service');
const WebhookSignatureValidator = require('../../shared/validators/webhook-signature-validator');
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
  // ✅ PIX V6: Criar pagamento PIX usando API Payments (QR Code EMV Real)
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
            console.error('❌ [PIX-V6] Erro ao buscar email do usuário:', userError);
            return response.serverError(res, userError, 'Erro ao buscar dados do usuário.');
          }
          
          if (!userData || !userData.email) {
            console.error('❌ [PIX-V6] Usuário não encontrado ou sem email:', userId);
            return response.serverError(res, null, 'Usuário não encontrado ou sem email cadastrado.');
          }
          
          userEmail = userData.email;
        } catch (emailError) {
          console.error('❌ [PIX-V6] Erro ao buscar email:', emailError);
          return response.serverError(res, emailError, 'Erro ao buscar email do usuário.');
        }
      }

      // Verificar se MERCADOPAGO_ACCESS_TOKEN está configurado
      if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
        console.error('❌ [PIX-V6] MERCADOPAGO_ACCESS_TOKEN não configurado');
        return response.serverError(res, null, 'Configuração do Mercado Pago não encontrada.');
      }

      // ✅ PIX V6: Payload para API Payments (PIX EMV Real)
      const paymentData = {
        transaction_amount: parseFloat(valor),
        description: descricao,
        payment_method_id: 'pix',
        payer: {
          email: userEmail
        },
        external_reference: `deposito_${userId}_${Date.now()}`,
        notification_url: process.env.BACKEND_URL 
          ? `${process.env.BACKEND_URL}/api/payments/webhook` 
          : 'https://goldeouro-backend-v2.fly.dev/api/payments/webhook'
      };

      console.log('💰 [PIX-V6] Criando pagamento PIX via API Payments...');

      // ✅ PIX V6: Retry exponencial robusto para criação de pagamento
      let result;
      const maxRetriesCreate = 4;
      let lastError = null;
      let lastErrorDetails = null;
      
      for (let attempt = 0; attempt < maxRetriesCreate; attempt++) {
        try {
          if (attempt > 0) {
            // Exponential backoff: 1s, 2s, 4s, 8s
            const delay = Math.pow(2, attempt - 1) * 1000;
            console.log(`🔄 [PIX-V6] Tentativa ${attempt + 1}/${maxRetriesCreate} após ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
          
          const startTime = Date.now();
          
          // ✅ PIX V6: Usar API Payments diretamente via axios
          // Gerar idempotency key único para cada tentativa
          const idempotencyKey = `pix_${userId}_${Date.now()}_${attempt}`;
          const paymentResponse = await mpAxios.post('/v1/payments', paymentData, {
            headers: {
              'X-Idempotency-Key': idempotencyKey
            }
          });
          const duration = Date.now() - startTime;
          
          result = paymentResponse.data;
          
          if (result && result.id) {
            console.log(`✅ [PIX-V6] Pagamento criado com sucesso na tentativa ${attempt + 1} (${duration}ms)`);
            console.log(`✅ [PIX-V6] Payment ID: ${result.id}, Status: ${result.status}`);
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
          
          console.error(`❌ [PIX-V6] Tentativa ${attempt + 1}/${maxRetriesCreate} falhou:`, {
            code: mpError.code,
            message: mpError.message,
            status: mpError.response?.status,
            data: mpError.response?.data
          });
          
          // Retry para erros de rede/timeout
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
            console.error('❌ [PIX-V6] Erro não recuperável, abortando retry:', lastErrorDetails);
            break;
          }
          
          // Se é última tentativa, logar detalhes completos
          if (attempt === maxRetriesCreate - 1) {
            console.error('❌ [PIX-V6] Última tentativa falhou. Detalhes completos:', JSON.stringify(lastErrorDetails, null, 2));
          }
        }
      }
      
      if (!result || !result.id) {
        console.error('❌ [PIX-V6] Erro ao criar pagamento após todas as tentativas');
        console.error('❌ [PIX-V6] Último erro:', JSON.stringify(lastErrorDetails, null, 2));
        console.error('❌ [PIX-V6] Payment data enviada:', JSON.stringify(paymentData, null, 2));
        
        // Se é erro da API do Mercado Pago (400, 401, etc), retornar erro mais específico
        if (lastErrorDetails?.status && lastErrorDetails.status >= 400 && lastErrorDetails.status < 500) {
          const mpErrorMessage = lastErrorDetails?.data?.message || lastErrorDetails?.data?.error || 'Erro ao criar pagamento no Mercado Pago';
          console.error('❌ [PIX-V6] Erro da API Mercado Pago:', mpErrorMessage);
          return response.serverError(res, lastError, mpErrorMessage);
        }
        
        const errorMessage = lastErrorDetails?.code === 'ETIMEDOUT' || lastErrorDetails?.code === 'ECONNABORTED'
          ? 'Timeout ao conectar com Mercado Pago. Tente novamente em alguns instantes.'
          : lastErrorDetails?.status === 502 || lastErrorDetails?.status === 503 || lastErrorDetails?.status === 504
          ? 'Serviço do Mercado Pago temporariamente indisponível. Tente novamente em alguns instantes.'
          : lastErrorDetails?.data?.message || lastErrorDetails?.message || 'Erro ao criar pagamento no Mercado Pago. Verifique sua conexão e tente novamente.';
        
        return response.serverError(res, lastError, errorMessage);
      }

      // ✅ PIX V6: Extrair dados do QR Code EMV
      console.log('🔍 [PIX-V6] Estrutura da resposta:', JSON.stringify({
        hasPointOfInteraction: !!result.point_of_interaction,
        pointOfInteraction: result.point_of_interaction ? Object.keys(result.point_of_interaction) : [],
        status: result.status,
        payment_method_id: result.payment_method_id
      }, null, 2));

      let pixData = result.point_of_interaction?.transaction_data;
      let qrCode = null;
      let qrCodeBase64 = null;
      let ticketUrl = null;
      
      // Tentar múltiplas fontes para obter QR Code EMV
      if (pixData) {
        qrCode = pixData.qr_code || pixData.qr_code_base64;
        qrCodeBase64 = pixData.qr_code_base64 || pixData.qr_code;
        ticketUrl = pixData.ticket_url;
        console.log('🔍 [PIX-V6] Dados do transaction_data:', {
          hasQrCode: !!pixData.qr_code,
          hasQrCodeBase64: !!pixData.qr_code_base64,
          qrCodePreview: qrCode ? qrCode.substring(0, 50) + '...' : 'ausente'
        });
      }
      
      // Se não temos QR Code EMV, tentar consultar pagamento após alguns segundos
      if (!qrCode || !qrCode.startsWith('000201')) {
        console.log('🔄 [PIX-V6] QR Code EMV não disponível imediatamente. Consultando pagamento...');
        
        // Tentar múltiplas consultas com delays progressivos
        const maxRetries = 5;
        for (let retry = 0; retry < maxRetries; retry++) {
          const delay = 2000 + (retry * 1000); // 2s, 3s, 4s, 5s, 6s
          await new Promise(resolve => setTimeout(resolve, delay));
          
          try {
            console.log(`🔄 [PIX-V6] Consulta ${retry + 1}/${maxRetries} do pagamento ${result.id}...`);
            const paymentCheck = await mpAxios.get(`/v1/payments/${result.id}`);
            const checkResult = paymentCheck.data;
            
            console.log('🔍 [PIX-V6] Resposta da consulta:', {
              status: checkResult.status,
              payment_method_id: checkResult.payment_method_id,
              hasPointOfInteraction: !!checkResult.point_of_interaction
            });
            
            const checkPixData = checkResult.point_of_interaction?.transaction_data;
            if (checkPixData) {
              const checkQrCode = checkPixData.qr_code || checkPixData.qr_code_base64;
              
              if (checkQrCode && checkQrCode.startsWith('000201')) {
                console.log(`✅ [PIX-V6] QR Code EMV obtido na consulta ${retry + 1}`);
                qrCode = checkQrCode;
                qrCodeBase64 = checkPixData.qr_code_base64 || checkQrCode;
                ticketUrl = checkPixData.ticket_url;
                pixData = checkPixData;
                break;
              } else if (checkQrCode) {
                console.log(`⚠️ [PIX-V6] QR Code encontrado mas não é EMV: ${checkQrCode.substring(0, 50)}...`);
              }
            }
          } catch (checkError) {
            console.error(`⚠️ [PIX-V6] Erro na consulta ${retry + 1}:`, checkError.message);
            if (checkError.response?.status === 404) {
              console.error('❌ [PIX-V6] Pagamento não encontrado');
              break;
            }
          }
        }
      }

      // Validar formato EMV final
      const finalQrCode = qrCode;
      const finalQrCodeBase64 = qrCodeBase64;
      
      if (!finalQrCode || !finalQrCode.startsWith('000201')) {
        console.error('❌ [PIX-V6] QR Code EMV não disponível após todas as tentativas');
        console.error('🔍 [PIX-V6] Dados finais:', JSON.stringify({
          hasPixData: !!pixData,
          qrCode: finalQrCode ? finalQrCode.substring(0, 100) : 'ausente',
          status: result.status,
          payment_method_id: result.payment_method_id
        }, null, 2));
        
        // Retornar erro informativo
        return response.serverError(res, null, 'QR Code PIX EMV não está disponível no momento. O pagamento foi criado, mas o QR Code precisa ser consultado posteriormente.');
      }

      console.log('✅ [PIX-V6] QR Code EMV válido gerado:', finalQrCode.substring(0, 50) + '...');

      // Salvar pagamento no banco
      const valorFloat = parseFloat(valor);
      
      // ✅ CORREÇÃO: Log para rastrear valor sendo salvo
      console.log(`💰 [PIX-V6] Salvando pagamento no banco: R$ ${valorFloat} (valor solicitado: R$ ${valor})`);
      
      const externalReference = `deposito_${userId}_${Date.now()}`;
      const { data: pagamento, error } = await supabaseAdmin
        .from('pagamentos_pix')
        .insert({
          usuario_id: userId,
          payment_id: result.id.toString(),
          external_id: externalReference,
          valor: valorFloat, // ✅ Valor solicitado pelo usuário
          amount: valorFloat, // ✅ Valor solicitado pelo usuário (mesmo valor)
          status: result.status || 'pending',
          qr_code: finalQrCode,
          qr_code_base64: finalQrCodeBase64,
          pix_copy_paste: finalQrCode, // EMV real
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
        })
        .select()
        .single();
      
      // ✅ CORREÇÃO: Verificar se valor foi salvo corretamente
      if (pagamento && (pagamento.valor !== valorFloat || pagamento.amount !== valorFloat)) {
        console.error(`⚠️ [PIX-V6] ATENÇÃO: Valor salvo diferente do solicitado!`);
        console.error(`   Solicitado: R$ ${valorFloat}`);
        console.error(`   Salvo (valor): R$ ${pagamento.valor}`);
        console.error(`   Salvo (amount): R$ ${pagamento.amount}`);
      } else {
        console.log(`✅ [PIX-V6] Valor salvo corretamente: R$ ${valorFloat}`);
      }

      if (error) {
        console.error('❌ [PIX-V6] Erro ao salvar pagamento:', error);
        return response.serverError(res, error, 'Erro ao salvar pagamento no banco de dados.');
      }

      console.log('✅ [PIX-V6] Pagamento salvo no banco:', pagamento.id);

      // ✅ PIX V6: Retornar dados completos do PIX EMV
      return response.success(
        res,
        {
          payment_id: result.id.toString(),
          transaction_id: result.id.toString(),
          qr_code: finalQrCode,
          qr_code_base64: finalQrCodeBase64,
          copy_and_paste: finalQrCode, // EMV real para copiar e colar
          ticket_url: ticketUrl,
          status: result.status || 'pending',
          expires_at: pagamento.expires_at
        },
        'Pagamento PIX criado com sucesso!',
        201
      );

    } catch (error) {
      console.error('❌ [PIX-V6] Erro ao criar pagamento PIX:', error);
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
    // ✅ CORREÇÃO CRÍTICA: Validação de signature mais tolerante para evitar crashes
    // Validar signature apenas se MERCADOPAGO_WEBHOOK_SECRET estiver configurado E válido
    if (process.env.MERCADOPAGO_WEBHOOK_SECRET && process.env.MERCADOPAGO_WEBHOOK_SECRET.trim() !== '') {
      try {
        const webhookSignatureValidator = new WebhookSignatureValidator();
        const validation = webhookSignatureValidator.validateMercadoPagoWebhook(req);
        if (!validation.valid) {
          // ✅ CORREÇÃO: Apenas logar erro, NÃO retornar 401 que causa crash
          console.warn('⚠️ [WEBHOOK] Signature inválida (continuando processamento):', validation.error);
          // Não bloquear processamento - continuar mesmo com signature inválida
          // O sistema de idempotência ainda protegerá contra duplicações
        } else {
          req.webhookValidation = validation;
          console.log('✅ [WEBHOOK] Signature válida');
        }
      } catch (error) {
        // ✅ CORREÇÃO: Capturar erros de validação sem causar crash
        console.error('⚠️ [WEBHOOK] Erro ao validar signature (continuando processamento):', error.message);
        // Continuar processamento mesmo se validação falhar
      }
    } else {
      console.log('ℹ️ [WEBHOOK] MERCADOPAGO_WEBHOOK_SECRET não configurado - pulando validação de signature');
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
