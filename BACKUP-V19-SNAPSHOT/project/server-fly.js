// SERVIDOR SIMPLIFICADO - GOL DE OURO v1.2.0 - DEPLOY FUNCIONAL
// ==============================================================
// Data: 21/10/2025
// Status: SERVIDOR SIMPLIFICADO PARA DEPLOY
// Versão: v1.2.0-deploy-functional
// GPT-4o Auto-Fix: Backend funcional para deploy

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const http = require('http');
const crypto = require('crypto'); // ✅ Adicionado para geração segura de números aleatórios
// Logger opcional - fallback para console se não disponível
let logger;
try {
  logger = require('./logging/sistema-logs-avancado').logger;
} catch (error) {
  // Fallback simples para console se logger não disponível
  logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
    debug: (...args) => console.log('[DEBUG]', ...args)
  };
}
const { body, validationResult } = require('express-validator');
const { calculateInitialBalance, validateRealData, isProductionMode } = require('./config/system-config');

// Importar validadores
const PixValidator = require('./utils/pix-validator');
const LoteIntegrityValidator = require('./utils/lote-integrity-validator');
const WebhookSignatureValidator = require('./utils/webhook-signature-validator');

require('dotenv').config();

// Validação das variáveis de ambiente obrigatórias
const { assertRequiredEnv, isProduction } = require('./config/required-env');
assertRequiredEnv(
  ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  { onlyInProduction: ['MERCADOPAGO_ACCESS_TOKEN'] }
);

const app = express();
const PORT = process.env.PORT || 8080;

// =====================================================
// INSTÂNCIAS DOS VALIDADORES
// =====================================================

const pixValidator = new PixValidator();
const loteIntegrityValidator = new LoteIntegrityValidator();
const webhookSignatureValidator = new WebhookSignatureValidator();

// =====================================================
// CONFIGURAÇÃO SUPABASE UNIFICADA
// =====================================================

const { 
  supabaseAdmin, 
  validateSupabaseCredentials, 
  testSupabaseConnection, 
  supabaseHealthCheck 
} = require('./database/supabase-unified-config');

// Importar serviço de email
const emailService = require('./services/emailService');
// ✅ FASE 1: Importar FinancialService para operações ACID
const FinancialService = require('./services/financialService');
// ✅ FASE 2: Importar WebhookService para idempotência completa
const WebhookService = require('./services/webhookService');
// ✅ PERSISTÊNCIA DE LOTES: Importar LoteService para persistir lotes no banco
const LoteService = require('./services/loteService');
// ✅ FASE 5: Importar RewardService para sistema de recompensas ACID
const RewardService = require('./services/rewardService');
// WebSocket Manager (inicializado após criar o servidor HTTP)
const WebSocketManager = require('./src/websocket');

// =====================================================
// IMPORTAÇÃO DE ROTAS ORGANIZADAS
// =====================================================
// ✅ FASE 9: Refatoração controlada - Usar arquivos de rotas dedicados
const authRoutes = require('./routes/authRoutes');
const gameRoutes = require('./routes/gameRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const withdrawRoutes = require('./routes/withdrawRoutes');
const systemRoutes = require('./routes/systemRoutes');

// =====================================================
// SISTEMAS DE MONITORAMENTO AVANÇADOS
// =====================================================

// Sistema de monitoramento desabilitado temporariamente para estabilidade
// TODO: Re-habilitar após backend estável
/*
const {
  startCustomMetricsCollection,
  stopCustomMetricsCollection,
  getCustomMetricsStats,
  generateCustomMetricsReport,
  testCustomMetrics
} = require('./monitoring/flyio-custom-metrics');

const {
  startNotificationSystem,
  stopNotificationSystem,
  sendNotification,
  getNotificationStats,
  generateNotificationReport,
  testNotifications
} = require('./monitoring/flyio-advanced-notifications');

const {
  startConfigBackupSystem,
  stopConfigBackupSystem,
  executeManualBackup,
  getBackupStats,
  generateBackupReport,
  testConfigBackup
} = require('./monitoring/flyio-config-backup');
*/

let supabase = supabaseAdmin;
let dbConnected = false;

// Conectar Supabase com validação
async function connectSupabase() {
  try {
    console.log('🔍 [SUPABASE] Validando credenciais...');
    
    // Validar credenciais
    const validation = validateSupabaseCredentials();
    if (!validation.valid) {
      console.error('❌ [SUPABASE] Credenciais inválidas:', validation.errors);
      dbConnected = false;
      return false;
    }
    
    console.log('✅ [SUPABASE] Credenciais validadas');
    
    // Testar conexão
    const connectionTest = await testSupabaseConnection();
    if (!connectionTest.success) {
      console.error('❌ [SUPABASE] Falha na conexão:', connectionTest.error);
      dbConnected = false;
      return false;
    }
    
    console.log('✅ [SUPABASE] Conectado com sucesso');
    dbConnected = true;
    
    // ✅ PERSISTÊNCIA DE LOTES: Sincronizar lotes ativos do banco ao iniciar
    await syncLotesFromDatabase();
    
    return true;
    
  } catch (error) {
    console.log('❌ [SUPABASE] Erro na conexão:', error.message);
    dbConnected = false;
    return false;
  }
}

// ✅ PERSISTÊNCIA DE LOTES: Sincronizar lotes ativos do banco ao iniciar servidor
async function syncLotesFromDatabase() {
  try {
    console.log('🔄 [LOTES] Sincronizando lotes do banco de dados...');
    const result = await LoteService.syncActiveLotes();
    
    if (result.success && result.count > 0) {
      console.log(`✅ [LOTES] ${result.count} lotes ativos encontrados no banco`);
      
      // Recriar lotes em memória
      for (const loteData of result.lotes) {
        const config = batchConfigs[loteData.valor_aposta];
        if (config) {
          const lote = {
            id: loteData.id,
            valor: loteData.valor_aposta,
            ativo: loteData.status === 'ativo',
            valorAposta: loteData.valor_aposta,
            config: config,
            chutes: [], // Será reconstruído conforme necessário (ou pode buscar do banco)
            status: loteData.status === 'ativo' ? 'active' : 'completed',
            winnerIndex: loteData.indice_vencedor,
            createdAt: loteData.created_at,
            totalArrecadado: parseFloat(loteData.total_arrecadado || 0),
            premioTotal: parseFloat(loteData.premio_total || 0)
          };
          
          lotesAtivos.set(loteData.id, lote);
          console.log(`✅ [LOTES] Lote ${loteData.id} sincronizado (valor: R$${loteData.valor_aposta}, posição: ${loteData.posicao_atual}/${loteData.tamanho})`);
        }
      }
    } else {
      console.log('✅ [LOTES] Nenhum lote ativo no banco');
    }
  } catch (error) {
    console.error('❌ [LOTES] Erro ao sincronizar lotes:', error);
    // Não bloquear inicialização do servidor se sincronização falhar
  }
}

// =====================================================
// CONFIGURAÇÃO MERCADO PAGO
// =====================================================

const mercadoPagoAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
let mercadoPagoConnected = false;

// Testar Mercado Pago
async function testMercadoPago() {
  if (!mercadoPagoAccessToken) {
    console.log('⚠️ [MERCADO-PAGO] Token não configurado');
    return false;
  }

  try {
    const response = await axios.get('https://api.mercadopago.com/v1/payment_methods', {
      headers: { 
        'Authorization': `Bearer ${mercadoPagoAccessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'GolDeOuro/1.2.0'
      },
      timeout: 5000,
      maxRedirects: 3,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      console.log('✅ [MERCADO-PAGO] Conectado com sucesso');
      mercadoPagoConnected = true;
      return true;
    }
  } catch (error) {
    console.log('❌ [MERCADO-PAGO] Erro:', error.message);
    mercadoPagoConnected = false;
    return false;
  }
}

// =====================================================
// MIDDLEWARE E CONFIGURAÇÕES
// =====================================================

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  frameguard: {
    action: 'deny' // ✅ GO-LIVE: Adicionar X-Frame-Options: DENY
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());
// Trust proxy configurado corretamente para Fly.io (1 = confiar apenas no primeiro proxy)
app.set('trust proxy', 1);

// CORS configurado
const parseCorsOrigins = () => {
  const csv = process.env.CORS_ORIGIN || '';
  const list = csv.split(',').map(s => s.trim()).filter(Boolean);
  return list.length > 0 ? list : [
    'https://goldeouro.lol',
    'https://www.goldeouro.lol',
    'https://admin.goldeouro.lol'
  ];
};

// ✅ CORREÇÃO: CORS mais restritivo e seguro
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = parseCorsOrigins();
    
    // ✅ CORREÇÃO: Permitir health check do Fly.io sem origin
    // O Fly.io faz health check sem origin header, então precisamos permitir
    const isHealthCheck = !origin || origin === '';
    
    // Permitir requisições sem origin (mobile apps, Postman, health checks, etc)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar se origin está na lista permitida
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key', 'x-admin-token'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
  maxAge: 86400 // 24 horas
}));

// Rate limiting melhorado
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP (mais razoável)
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false }, // ✅ CORRIGIDO: Desabilitar validação de trust proxy para evitar erro
  skip: (req) => {
    // Pular rate limiting para health check, meta e auth
    return req.path === '/health' || 
           req.path === '/meta' || 
           req.path.startsWith('/auth/') ||
           req.path.startsWith('/api/auth/');
  },
  handler: (req, res) => {
    console.log(`🚫 [RATE-LIMIT] IP ${req.ip} bloqueado por excesso de requests (${req.path})`);
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas. Tente novamente em 15 minutos.',
      retryAfter: Math.round(15 * 60) // 15 minutos em segundos
    });
  }
});

// Rate limiting específico para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login por IP
  validate: { trustProxy: false }, // ✅ CORRIGIDO: Desabilitar validação de trust proxy
  message: {
        success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  skipSuccessfulRequests: true, // Não contar tentativas bem-sucedidas
  handler: (req, res) => {
    console.log(`🚫 [AUTH-LIMIT] IP ${req.ip} bloqueado por excesso de tentativas de login`);
    res.status(429).json({
      success: false,
      message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
    });
  }
});

app.use(limiter); // Rate limiting global
app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
app.use('/auth/', authLimiter);

// Body parsing
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      req.rawBody = buf.toString('utf8');
    } catch (e) {
      req.rawBody = undefined;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// REGISTRO DE ROTAS ORGANIZADAS
// =====================================================
// ✅ FASE 9: Refatoração controlada - Registrar rotas de arquivos dedicados
// Nota: Rotas inline abaixo ainda funcionam para compatibilidade
// Serão removidas gradualmente após testes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/user', usuarioRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/withdraw', withdrawRoutes);
app.use('/', systemRoutes); // Rotas de sistema na raiz

// =====================================================
// MIDDLEWARE DE VALIDAÇÃO
// =====================================================

// Middleware para validar dados usando express-validator
const validateData = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =====================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ [AUTH] Token não fornecido');
        return res.status(401).json({
          success: false,
      message: 'Token de acesso requerido' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ [AUTH] Token inválido:', err.message);
        return res.status(403).json({
          success: false,
        message: 'Token inválido' 
        });
      }
    req.user = user;
      next();
  });
};

// =====================================================
// SISTEMA DE LOTES CORRIGIDO
// =====================================================

let lotesAtivos = new Map();
// Variáveis globais para métricas - ZERADAS para produção real
let contadorChutesGlobal = 0; // Zerado - sem dados simulados
let ultimoGolDeOuro = 0; // Zerado - sem dados simulados

// Configurações dos lotes por valor de aposta
const batchConfigs = {
  1: { size: 10, totalValue: 10, winChance: 0.1, description: "10% chance" },
  2: { size: 5, totalValue: 10, winChance: 0.2, description: "20% chance" },
  5: { size: 2, totalValue: 10, winChance: 0.5, description: "50% chance" },
  10: { size: 1, totalValue: 10, winChance: 1.0, description: "100% chance" }
};

// ✅ PERSISTÊNCIA DE LOTES: Função atualizada para persistir no banco
async function getOrCreateLoteByValue(amount) {
  const config = batchConfigs[amount];
  if (!config) {
    throw new Error(`Valor de aposta inválido: ${amount}`);
  }

  // Verificar se existe lote ativo em memória para este valor
  let loteAtivo = null;
  for (const [loteId, lote] of lotesAtivos.entries()) {
    // Compatível com validador: usa lote.valor e booleano lote.ativo
    const valorLote = typeof lote.valor !== 'undefined' ? lote.valor : lote.valorAposta;
    const ativo = typeof lote.ativo === 'boolean' ? lote.ativo : lote.status === 'active';
    if (valorLote === amount && ativo && lote.chutes.length < config.size) {
      loteAtivo = lote;
      break;
    }
  }

  // Se não existe em memória, buscar/criar no banco
  if (!loteAtivo) {
    // ✅ CORREÇÃO INSECURE RANDOMNESS: Usar crypto.randomBytes ao invés de Math.random()
    const randomBytes = crypto.randomBytes(6).toString('hex');
    const loteId = `lote_${amount}_${Date.now()}_${randomBytes}`;
    const winnerIndex = crypto.randomInt(0, config.size);

    // ✅ PERSISTIR NO BANCO
    if (dbConnected && supabase) {
      try {
        const result = await LoteService.getOrCreateLote(loteId, amount, config.size, winnerIndex);
        
        if (!result.success) {
          console.error(`❌ [LOTE] Erro ao criar lote no banco: ${result.error}`);
          // Continuar com criação em memória apenas (fallback)
        } else {
          // Usar dados do banco
          const loteData = result.lote;
          loteAtivo = {
            id: loteData.id,
            valor: loteData.valor_aposta,
            ativo: loteData.status === 'ativo',
            valorAposta: loteData.valor_aposta,
            config: config,
            chutes: [], // Será reconstruído conforme necessário
            status: loteData.status === 'ativo' ? 'active' : 'completed',
            winnerIndex: loteData.indice_vencedor,
            createdAt: new Date().toISOString(),
            totalArrecadado: parseFloat(loteData.total_arrecadado || 0),
            premioTotal: parseFloat(loteData.premio_total || 0)
          };
          
          lotesAtivos.set(loteId, loteAtivo);
          console.log(`🎮 [LOTE] Novo lote criado e persistido: ${loteId} (R$${amount})`);
          return loteAtivo;
        }
      } catch (error) {
        console.error(`❌ [LOTE] Exceção ao criar lote no banco: ${error.message}`);
        // Continuar com criação em memória apenas (fallback)
      }
    }

    // Fallback: criar apenas em memória se banco não disponível
    loteAtivo = {
      id: loteId,
      valor: amount,
      ativo: true,
      valorAposta: amount,
      config: config,
      chutes: [],
      status: 'active',
      winnerIndex: winnerIndex,
      createdAt: new Date().toISOString(),
      totalArrecadado: 0,
      premioTotal: 0
    };
    lotesAtivos.set(loteId, loteAtivo);
    console.log(`🎮 [LOTE] Novo lote criado (apenas memória): ${loteId} (R$${amount})`);
  }

  return loteAtivo;
}

// =====================================================
// ROTAS DE AUTENTICAÇÃO
// =====================================================
// ✅ FASE 9 ETAPA 4: Rotas removidas - agora em routes/authRoutes.js
// Todas as rotas de autenticação foram movidas para authRoutes.js

// =====================================================
// ROTAS DE PERFIL DO USUÁRIO
// =====================================================
// ✅ FASE 9 ETAPA 4: Rotas removidas - agora em routes/usuarioRoutes.js
// Todas as rotas de usuário foram movidas para usuarioRoutes.js

// =====================================================
// SISTEMA DE JOGO CORRIGIDO
// =====================================================
// ✅ FASE 9 ETAPA 5: Rota removida - agora em routes/gameRoutes.js
// A rota POST /api/games/shoot foi movida para routes/gameRoutes.js
// O método GameController.shoot recebe dependências injetadas do servidor

// ⚠️ ROTA REMOVIDA: POST /api/games/shoot (agora em routes/gameRoutes.js)
// Removida - código foi movido para controllers/gameController.js método shoot()

// =====================================================
// SISTEMA DE SAQUES PIX COM VALIDAÇÃO
// =====================================================
// ✅ FASE 9 ETAPA 4: Rotas removidas - agora em routes/withdrawRoutes.js
// Todas as rotas de saque foram movidas para withdrawRoutes.js

// =====================================================
// SISTEMA DE PAGAMENTOS PIX CORRIGIDO
// =====================================================
// ✅ FASE 9 ETAPA 4: Rotas removidas - agora em routes/paymentRoutes.js
// ⚠️ ROTA MANTIDA: POST /api/games/shoot (linha ~672) - Usada pelo frontend, lógica complexa de lotes
// ⚠️ ROTA MANTIDA: POST /api/payments/webhook (linha ~1389) - Webhook do Mercado Pago

// ⚠️ ROTA REMOVIDA: POST /api/payments/pix/criar (agora em paymentRoutes.js)
// ⚠️ ROTA REMOVIDA: GET /api/payments/pix/usuario (agora em paymentRoutes.js)

// =====================================================
// WEBHOOK PIX CORRIGIDO
// =====================================================
// ✅ FASE 9 ETAPA 5: Rota removida - agora em routes/paymentRoutes.js
// A rota POST /api/payments/webhook foi movida para routes/paymentRoutes.js
// O método PaymentController.webhookMercadoPago inclui validação de signature

// ⚠️ ROTA REMOVIDA: POST /api/payments/webhook (agora em routes/paymentRoutes.js)
// Removida - código abaixo foi movido para controllers/paymentController.js

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

// Salvar contador global
async function saveGlobalCounter() {
  if (dbConnected && supabase) {
    try {
      const { error } = await supabase
        .from('metricas_globais')
        .upsert({
          id: 1,
          contador_chutes_global: contadorChutesGlobal,
          ultimo_gol_de_ouro: ultimoGolDeOuro,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('❌ [METRICS] Erro ao salvar contador:', error);
      }
    } catch (error) {
      console.error('❌ [METRICS] Erro:', error);
    }
  }
}

// Reconciliação automática de PIX pendentes (fallback ao webhook)
let reconciling = false;
async function reconcilePendingPayments() {
  if (reconciling) return;
  if (!dbConnected || !supabase || !mercadoPagoConnected) return;
  try {
    reconciling = true;
    const maxAgeMin = parseInt(process.env.MP_RECONCILE_MIN_AGE_MIN || '2', 10);
    const limit = parseInt(process.env.MP_RECONCILE_LIMIT || '10', 10);
    const sinceIso = new Date(Date.now() - maxAgeMin * 60 * 1000).toISOString();

    const { data: pendings, error: listError } = await supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, external_id, payment_id, status, amount, valor, created_at')
      .eq('status', 'pending')
      .lt('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (listError) {
      console.error('❌ [RECON] Erro ao listar pendentes:', listError.message);
      return;
    }
    if (!pendings || pendings.length === 0) return;

    for (const p of pendings) {
      // ✅ CORREÇÃO: Usar payment_id (ID do Mercado Pago) em vez de external_id
      // external_id é uma string interna (ex: "deposito_userId_timestamp")
      // payment_id é o ID numérico do Mercado Pago (ex: "468718642-...")
      const mpId = String(p.payment_id || '').trim();
      if (!mpId) {
        console.warn('⚠️ [RECON] Pagamento sem payment_id, pulando:', p.id);
        continue;
      }

      // ✅ CORREÇÃO SSRF: Validar mpId antes de usar na URL
      // payment_id do Mercado Pago pode ser um número ou formato "número-uuid"
      // Extrair apenas a parte numérica inicial
      const paymentIdMatch = mpId.match(/^(\d+)/);
      if (!paymentIdMatch) {
        console.error('❌ [RECON] ID de pagamento inválido (formato incorreto):', mpId);
        continue;
      }
      
      const paymentId = parseInt(paymentIdMatch[1], 10);
      if (isNaN(paymentId) || paymentId <= 0) {
        console.error('❌ [RECON] ID de pagamento inválido (não é número positivo):', mpId);
        continue;
      }

      try {
        const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
          timeout: 5000
        });
        const status = resp?.data?.status;
        if (status === 'approved') {
          // ✅ CORREÇÃO: Usar payment_id para atualizar (não external_id)
          const { error: updError } = await supabase
            .from('pagamentos_pix')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('payment_id', mpId);
          
          if (updError) {
            console.error('❌ [RECON] Falha ao aprovar registro:', updError.message);
            continue;
          }

          const credit = (p.amount ?? p.valor ?? 0);
          if (credit > 0) {
            // ✅ FASE 1: Usar FinancialService ACID para crédito
            const addBalanceResult = await FinancialService.addBalance(
              p.usuario_id,
              parseFloat(credit),
              {
                description: 'Depósito via PIX (Reconciliação)',
                referenceId: mpId ? parseInt(String(mpId).replace(/\D/g, '')) || null : null,
                referenceType: 'deposito'
              }
            );

            if (!addBalanceResult.success) {
              console.error(`❌ [RECON] Erro ao creditar saldo ACID para pagamento ${mpId}:`, addBalanceResult.error);
              } else {
              console.log(`✅ [RECON] Pagamento ${mpId} aprovado e saldo +${credit} aplicado ACID ao usuário ${p.usuario_id} (saldo: ${addBalanceResult.data.oldBalance} → ${addBalanceResult.data.newBalance})`);
            }
          }
        }
      } catch (mpErr) {
        // ✅ CORREÇÃO: Tratar erros 404 (Payment not found) de forma mais silenciosa
        // Pagamentos antigos/expirados que não existem mais no Mercado Pago são esperados
        if (mpErr.response?.status === 404) {
          // Marcar como expirado após múltiplas tentativas de 404
          const ageDays = Math.floor((Date.now() - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24));
          if (ageDays > 1) {
            // Pagamento com mais de 1 dia e não encontrado = provavelmente expirado
            await supabase
              .from('pagamentos_pix')
              .update({ status: 'expired', updated_at: new Date().toISOString() })
              .eq('payment_id', mpId);
            console.log(`✅ [RECON] Pagamento ${mpId} marcado como expirado (não encontrado no MP após ${ageDays} dias)`);
          }
          // Não logar erro para pagamentos antigos (reduz verbosidade)
        } else {
          // Logar outros erros normalmente
          console.log(`⚠️ [RECON] Erro consultando MP ${mpId}:`, mpErr.response?.data || mpErr.message);
        }
      }
    }
  } catch (err) {
    console.error('❌ [RECON] Erro geral:', err.message);
  } finally {
    reconciling = false;
  }
}

// Agendar reconciliação (habilitado por padrão)
if (process.env.MP_RECONCILE_ENABLED !== 'false') {
  const intervalMs = parseInt(process.env.MP_RECONCILE_INTERVAL_MS || '60000', 10);
  setInterval(reconcilePendingPayments, Math.max(30000, intervalMs));
  console.log(`🕒 [RECON] Reconciliação de PIX pendentes ativa a cada ${Math.round(intervalMs / 1000)}s`);
}

// =====================================================
// ROTAS DE SAÚDE E MONITORAMENTO
// =====================================================
// ✅ FASE 9 ETAPA 3: Rotas movidas para systemRoutes.js
// Rotas abaixo foram removidas e estão em routes/systemRoutes.js:
// - GET /robots.txt
// - GET /
// - GET /health
// - GET /api/metrics
// - GET /api/monitoring/metrics
// - GET /api/monitoring/health
// - GET /meta
// - GET /api/production-status

// Métricas globais - REMOVIDA (agora em systemRoutes.js)

// =====================================================
// INICIALIZAÇÃO DO SERVIDOR
// =====================================================

async function startServer() {
  try {
    // Validar variáveis obrigatórias
    if (!process.env.JWT_SECRET) {
      console.error('❌ [ENV] JWT_SECRET não configurado');
      process.exit(1);
    }

    // ✅ CORREÇÃO: Iniciar servidor ANTES de conectar ao banco para health check rápido
    // O Fly.io precisa que o servidor esteja escutando imediatamente
    const server = http.createServer(app);
    const wss = new WebSocketManager(server);
    
    // Escutar imediatamente na porta correta
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 [SERVER] Servidor iniciado na porta ${PORT}`);
      console.log(`🌐 [SERVER] Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ [SERVER] Health check disponível em http://0.0.0.0:${PORT}/health`);
    });
    
    // Tratamento de erro no servidor
    server.on('error', (error) => {
      console.error('❌ [SERVER] Erro no servidor HTTP:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ [SERVER] Porta ${PORT} já está em uso`);
        process.exit(1);
      }
    });

    // Conectar Supabase (após servidor iniciar)
    await connectSupabase();
    
    // Testar Mercado Pago (após servidor iniciar)
    await testMercadoPago();
    
    // ✅ Validar e expirar pagamentos PIX stale no boot
    if (dbConnected && supabase) {
      try {
        console.log('🔄 [BOOT] Validando pagamentos PIX stale...');
        const { data: expireResult, error: expireError } = await supabase.rpc('expire_stale_pix');
        
        if (expireError) {
          console.warn('⚠️ [BOOT] Erro ao expirar pagamentos PIX stale no boot:', expireError.message);
        } else {
          const expiredCount = expireResult?.expired_count || 0;
          if (expiredCount > 0) {
            console.log(`✅ [BOOT] ${expiredCount} pagamentos PIX stale foram marcados como expired no boot`);
          } else {
            console.log('✅ [BOOT] Nenhum pagamento PIX stale encontrado no boot');
          }
        }
      } catch (bootExpireError) {
        console.warn('⚠️ [BOOT] Erro ao validar pagamentos PIX stale no boot:', bootExpireError.message);
      }
    }
    
    // Carregar contador global
    if (dbConnected && supabase) {
      try {
        const { data: metrics, error } = await supabase
          .from('metricas_globais')
          .select('contador_chutes_global, ultimo_gol_de_ouro')
          .eq('id', 1)
          .single();

        if (!error && metrics) {
          contadorChutesGlobal = metrics.contador_chutes_global || 0;
          ultimoGolDeOuro = metrics.ultimo_gol_de_ouro || 0;
          console.log(`📊 [METRICS] Contador carregado: ${contadorChutesGlobal} chutes, último Gol de Ouro: ${ultimoGolDeOuro}`);
        }
      } catch (error) {
        console.error('❌ [METRICS] Erro ao carregar contador:', error);
      }
    }
    
    // ✅ FASE 9: Injetar dependências do servidor no SystemController
    const SystemController = require('./controllers/systemController');
    SystemController.injectDependencies({
      dbConnected,
      mercadoPagoConnected,
      contadorChutesGlobal,
      ultimoGolDeOuro
    });
    
    // ✅ FASE 9 ETAPA 5: Injetar dependências do servidor no GameController
    const GameController = require('./controllers/gameController');
    GameController.injectDependencies({
      dbConnected,
      supabase: supabase,
      getOrCreateLoteByValue: getOrCreateLoteByValue,
      batchConfigs: batchConfigs,
      contadorChutesGlobal: contadorChutesGlobal,
      ultimoGolDeOuro: ultimoGolDeOuro,
      saveGlobalCounter: saveGlobalCounter,
      incrementGlobalCounter: () => {
        contadorChutesGlobal++;
        return contadorChutesGlobal;
      },
      setUltimoGolDeOuro: (value) => {
        ultimoGolDeOuro = value;
      }
    });
    
    // Sistema de monitoramento avançado
const monitoringMetrics = {
  requests: { total: 0, success: 0, errors: 0, avgResponseTime: 0 },
  users: { active: 0, registered: 0, online: 0 },
  payments: { total: 0, success: 0, pending: 0, failed: 0 },
  games: { totalShots: 0, goals: 0, goldenGoals: 0 },
  performance: { memoryUsage: 0, cpuUsage: 0, uptime: 0 }
};

// Middleware de monitoramento avançado
app.use((req, res, next) => {
  const startTime = Date.now();
  
  // Incrementar contador de requisições
  monitoringMetrics.requests.total++;
  
  // Interceptar resposta
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Atualizar métricas
    if (res.statusCode >= 200 && res.statusCode < 300) {
      monitoringMetrics.requests.success++;
    } else {
      monitoringMetrics.requests.errors++;
    }
    
    // Calcular tempo médio de resposta
    monitoringMetrics.requests.avgResponseTime = 
      (monitoringMetrics.requests.avgResponseTime + responseTime) / 2;
    
    // Log estruturado
    console.log(`📊 [MONITORING] ${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`);
    
    // Chamar método original
    originalSend.call(this, data);
  };
  
  next();
});

// Endpoints de monitoramento - REMOVIDOS (agora em systemRoutes.js)
// - GET /api/monitoring/metrics
// - GET /api/monitoring/health
// - GET /meta

// ✅ FASE 9 ETAPA 4: Rotas de autenticação removidas - agora em routes/authRoutes.js
// ⚠️ ROTA REMOVIDA: PUT /api/auth/change-password (agora em authRoutes.js)
// ⚠️ ROTA REMOVIDA: POST /auth/login (legacy, agora em authRoutes.js)

// =====================================================
// ROTAS ADMIN - RELATÓRIOS E ESTATÍSTICAS
// =====================================================
// ✅ FASE 9 ETAPA 4: Rotas removidas - agora em routes/adminRoutes.js
// Todas as rotas admin foram movidas para adminRoutes.js
// O middleware authAdmin está disponível em middlewares/authMiddleware.js

// =====================================================
// ROTAS LEGACY/COMPATIBILIDADE
// =====================================================
// ✅ FASE 9 ETAPA 4: Rotas legacy removidas
// ⚠️ ROTA REMOVIDA: POST /api/admin/bootstrap (pode ser movida para adminRoutes.js)
// ⚠️ ROTA REMOVIDA: GET /api/debug/token (debug, pode ser removida)
// ⚠️ ROTA REMOVIDA: GET /usuario/perfil (legacy, agora em usuarioRoutes.js)
// ⚠️ ROTA REMOVIDA: GET /api/fila/entrar (legacy, sistema de fila não usado)

// Middleware de tratamento de erros global (deve ser o último)
    app.use((err, req, res, next) => {
      console.error('❌ [ERROR] Erro não tratado:', err);
      
      // Incrementar contador de erros
      monitoringMetrics.requests.errors++;
      
      // Log detalhado do erro
      console.error('❌ [ERROR] Stack:', err.stack);
      console.error('❌ [ERROR] URL:', req.url);
      console.error('❌ [ERROR] Method:', req.method);
      console.error('❌ [ERROR] IP:', req.ip);
      
      // Resposta padronizada
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    });

    // Middleware global de tratamento de erros
    app.use((err, req, res, next) => {
      try {
        logger.error('Unhandled error', {
          path: req.originalUrl,
          method: req.method,
          ip: req.ip,
          message: err.message,
          stack: err.stack
        });
      } catch (_) {
        console.error('❌ [ERROR] Unhandled error (logger fallback):', err);
      }
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    });

    // Middleware para rotas não encontradas (deve ser o último)
    app.use('*', (req, res) => {
      // ✅ CORREÇÃO: Verificar se é rota protegida com token inválido
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Se tem token mas rota não existe, pode ser token inválido em rota protegida
        // Mas vamos retornar 404 mesmo assim, pois a rota realmente não existe
        console.log(`⚠️ [404] Rota não encontrada (com token): ${req.method} ${req.originalUrl}`);
      } else {
        console.log(`❌ [404] Rota não encontrada: ${req.method} ${req.originalUrl}`);
      }
      res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        path: req.originalUrl,
        method: req.method
      });
    });
    
    // ✅ CORREÇÃO: Servidor já foi iniciado no início da função
    // Apenas atualizar logs com status final
    console.log(`📊 [SERVER] Supabase: ${dbConnected ? 'Conectado' : 'Desconectado'}`);
    console.log(`💳 [SERVER] Mercado Pago: ${mercadoPagoConnected ? 'Conectado' : 'Desconectado'}`);
    console.log('✅ [SERVER] Sistema de monitoramento desabilitado temporariamente');
    
  } catch (error) {
    console.error('❌ [SERVER] Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

// =====================================================
// SERVIDOR SIMPLIFICADO v1.2.0 - DEPLOY FUNCIONAL
// =====================================================
