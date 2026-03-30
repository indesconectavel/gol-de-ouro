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
const {
  normalizePagamentoPixRead,
  normalizeSaqueRead,
  dualWritePagamentoPixRow,
  dualWriteSaqueRow
} = require('./utils/financialNormalization');
const {
  TERMS_VERSION,
  buildConsentSnapshot,
  isConsentIncomplete
} = require('./utils/consent-utils');

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
// WebSocket Manager (inicializado após criar o servidor HTTP)
const WebSocketManager = require('./src/websocket');

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
let isAppReady = false;
let httpServer = null;

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
    return true;
    
  } catch (error) {
    console.log('❌ [SUPABASE] Erro na conexão:', error.message);
    dbConnected = false;
    return false;
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
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression());
// Trust proxy configurado corretamente para Fly.io (1 = confiar apenas no primeiro proxy)
app.set('trust proxy', 1);

// CORS configurado: allowlist explícita + previews Vercel (.vercel.app)
const ALLOWED_ORIGINS_EXPLICIT = [
  'https://goldeouro.lol',
  'https://www.goldeouro.lol',
  'https://admin.goldeouro.lol',
  'https://app.goldeouro.lol'
];

const parseCorsOrigins = () => {
  const csv = process.env.CORS_ORIGIN || '';
  const list = csv.split(',').map(s => s.trim()).filter(Boolean);
  return list.length > 0 ? list : ALLOWED_ORIGINS_EXPLICIT;
};

const allowedOriginsList = parseCorsOrigins();

const corsOptions = {
  origin: (origin, callback) => {
    // Requests sem header Origin (ex.: same-origin, curl, Postman) são aceitos sem header CORS
    if (!origin) {
      return callback(null, true);
    }
    // Allowlist explícita (domínios oficiais + CORS_ORIGIN do ambiente)
    if (allowedOriginsList.includes(origin)) {
      return callback(null, true);
    }
    // Previews Vercel: permitir apenas origens HTTPS que terminam em .vercel.app
    if (typeof origin === 'string' && origin.startsWith('https://') && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
};

app.use(cors(corsOptions));

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
    // Pular rate limiting para health check, meta, auth e beacon de analytics (V1)
    return req.path === '/health' || 
           req.path === '/meta' || 
           req.path.startsWith('/auth/') ||
           req.path.startsWith('/api/auth/') ||
           req.path === '/api/analytics';
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

// Ingestão mínima de analytics do cliente (sendBeacon) — ver routes/analyticsIngest.js
app.use('/api/analytics', require('./routes/analyticsIngest'));

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

// Blindagem concorrência: cache de chaves de idempotência (TTL 120s) para evitar replay/retry duplicando chute
const IDEMPOTENCY_TTL_MS = 120000;
const idempotencyProcessed = new Map(); // key -> { ts }
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of idempotencyProcessed.entries()) {
    if (now - val.ts > IDEMPOTENCY_TTL_MS) idempotencyProcessed.delete(key);
  }
}, 60000);

// Configurações dos lotes por valor de aposta
const batchConfigs = {
  1: { size: 10, totalValue: 10, winChance: 0.1, description: "10% chance" },
  2: { size: 5, totalValue: 10, winChance: 0.2, description: "20% chance" },
  5: { size: 2, totalValue: 10, winChance: 0.5, description: "50% chance" },
  10: { size: 1, totalValue: 10, winChance: 1.0, description: "100% chance" }
};

function getOrCreateLoteByValue(amount) {
  const config = batchConfigs[amount];
  if (!config) {
    throw new Error(`Valor de aposta inválido: ${amount}`);
  }

  // Verificar se existe lote ativo para este valor
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

  // Se não existe lote ativo, criar novo
  if (!loteAtivo) {
    // ✅ CORREÇÃO INSECURE RANDOMNESS: Usar crypto.randomBytes ao invés de Math.random()
    const randomBytes = crypto.randomBytes(6).toString('hex');
    const loteId = `lote_${amount}_${Date.now()}_${randomBytes}`;
    loteAtivo = {
      id: loteId,
      // Campos esperados pelo validador de integridade
      valor: amount,
      ativo: true,

      // Mantém compatibilidade com código existente
      valorAposta: amount,
      config: config,
      chutes: [],
      status: 'active',
      // V1: gol sempre no último chute do lote (10º chute para valor 1)
      winnerIndex: config.size - 1,
      createdAt: new Date().toISOString(),
      totalArrecadado: 0,
      premioTotal: 0
    };
    lotesAtivos.set(loteId, loteAtivo);
    console.log(`🎮 [LOTE] Novo lote criado: ${loteId} (R$${amount})`);
  }

  return loteAtivo;
}

// =====================================================
// ROTAS DE AUTENTICAÇÃO
// =====================================================

// Recuperação de senha - GERAR TOKEN
app.post('/api/auth/forgot-password', [
  body('email').isEmail().normalizeEmail()
], validateData, async (req, res) => {
  try {
    const { email } = req.body;

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    // Verificar se email existe
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, username')
      .eq('email', email)
      .eq('ativo', true)
      .single();

    if (userError || !user) {
      // Por segurança, sempre retornar sucesso mesmo se email não existir
      // ✅ CORREÇÃO FORMAT STRING: Combinar string antes de logar
      const sanitizedEmailNotFound = typeof email === 'string' ? email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '') : String(email);
      const logMessageNotFound = `📧 [FORGOT-PASSWORD] Email não encontrado: ${sanitizedEmailNotFound}`;
      console.log(logMessageNotFound);
      return res.status(200).json({
        success: true,
        message: 'Se o email existir, você receberá um link de recuperação'
      });
    }

    // Gerar token de recuperação (válido por 1 hora)
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        type: 'password_reset' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Salvar token no banco de dados
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hora
        used: false,
        created_at: new Date().toISOString()
      });

    if (tokenError) {
      console.error('❌ [FORGOT-PASSWORD] Erro ao salvar token:', tokenError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // Enviar email real com link de recuperação
    const emailResult = await emailService.sendPasswordResetEmail(email, user.username, resetToken);

    // Se o envio falhou, retornar erro honesto ao cliente (não mentir que enviou)
    if (!emailResult.success) {
      const sanitizedEmailErr = typeof email === 'string' ? email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '') : String(email);
      console.error('❌ [FORGOT-PASSWORD] Falha ao enviar email para', sanitizedEmailErr, ':', emailResult.error);
      return res.status(503).json({
        success: false,
        message: 'Não foi possível enviar o e-mail de recuperação. Tente novamente mais tarde.'
      });
    }
    
    // ✅ CORREÇÃO STRING ESCAPING: Sanitizar dados antes de usar em logs
    const sanitizedEmail = typeof email === 'string' ? email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '') : String(email);
    const sanitizedToken = typeof resetToken === 'string' ? resetToken.substring(0, 20) + '...' : '***';
    
    const logMessage = `📧 [FORGOT-PASSWORD] Email enviado para ${sanitizedEmail}: ${emailResult.messageId}`;
    console.log(logMessage);
    
    const successMessage = `✅ [FORGOT-PASSWORD] Token de recuperação gerado para: ${sanitizedEmail}`;
    console.log(successMessage);
    
    res.status(200).json({
      success: true,
      message: 'Se o email existir, você receberá um link de recuperação'
    });

  } catch (error) {
    console.error('❌ [FORGOT-PASSWORD] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Reset de senha - VALIDAR TOKEN E ALTERAR SENHA
app.post('/api/auth/reset-password', [
  body('token').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], validateData, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    // Verificar se token existe e é válido
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido ou expirado'
      });
    }

    // Verificar se token não expirou
    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'Token expirado'
      });
    }

    // Hash da nova senha
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha do usuário
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ 
        senha_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('❌ [RESET-PASSWORD] Erro ao atualizar senha:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar senha'
      });
    }

    // Marcar token como usado (com retry para consistência)
    let markUsedError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await supabase
        .from('password_reset_tokens')
        .update({ used: true })
        .eq('token', token);
      markUsedError = result.error;
      if (!markUsedError) break;
      if (attempt === 0) await new Promise(r => setTimeout(r, 300));
    }
    if (markUsedError) {
      console.error('❌ [RESET-PASSWORD] Erro ao marcar token como usado (após retry):', markUsedError);
    }

    console.log(`✅ [RESET-PASSWORD] Senha alterada com sucesso para usuário ${tokenData.user_id}`);
    
    res.status(200).json({
      success: true,
      message: 'Senha alterada com sucesso'
    });

  } catch (error) {
    console.error('❌ [RESET-PASSWORD] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Verificação de email
app.post('/api/auth/verify-email', [
  body('token').notEmpty()
], validateData, async (req, res) => {
  try {
    const { token } = req.body;

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    // Verificar se token existe e é válido
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_verification_tokens')
      .select('user_id, expires_at, used')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (tokenError || !tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificação inválido ou expirado'
      });
    }

    // Verificar se token não expirou
    if (new Date() > new Date(tokenData.expires_at)) {
      return res.status(400).json({
        success: false,
        message: 'Token de verificação expirado'
      });
    }

    // Marcar email como verificado
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ 
        email_verificado: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenData.user_id);

    if (updateError) {
      console.error('❌ [VERIFY-EMAIL] Erro ao verificar email:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar email'
      });
    }

    // Marcar token como usado
    const { error: markUsedError } = await supabase
      .from('email_verification_tokens')
      .update({ used: true })
      .eq('token', token);

    if (markUsedError) {
      console.error('❌ [VERIFY-EMAIL] Erro ao marcar token como usado:', markUsedError);
    }

    console.log(`✅ [VERIFY-EMAIL] Email verificado com sucesso para usuário ${tokenData.user_id}`);
    
    res.status(200).json({
      success: true,
      message: 'Email verificado com sucesso! Sua conta está ativa.'
    });

  } catch (error) {
    console.error('❌ [VERIFY-EMAIL] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Registro de usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, acceptedTerms, isAdultConfirmed } = req.body;
    if (acceptedTerms !== true) {
      return res.status(400).json({
        success: false,
        message: 'É obrigatório aceitar os Termos de Uso e a Política de Privacidade.'
      });
    }

    if (isAdultConfirmed !== true) {
      return res.status(400).json({
        success: false,
        message: 'É obrigatório confirmar que você possui 18 anos ou mais.'
      });
    }


    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível' 
      });
    }

    // Verificar se email já existe
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [REGISTER] Erro ao verificar email:', checkError);
      return res.status(500).json({ 
          success: false,
        message: 'Erro interno do servidor' 
      });
    }

    if (existingUser) {
      // ✅ CORREÇÃO FORMAT STRING: Combinar string antes de logar
      const sanitizedEmailRegister = typeof email === 'string' ? email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '') : String(email);
      const logMessageRegister = `⚠️ [REGISTER] Tentativa de registro com email existente: ${sanitizedEmailRegister}`;
      console.log(logMessageRegister);
      
      // Tentar fazer login automaticamente se email já existe
      try {
        const { data: user, error: userError } = await supabase
        .from('usuarios')
          .select('*')
          .eq('email', email)
          .eq('ativo', true)
        .single();

        if (!userError && user) {
          // Verificar senha
          const senhaValida = await bcrypt.compare(password, user.senha_hash);
          if (senhaValida) {
      // Gerar token JWT
      const token = jwt.sign(
              { 
                userId: user.id, 
                email: user.email,
                username: user.username
              },
              process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

            // ✅ CORREÇÃO FORMAT STRING: Combinar string antes de logar
            const logMessageAutoLogin = `✅ [REGISTER] Login automático realizado para email existente: ${sanitizedEmailRegister}`;
            console.log(logMessageAutoLogin);

            return res.status(200).json({
        success: true,
              message: 'Login realizado automaticamente (email já cadastrado)',
              token: token,
        user: {
                id: user.id,
                email: user.email,
                username: user.username,
                saldo: user.saldo,
                tipo: user.tipo,
                total_apostas: user.total_apostas,
                total_ganhos: user.total_ganhos,
                consentimento_incompleto: isConsentIncomplete(user)
              }
            });
          }
        }
      } catch (loginError) {
        console.log('⚠️ [REGISTER] Erro no login automático:', loginError.message);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Email já cadastrado. Use a opção "Esqueci minha senha" se necessário.' 
      });
    }

    // Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(password, saltRounds);
    
    // Criar usuário de teste para análise de aprendizado
    if (email === 'teste-aprendizado@example.com') {
      console.log('🧪 [TEST] Criando usuário de teste para análise de aprendizado');
    }

    // Criar usuário com saldo inicial para testes
    const consentSnapshot = buildConsentSnapshot(req, TERMS_VERSION);
    const { data: newUser, error: insertError } = await supabase
        .from('usuarios')
      .insert({
        email: email,
        username: username,
        senha_hash: senhaHash,
        saldo: calculateInitialBalance('regular'), // Saldo inicial dinâmico
        tipo: 'jogador',
        ativo: true,
        email_verificado: false,
        total_apostas: 0,
        total_ganhos: 0.00,
        ...consentSnapshot
      })
      .select()
        .single();

    if (insertError) {
      console.error('❌ [REGISTER] Erro ao criar usuário:', insertError);
      return res.status(500).json({ 
          success: false,
        message: 'Erro ao criar usuário' 
        });
      }

      // Gerar token JWT
      const token = jwt.sign(
      { 
        userId: newUser.id, 
        email: newUser.email,
        username: newUser.username
      },
      process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

    // ✅ CORREÇÃO FORMAT STRING: Combinar string antes de logar
    const sanitizedEmailCreated = typeof email === 'string' ? email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '') : String(email);
    const logMessageCreated = `✅ [REGISTER] Usuário criado: ${sanitizedEmailCreated} com saldo inicial de R$ ${calculateInitialBalance('regular')}`;
    console.log(logMessageCreated);

    res.status(201).json({
        success: true,
      message: 'Usuário criado com sucesso',
      token: token,
        user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        saldo: newUser.saldo,
        tipo: newUser.tipo,
        consentimento_incompleto: isConsentIncomplete(newUser)
      }
    });

  } catch (error) {
    console.error('❌ [REGISTER] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor' 
    });
  }
});

// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const sanitizedEmailLogin = typeof email === 'string' ? email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '') : String(email);

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    // Buscar usuário
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .single();

    if (userError || !user) {
      const logMessageLoginNotFound = `❌ [LOGIN] Usuário não encontrado: ${sanitizedEmailLogin}`;
      console.log(logMessageLoginNotFound);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(password, user.senha_hash);
    if (!senhaValida) {
      // ✅ CORREÇÃO FORMAT STRING: Combinar string antes de logar
      const logMessageInvalidPassword = `❌ [LOGIN] Senha inválida para: ${sanitizedEmailLogin}`;
      console.log(logMessageInvalidPassword);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar se usuário precisa de saldo inicial (para usuários antigos)
    if (user.saldo === 0 || user.saldo === null) {
      try {
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ saldo: calculateInitialBalance('regular') })
          .eq('id', user.id);
        
        if (!updateError) {
          user.saldo = calculateInitialBalance('regular');
          // ✅ CORREÇÃO FORMAT STRING: Combinar string antes de logar
          const logMessageBalance = `💰 [LOGIN] Saldo inicial de R$ ${calculateInitialBalance('regular')} adicionado para usuário ${sanitizedEmailLogin}`;
          console.log(logMessageBalance);
        }
      } catch (saldoError) {
        console.log('⚠️ [LOGIN] Erro ao adicionar saldo inicial:', saldoError.message);
      }
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // ✅ CORREÇÃO FORMAT STRING: Combinar string antes de logar
    const logMessageLoginSuccess = `✅ [LOGIN] Login realizado: ${sanitizedEmailLogin}`;
    console.log(logMessageLoginSuccess);

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        saldo: user.saldo,
        tipo: user.tipo,
        total_apostas: user.total_apostas,
        total_ganhos: user.total_ganhos,
        consentimento_incompleto: isConsentIncomplete(user)
      }
    });

  } catch (error) {
    console.error('❌ [LOGIN] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// ROTAS DE PERFIL DO USUÁRIO
// =====================================================

// Obter perfil do usuário
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      console.error('❌ [PROFILE] Usuário não encontrado:', userError);
      return res.status(404).json({ 
        success: false,
        message: 'Usuário não encontrado' 
      });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        nome: user.username, // Compatibilidade com frontend
        saldo: user.saldo,
        tipo: user.tipo,
        total_apostas: user.total_apostas,
        total_ganhos: user.total_ganhos,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('❌ [PROFILE] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Atualizar perfil do usuário
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { nome, email } = req.body;
    
    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    // Validar dados
    if (!nome || !email) {
      return res.status(400).json({ 
        success: false,
        message: 'Nome e email são obrigatórios' 
      });
    }

    // Verificar se email já existe (exceto para o usuário atual)
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .neq('id', req.user.userId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ [PROFILE] Erro ao verificar email:', checkError);
      return res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor'
    });
  }

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Este email já está em uso por outro usuário' 
      });
    }

    // Atualizar usuário
    const { data: updatedUser, error: updateError } = await supabase
      .from('usuarios')
      .update({
        username: nome,
        email: email,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.userId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ [PROFILE] Erro ao atualizar usuário:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar perfil' 
      });
    }

    console.log(`✅ [PROFILE] Perfil atualizado para usuário ${req.user.userId}`);

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso!',
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        nome: updatedUser.username, // Compatibilidade
        saldo: updatedUser.saldo || 0,
        total_apostas: updatedUser.total_apostas || 0,
        total_ganhos: updatedUser.total_ganhos || 0,
        tipo: updatedUser.tipo || 'user',
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      }
    });
  } catch (error) {
    console.error('❌ [PROFILE] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// SISTEMA DE JOGO CORRIGIDO
// =====================================================

// Direções válidas para chute (alinhado ao LoteIntegrityValidator e frontend)
const VALID_DIRECTIONS = ['TL', 'TR', 'C', 'BL', 'BR'];

/**
 * BLOCO D: reverte saldo após falha pós-update do chute. Só altera a linha se `saldo` ainda for
 * o valor retornado pelo update do chute (evita sobrescrever saldo modificado por outra operação).
 */
async function revertShootSaldoOptimistic(userId, saldoAntesChute, saldoAposChuteNoDb) {
  if (!supabase) {
    console.error('❌ [SHOOT-ROLLBACK] supabase indisponível', { userId });
    return { ok: false, reason: 'no_db' };
  }
  const { data, error } = await supabase
    .from('usuarios')
    .update({ saldo: saldoAntesChute })
    .eq('id', userId)
    .eq('saldo', saldoAposChuteNoDb)
    .select('id')
    .maybeSingle();
  if (error) {
    console.error('❌ [SHOOT-ROLLBACK] PostgREST:', error.message, {
      userId,
      saldoEsperadoNoWhere: saldoAposChuteNoDb,
      alvoRevert: saldoAntesChute
    });
    return { ok: false, reason: 'db_error' };
  }
  if (!data) {
    console.error(
      '⚠️ [SHOOT-ROLLBACK] Não revertido: saldo atual ≠ pós-chute (corrida ou drift). Playbook: verificar usuarios.saldo e tabela chutes para este user/lote.',
      { userId, saldoMatchEsperado: saldoAposChuteNoDb, saldoAlvoRevert: saldoAntesChute }
    );
    return { ok: false, reason: 'saldo_race' };
  }
  return { ok: true };
}

// Endpoint para chutar
app.post('/api/games/shoot', authenticateToken, async (req, res) => {
  try {
    const { direction, amount } = req.body;
    
    // Validar entrada
    if (!direction || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Direção e valor são obrigatórios'
      });
    }

    // Validar direção no backend (defesa em profundidade; frontend já valida)
    const directionNormalized = String(direction).trim().toUpperCase();
    if (!VALID_DIRECTIONS.includes(directionNormalized)) {
      return res.status(400).json({
        success: false,
        message: 'Direção inválida. Use: TL, TR, C, BL ou BR'
      });
    }

    // V1: apenas R$ 1,00 por chute — rejeitar qualquer outro valor
    const amountNum = Number(amount);
    if (amountNum !== 1) {
      return res.status(400).json({
        success: false,
        message: 'V1 aceita apenas R$ 1,00 por chute. Outros valores ficam reservados para versões futuras.'
      });
    }
    const betAmount = 1;

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    // Blindagem retry/replay: se o cliente enviar X-Idempotency-Key e já foi processada, rejeitar duplicata
    const idempotencyKey = (req.headers['x-idempotency-key'] || '').trim();
    if (idempotencyKey) {
      const entry = idempotencyProcessed.get(idempotencyKey);
      if (entry && (Date.now() - entry.ts < IDEMPOTENCY_TTL_MS)) {
        return res.status(409).json({
          success: false,
          message: 'Chute já processado com esta chave de idempotência. Use outra chave ou aguarde antes de reenviar.'
        });
      }
    }

    // Verificar saldo do usuário
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (user.saldo < betAmount) {
      return res.status(400).json({
      success: false,
        message: 'Saldo insuficiente'
      });
    }

    // Obter ou criar lote para este valor
    const lote = getOrCreateLoteByValue(betAmount);
    
    // Validar integridade do lote antes de processar chute
    const integrityValidation = loteIntegrityValidator.validateBeforeShot(lote, {
      direction: directionNormalized,
      amount: betAmount,
      userId: req.user.userId
    });

    if (!integrityValidation.valid) {
      console.error('❌ [SHOOT] Problema de integridade do lote:', integrityValidation.error);
      return res.status(400).json({
        success: false,
        message: integrityValidation.error
      });
    }
    
    // Incrementar contador global
    contadorChutesGlobal++;
    
    // Verificar se é Gol de Ouro (a cada 1000 chutes)
    const isGolDeOuro = contadorChutesGlobal % 1000 === 0;
    
    // Salvar contador no Supabase
    await saveGlobalCounter();
    
    // Determinar se é gol baseado no sistema de lotes
    const shotIndex = lote.chutes.length;
    const isGoal = shotIndex === lote.winnerIndex;
    const result = isGoal ? 'goal' : 'miss';
    
    let premio = 0;
    let premioGolDeOuro = 0;
    
    if (isGoal) {
      // Prêmio normal: R$5 fixo (independente do valor apostado)
      premio = 5.00;
      
      // Gol de Ouro: R$100 adicional
      if (isGolDeOuro) {
        premioGolDeOuro = 100.00;
        ultimoGolDeOuro = contadorChutesGlobal;
        console.log(`🏆 [GOL DE OURO] Chute #${contadorChutesGlobal} - Prêmio: R$ ${premioGolDeOuro}`);
      }
      // lote.status/ativo serão definidos após reserva de saldo e push
    }

    // Blindagem concorrência: reservar saldo com optimistic lock ANTES de avançar o lote (evita lost update)
    const novoSaldo = isGoal
      ? Number(user.saldo) - betAmount + premio + premioGolDeOuro
      : Number(user.saldo) - betAmount;
    const { data: updatedUser, error: saldoUpdateError } = await supabase
      .from('usuarios')
      .update({ saldo: novoSaldo })
      .eq('id', req.user.userId)
      .eq('saldo', user.saldo)
      .select('saldo')
      .single();
    if (saldoUpdateError || !updatedUser) {
      return res.status(409).json({
        success: false,
        message: 'Saldo insuficiente ou alterado. Tente novamente.'
      });
    }
    const saldoAposUpdate = Number(updatedUser.saldo);

    // Encerrar lote em memória se for goal (antes de push para o validador ver estado correto)
    if (isGoal) {
      lote.status = 'completed';
      lote.ativo = false;
    }

    // Adicionar chute ao lote
    const chute = {
      id: `${lote.id}_${shotIndex}`,
      userId: req.user.userId,
      direction: directionNormalized,
      amount: betAmount,
      result,
      premio,
      premioGolDeOuro,
      isGolDeOuro,
      shotIndex: shotIndex + 1,
      timestamp: new Date().toISOString()
    };
    lote.chutes.push(chute);
    lote.totalArrecadado += betAmount;
    lote.premioTotal += premio + premioGolDeOuro;

    // Validar integridade do lote após adicionar chute
    const postShotValidation = loteIntegrityValidator.validateAfterShot(lote, {
      result: result,
      premio: premio,
      premioGolDeOuro: premioGolDeOuro,
      timestamp: new Date().toISOString()
    });

    if (!postShotValidation.valid) {
      console.error('❌ [SHOOT] Problema de integridade após chute:', postShotValidation.error);
      await revertShootSaldoOptimistic(req.user.userId, user.saldo, updatedUser.saldo);
      lote.chutes.pop();
      lote.totalArrecadado -= betAmount;
      lote.premioTotal -= premio + premioGolDeOuro;
      if (isGoal) {
        lote.status = 'active';
        lote.ativo = true;
      }
      return res.status(400).json({
        success: false,
        message: postShotValidation.error
      });
    }

    // Salvar chute no banco de dados
    const { error: chuteError } = await supabase
      .from('chutes')
      .insert({
        usuario_id: req.user.userId,
        lote_id: lote.id,
        direcao: directionNormalized,
        valor_aposta: betAmount,
        resultado: result,
        premio: premio,
        premio_gol_de_ouro: premioGolDeOuro,
        is_gol_de_ouro: isGolDeOuro,
        contador_global: contadorChutesGlobal,
        shot_index: shotIndex + 1
      });

    if (chuteError) {
      await revertShootSaldoOptimistic(req.user.userId, user.saldo, updatedUser.saldo);
      lote.chutes.pop();
      lote.totalArrecadado -= betAmount;
      lote.premioTotal -= premio + premioGolDeOuro;
      if (isGoal) {
        lote.status = 'active';
        lote.ativo = true;
      }
      console.error('❌ [SHOOT] Erro ao salvar chute:', chuteError);
      return res.status(500).json({
        success: false,
        message: 'Falha ao registrar chute. Tente novamente.'
      });
    }

    // Verificar se lote está completo
    if (lote.chutes.length >= lote.config.size && lote.status !== 'completed') {
      lote.status = 'completed';
      lote.ativo = false;
      console.log(`🏆 [LOTE] Lote ${lote.id} completado: ${lote.chutes.length} chutes, R$${lote.totalArrecadado} arrecadado, R$${lote.premioTotal} em prêmios`);
    }

    const shootResult = {
      loteId: lote.id,
      direction: directionNormalized,
      amount: betAmount,
      result,
      premio,
      premioGolDeOuro,
      isGolDeOuro,
      contadorGlobal: contadorChutesGlobal,
      timestamp: new Date().toISOString(),
      playerId: req.user.userId,
      novoSaldo: saldoAposUpdate,
      loteProgress: {
        current: lote.chutes.length,
        total: lote.config.size,
        remaining: lote.config.size - lote.chutes.length
      },
      isLoteComplete: lote.status === 'completed'
    };

    if (idempotencyKey) {
      idempotencyProcessed.set(idempotencyKey, { ts: Date.now() });
    }

    console.log(`⚽ [SHOOT] Chute #${contadorChutesGlobal}: ${result} por usuário ${req.user.userId}`);
    res.status(200).json({
      success: true,
      data: shootResult
    });

  } catch (error) {
    console.error('❌ [SHOOT] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// SISTEMA DE SAQUES PIX COM VALIDAÇÃO
// =====================================================

// Solicitar saque PIX
app.post('/api/withdraw/request', authenticateToken, async (req, res) => {
  try {
    const { valor, chave_pix, tipo_chave } = req.body;
    const userId = req.user.userId;

    // Validar dados de entrada usando PixValidator
    const withdrawData = {
      amount: valor,
      pixKey: chave_pix,
      pixType: tipo_chave,
      userId: userId
    };

    const validation = await pixValidator.validateWithdrawData(withdrawData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    const valorSaque = parseFloat(valor);
    const taxa = parseFloat(process.env.PAGAMENTO_TAXA_SAQUE || '2.00');
    const valorLiquido = valorSaque - taxa;

    const preferAtomic = process.env.FINANCE_ATOMIC_RPC !== 'false';
    if (preferAtomic) {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('solicitar_saque_pix_atomico', {
        p_usuario_id: userId,
        p_amount: valorSaque,
        p_pix_key: validation.data.pixKey,
        p_pix_type: validation.data.pixType
      });
      if (!rpcErr && rpcData && typeof rpcData === 'object' && typeof rpcData.ok === 'boolean') {
        if (rpcData.ok) {
          console.log(
            `💰 [SAQUE] Atómico OK R$ ${valor} user=${userId} (líquido informativo R$ ${valorLiquido}, taxa R$ ${taxa})`
          );
          return res.status(201).json({
            success: true,
            message: 'Saque solicitado com sucesso',
            data: {
              id: rpcData.saque_id,
              amount: valor,
              pix_key: validation.data.pixKey,
              pix_type: validation.data.pixType,
              status: 'pending',
              created_at: rpcData.created_at || new Date().toISOString()
            }
          });
        }
        if (rpcData.reason === 'insufficient_funds') {
          return res.status(400).json({ success: false, message: 'Saldo insuficiente' });
        }
        if (rpcData.reason === 'user_not_found') {
          return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
        }
        if (rpcData.reason === 'saldo_race') {
          return res.status(409).json({
            success: false,
            message: 'Saldo insuficiente ou alterado. Tente novamente.'
          });
        }
        if (rpcData.reason === 'invalid_amount' || rpcData.reason === 'invalid_pix_fields') {
          return res.status(400).json({ success: false, message: 'Dados inválidos' });
        }
        console.error('❌ [SAQUE] RPC negado:', rpcData);
        return res.status(500).json({ success: false, message: 'Erro ao criar saque' });
      }
      const m = String(rpcErr?.message || '').toLowerCase();
      if (
        rpcErr &&
        (m.includes('does not exist') ||
          m.includes('schema cache') ||
          m.includes('42883') ||
          m.includes('pgrst202'))
      ) {
        console.warn('⚠️ [SAQUE] RPC solicitar_saque_pix_atomico indisponível — fallback JS');
      } else if (rpcErr) {
        console.error('❌ [SAQUE] Erro RPC:', rpcErr);
        return res.status(500).json({ success: false, message: 'Erro ao criar saque' });
      }
    }

    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', userId)
      .single();

    if (userError || !usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (parseFloat(usuario.saldo) < valorSaque) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    const saldoAtual = Number(usuario.saldo);
    const novoSaldo = saldoAtual - valorSaque;

    const { data: usuarioDebitado, error: debitoError } = await supabase
      .from('usuarios')
      .update({ saldo: novoSaldo })
      .eq('id', userId)
      .eq('saldo', usuario.saldo)
      .select('saldo')
      .single();

    if (debitoError || !usuarioDebitado) {
      return res.status(409).json({
        success: false,
        message: 'Saldo insuficiente ou alterado. Tente novamente.'
      });
    }

    const { data: saque, error: saqueError } = await supabase
      .from('saques')
      .insert(
        dualWriteSaqueRow({
          usuario_id: userId,
          amount: valorSaque,
          pix_key: validation.data.pixKey,
          pix_type: validation.data.pixType,
          status: 'pendente',
          created_at: new Date().toISOString()
        })
      )
      .select()
      .single();

    if (saqueError) {
      console.error('❌ [SAQUE] Erro ao criar saque:', saqueError);
      const { data: rollbackRow, error: rollbackError } = await supabase
        .from('usuarios')
        .update({ saldo: saldoAtual })
        .eq('id', userId)
        .eq('saldo', usuarioDebitado.saldo)
        .select('saldo')
        .single();
      if (rollbackError || !rollbackRow) {
        console.error(
          '❌ [SAQUE-ROLLBACK-CRITICO] Débito aplicado mas insert em saques falhou E rollback do saldo falhou. Playbook: verificar usuarios.saldo vs saques para usuario_id; corrigir saldo ou criar saque em conformidade.',
          JSON.stringify({
            tag: 'SAQUE_ROLLBACK_CRITICO',
            usuario_id: userId,
            valor_saque_brl: valorSaque,
            saldo_antes_debito: saldoAtual,
            saldo_apos_debito_esperado: usuarioDebitado.saldo,
            insert_saque_code: saqueError.code || null,
            insert_saque_message: saqueError.message || String(saqueError),
            rollback_error: rollbackError ? rollbackError.message : null,
            rollback_row_ok: Boolean(rollbackRow)
          })
        );
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar saque'
      });
    }

    console.log(`💰 [SAQUE] Saque solicitado (fallback JS): R$ ${valor} para usuário ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Saque solicitado com sucesso',
      data: {
        id: saque.id,
        amount: valor,
        pix_key: validation.data.pixKey,
        pix_type: validation.data.pixType,
        status: 'pending',
        created_at: saque.created_at
      }
    });

  } catch (error) {
    console.error('❌ [SAQUE] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar saques do usuário
app.get('/api/withdraw/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    const { data: saques, error: saquesError } = await supabase
      .from('saques')
      .select('*')
      .eq('usuario_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (saquesError) {
      console.error('❌ [SAQUE] Erro ao buscar saques:', saquesError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar histórico de saques'
      });
    }

    res.json({
      success: true,
      data: {
        saques: (saques || []).map((r) => normalizeSaqueRead(r)),
        total: saques?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ [SAQUE] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// SISTEMA DE PAGAMENTOS PIX CORRIGIDO
// =====================================================

// Criar pagamento PIX
app.post('/api/payments/pix/criar', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valor inválido'
      });
    }

    if (amount > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Valor máximo: R$ 1.000,00'
      });
    }

    // APENAS MERCADO PAGO REAL - SEM FALLBACK
    if (!mercadoPagoConnected) {
      return res.status(503).json({
        success: false,
        message: 'Sistema de pagamento temporariamente indisponível. Tente novamente em alguns minutos.'
      });
    }

    try {
      // Buscar dados completos do usuário
      const { data: userData, error: userDataError } = await supabase
        .from('usuarios')
        .select('email, username')
        .eq('id', req.user.userId)
        .single();

      const userName = userData?.username || '';
      const userEmail = userData?.email || req.user.email;

      // Preparar nome do comprador
      const names = userName.split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';

      // CPF opcional vindo do cliente; fallback seguro
      const payerCpf = (req.body && req.body.cpf) ? String(req.body.cpf).replace(/\\D/g, '') : '52998224725';

      const paymentData = {
        transaction_amount: parseFloat(amount),
        description: 'Depósito Gol de Ouro',
        payment_method_id: 'pix',
        payer: {
          email: userEmail,
          first_name: firstName,
          last_name: lastName,
          identification: {
            type: 'CPF',
            number: payerCpf // CPF obrigatório para produção
          }
        },
        external_reference: `goldeouro_${req.user.userId}_${Date.now()}`,
        statement_descriptor: 'GOL DE OURO',
        notification_url: `${process.env.BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev'}/api/payments/webhook`
      };

      // Gerar X-Idempotency-Key único
      // ✅ CORREÇÃO INSECURE RANDOMNESS: Usar crypto.randomBytes ao invés de Math.random()
      const randomBytes = crypto.randomBytes(6).toString('hex');
      const idempotencyKey = `pix_${req.user.userId}_${Date.now()}_${randomBytes}`;
      
      const response = await axios.post(
        'https://api.mercadopago.com/v1/payments',
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
            'Accept': 'application/json',
            'User-Agent': 'GolDeOuro/1.2.0'
          },
          timeout: 8000,
          maxRedirects: 3,
          validateStatus: (status) => status < 500
        }
      );

      const payment = response.data;
      if (!payment || !payment.id || !payment.point_of_interaction?.transaction_data?.qr_code) {
        throw new Error(`Resposta inválida do Mercado Pago: ${JSON.stringify(response.data || {})}`);
      }

      if (!dbConnected || !supabase) {
        console.error('❌ [PIX] MP criou cobrança mas Supabase indisponível mp_id=', payment.id);
        return res.status(503).json({
          success: false,
          message: 'Sistema temporariamente indisponível para registar o pagamento.'
        });
      }

      const { data: pixRecord, error: insertError } = await supabase
        .from('pagamentos_pix')
        .insert(
          dualWritePagamentoPixRow({
            usuario_id: req.user.userId,
            payment_id: String(payment.id),
            external_id: String(payment.id),
            amount: parseFloat(amount),
            status: 'pending',
            qr_code: payment.point_of_interaction?.transaction_data?.qr_code || null,
            qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
            pix_copy_paste: payment.point_of_interaction?.transaction_data?.qr_code || null
          })
        )
        .select()
        .single();

      if (insertError) {
        const mpIdStr = String(payment.id);
        console.error(
          '❌ [PIX-ORFAO-MP] Cobrança criada no Mercado Pago sem linha local em pagamentos_pix. Reconciliar manualmente pelo payment_id.',
          JSON.stringify({
            tag: 'PIX_ORFAO_MP',
            mercado_pago_payment_id: mpIdStr,
            usuario_id: req.user.userId,
            amount_brl: parseFloat(amount),
            supabase_code: insertError.code || null,
            supabase_message: insertError.message || String(insertError)
          })
        );
        return res.status(500).json({
          success: false,
          message:
            'O pagamento foi criado no provedor mas não foi possível registá-lo localmente. Contacte o suporte.',
          data: { mercado_pago_payment_id: payment.id }
        });
      }

      console.log(`💰 [PIX] PIX real criado: R$ ${amount} user=${req.user.userId} local_id=${pixRecord?.id || 'n/a'}`);

      res.json({
        success: true,
        message: 'PIX criado com sucesso!',
        data: {
          id: payment.id,
          amount: parseFloat(amount),
          qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
          pix_copy_paste: payment.point_of_interaction?.transaction_data?.qr_code,
          pix_code: payment.point_of_interaction?.transaction_data?.qr_code,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      });

    } catch (mpError) {
      const mpDetail = mpError?.response?.data || { message: mpError.message };
      console.error('❌ [PIX] Erro Mercado Pago:', mpDetail);
      // Modo diagnóstico opcional e temporário
      if (req.query?.debug === '1' || req.body?.debug === true) {
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar PIX (diagnóstico)',
          detalhe: mpDetail
        });
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar PIX. Tente novamente em alguns minutos.'
      });
    }

  } catch (error) {
    console.error('❌ [PIX] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Buscar pagamentos PIX do usuário
app.get('/api/payments/pix/usuario', authenticateToken, async (req, res) => {
  try {
    console.log(`🔍 [PIX] Buscando pagamentos para usuário: ${req.user.userId}`);
    
    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      console.log('❌ [PIX] Supabase não conectado');
      return res.status(503).json({ 
        success: false,
        message: 'Sistema temporariamente indisponível' 
      });
    }

    // Primeiro, verificar se a tabela existe tentando uma query simples
    const { data: testData, error: testError } = await supabase
      .from('pagamentos_pix')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ [PIX] Erro ao acessar tabela pagamentos_pix:', testError);
      console.error('❌ [PIX] Detalhes do erro:', {
        message: testError.message,
        details: testError.details,
        hint: testError.hint,
        code: testError.code
      });
      
      // Retornar lista vazia se a tabela não existir
      return res.json({
        success: true,
        data: {
          payments: [],
          total: 0,
          message: 'Nenhum pagamento encontrado'
        }
      });
    }

    // Buscar pagamentos do usuário
    const { data: payments, error: paymentsError } = await supabase
                .from('pagamentos_pix')
                .select('*')
      .eq('usuario_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (paymentsError) {
      console.error('❌ [PIX] Erro ao buscar pagamentos do usuário:', paymentsError);
      console.error('❌ [PIX] Detalhes do erro:', {
        message: paymentsError.message,
        details: paymentsError.details,
        hint: paymentsError.hint,
        code: paymentsError.code
      });
      
      // Retornar lista vazia em caso de erro
      return res.json({
        success: true,
        data: {
          payments: [],
          total: 0,
          message: 'Erro ao carregar pagamentos'
        }
      });
    }

    console.log(`✅ [PIX] ${payments?.length || 0} pagamentos encontrados para usuário ${req.user.userId}`);

    res.json({
      success: true,
      data: {
        payments: (payments || []).map((r) => normalizePagamentoPixRead(r)),
        total: payments?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ [PIX] Erro geral:', error);
    console.error('❌ [PIX] Stack trace:', error.stack);
    
    // Retornar lista vazia em caso de erro geral
    res.json({
      success: true,
      data: {
        payments: [],
        total: 0,
        message: 'Erro interno do servidor'
      }
    });
  }
});

/**
 * Fallback JS (várias idas ao PostgREST): claim approved antes do saldo — manter só se RPC ausente.
 * @param {string} paymentIdStr
 * @returns {Promise<{ ok: boolean, reason?: string }>}
 */
async function creditarPixAprovadoUnicoMpPaymentIdJsLegacy(paymentIdStr) {
  let { data: pix } = await supabase
    .from('pagamentos_pix')
    .select('id, usuario_id, amount, valor, status, external_id, payment_id')
    .eq('payment_id', paymentIdStr)
    .maybeSingle();
  if (!pix) {
    const alt = await supabase
      .from('pagamentos_pix')
      .select('id, usuario_id, amount, valor, status, external_id, payment_id')
      .eq('external_id', paymentIdStr)
      .maybeSingle();
    pix = alt.data;
  }
  if (!pix) {
    return { ok: false, reason: 'pix_not_found' };
  }
  pix = normalizePagamentoPixRead(pix);
  if (pix.status === 'approved') {
    return { ok: true, reason: 'already_processed' };
  }
  if (pix.status !== 'pending') {
    console.warn(`⚠️ [PIX-CREDIT] status inesperado em pagamentos_pix: ${pix.status} id=${pix.id}`);
    return { ok: false, reason: 'unexpected_status' };
  }
  const ts = new Date().toISOString();
  const { data: claimedRows, error: claimErr } = await supabase
    .from('pagamentos_pix')
    .update({ status: 'approved', updated_at: ts })
    .eq('id', pix.id)
    .eq('status', 'pending')
    .select('id, usuario_id, amount, valor');
  if (claimErr) {
    console.error('❌ [PIX-CREDIT] claim:', claimErr.message);
    return { ok: false, reason: 'claim_error' };
  }
  if (!claimedRows || claimedRows.length === 0) {
    return { ok: false, reason: 'claim_lost' };
  }
  const row = normalizePagamentoPixRead(claimedRows[0]);
  const credit = Number(row.amount ?? row.valor ?? 0);
  if (credit <= 0) {
    console.warn(`⚠️ [PIX-CREDIT] crédito zero, pix id=${row.id} mantido approved`);
    return { ok: true, reason: 'zero_credit' };
  }
  const { data: user, error: userErr } = await supabase
    .from('usuarios')
    .select('saldo')
    .eq('id', row.usuario_id)
    .single();
  if (userErr || !user) {
    console.error('❌ [PIX-CREDIT] usuário não encontrado:', userErr);
    await supabase
      .from('pagamentos_pix')
      .update({ status: 'pending', updated_at: ts })
      .eq('id', row.id)
      .eq('status', 'approved');
    return { ok: false, reason: 'user_not_found' };
  }
  const saldoAnt = user.saldo;
  const novoSaldo = Number(saldoAnt) + credit;
  const { data: updUser, error: saldoErr } = await supabase
    .from('usuarios')
    .update({ saldo: novoSaldo })
    .eq('id', row.usuario_id)
    .eq('saldo', saldoAnt)
    .select('saldo')
    .maybeSingle();
  if (saldoErr || !updUser) {
    console.error('❌ [PIX-CREDIT] lock otimista saldo:', saldoErr);
    await supabase
      .from('pagamentos_pix')
      .update({ status: 'pending', updated_at: ts })
      .eq('id', row.id)
      .eq('status', 'approved');
    return { ok: false, reason: 'saldo_race' };
  }
  console.log(`💰 [PIX-CREDIT] +R$ ${credit} usuario ${row.usuario_id} mp ${paymentIdStr} (fallback JS)`);
  return { ok: true, reason: 'credited' };
}

/**
 * Credita saldo no máximo uma vez por pagamento PIX. Preferência: RPC `creditar_pix_aprovado_mp`
 * (transação única: saldo + approved). Fallback: fluxo JS legado se RPC indisponível.
 * @param {string} paymentIdStr — ID MP (dígitos); lookup payment_id primeiro, external_id fallback
 */
async function creditarPixAprovadoUnicoMpPaymentId(paymentIdStr) {
  if (!dbConnected || !supabase) {
    return { ok: false, reason: 'no_db' };
  }
  const preferRpc = process.env.FINANCE_ATOMIC_RPC !== 'false';
  if (preferRpc) {
    const { data, error } = await supabase.rpc('creditar_pix_aprovado_mp', {
      p_payment_id: paymentIdStr
    });
    if (!error && data != null && typeof data === 'object' && typeof data.ok === 'boolean') {
      if (data.ok && data.reason === 'credited') {
        console.log(`💰 [PIX-CREDIT] RPC crédito OK mp ${paymentIdStr}`);
      }
      return { ok: data.ok, reason: data.reason };
    }
    if (error) {
      const m = String(error.message || '').toLowerCase();
      if (
        m.includes('does not exist') ||
        m.includes('schema cache') ||
        m.includes('42883') ||
        m.includes('pgrst202')
      ) {
        console.warn('⚠️ [PIX-CREDIT] RPC creditar_pix_aprovado_mp indisponível — fallback JS');
      } else {
        console.error('❌ [PIX-CREDIT] RPC:', error.message);
        return { ok: false, reason: 'rpc_error' };
      }
    } else {
      console.warn('⚠️ [PIX-CREDIT] resposta RPC inesperada — fallback JS');
    }
  }
  return creditarPixAprovadoUnicoMpPaymentIdJsLegacy(paymentIdStr);
}

// =====================================================
// WEBHOOK PIX CORRIGIDO
// =====================================================

// Webhook principal com validação de signature (modo permissivo para desenvolvimento/testes)
app.post('/api/payments/webhook', async (req, res, next) => {
  // Validar signature apenas se MERCADOPAGO_WEBHOOK_SECRET estiver configurado
  if (process.env.MERCADOPAGO_WEBHOOK_SECRET) {
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
  next();
}, async (req, res) => {
  try {
    const { type, data } = req.body;
    console.log('📨 [WEBHOOK] PIX recebido:', { type, data });
    
    res.status(200).json({ received: true }); // Responder imediatamente
    
    if (type === 'payment' && data?.id != null) {
      const paymentIdStr = String(data.id).trim();
      if (!/^\d+$/.test(paymentIdStr)) {
        console.error('❌ [WEBHOOK] ID de pagamento inválido:', data.id);
        return;
      }
      const paymentId = parseInt(paymentIdStr, 10);
      if (isNaN(paymentId) || paymentId <= 0) {
        console.error('❌ [WEBHOOK] ID de pagamento inválido (não é número positivo):', data.id);
        return;
      }
      const payment = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      if (payment.data.status !== 'approved') {
        return;
      }
      const creditResult = await creditarPixAprovadoUnicoMpPaymentId(paymentIdStr);
      if (creditResult.ok && creditResult.reason === 'already_processed') {
        console.log('📨 [WEBHOOK] Pagamento já processado:', paymentIdStr);
      } else if (!creditResult.ok && creditResult.reason && creditResult.reason !== 'claim_lost') {
        console.error('❌ [WEBHOOK] creditar PIX:', creditResult.reason, paymentIdStr);
      }
    }
  } catch (error) {
    console.error('❌ [WEBHOOK] Erro:', error);
  }
});

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

/** ID numérico do pagamento MP: payment_id canónico primeiro, external_id só se dígitos. */
function resolveMercadoPagoPaymentIdString(np) {
  const pid = np.payment_id != null ? String(np.payment_id).trim() : '';
  const ext = np.external_id != null ? String(np.external_id).trim() : '';
  if (/^\d+$/.test(pid)) return pid;
  if (/^\d+$/.test(ext)) return ext;
  return '';
}

/** Marca linha como fora do reconcile (legado / ID inválido). Requer coluna reconcile_skip (ver migração SQL). */
async function markPagamentoPixReconcileSkip(rowId, motivo, columnAvailable) {
  if (!supabase || rowId == null || columnAvailable === false) return;
  const { error } = await supabase
    .from('pagamentos_pix')
    .update({ reconcile_skip: true, updated_at: new Date().toISOString() })
    .eq('id', rowId);
  if (error) {
    console.warn('[RECON] não foi possível marcar reconcile_skip id=', rowId, motivo, error.message);
  } else {
    console.warn('[RECON] linha', rowId, 'excluída do reconcile automático:', motivo);
  }
}

async function reconcilePendingPayments() {
  if (reconciling) return;
  if (!dbConnected || !supabase || !mercadoPagoConnected) return;
  try {
    reconciling = true;
    const maxAgeMin = parseInt(process.env.MP_RECONCILE_MIN_AGE_MIN || '2', 10);
    const limit = parseInt(process.env.MP_RECONCILE_LIMIT || '10', 10);
    const sinceIso = new Date(Date.now() - maxAgeMin * 60 * 1000).toISOString();

    const selectCols =
      'id, usuario_id, external_id, payment_id, status, amount, valor, created_at, reconcile_skip';

    let reconcileSkipColumnAvailable = true;
    let { data: pendings, error: listError } = await supabase
      .from('pagamentos_pix')
      .select(selectCols)
      .eq('status', 'pending')
      .eq('reconcile_skip', false)
      .lt('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (
      listError &&
      /reconcile_skip|42703|column|schema cache|does not exist/i.test(
        `${listError.message || ''} ${listError.details || ''} ${listError.hint || ''}`
      )
    ) {
      reconcileSkipColumnAvailable = false;
      ({ data: pendings, error: listError } = await supabase
        .from('pagamentos_pix')
        .select('id, usuario_id, external_id, payment_id, status, amount, valor, created_at')
        .eq('status', 'pending')
        .lt('created_at', sinceIso)
        .order('created_at', { ascending: true })
        .limit(limit));
      if (!listError) {
        console.warn(
          '[RECON] Coluna reconcile_skip indisponível — listando todos os pending; aplique database/migrate-pagamentos-pix-reconcile-skip-2026-03-28.sql'
        );
      }
    }

    if (listError) {
      console.error('❌ [RECON] Erro ao listar pendentes:', listError.message);
      return;
    }
    if (!pendings || pendings.length === 0) return;

    for (const p of pendings) {
      const np = normalizePagamentoPixRead(p);
      const mpId = resolveMercadoPagoPaymentIdString(np);
      if (!mpId) {
        const hint = String(np.payment_id || np.external_id || '').slice(0, 80);
        console.warn(`[RECON] pending id=${p.id} sem ID MP numérico (legado):`, hint || '(vazio)');
        await markPagamentoPixReconcileSkip(p.id, 'non_numeric_mp_id', reconcileSkipColumnAvailable);
        continue;
      }

      const paymentId = parseInt(mpId, 10);
      if (isNaN(paymentId) || paymentId <= 0) {
        await markPagamentoPixReconcileSkip(p.id, 'invalid_positive_int', reconcileSkipColumnAvailable);
        continue;
      }

      try {
        const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
          timeout: 5000
        });
        const status = resp?.data?.status;
        if (status === 'approved') {
          const creditResult = await creditarPixAprovadoUnicoMpPaymentId(mpId);
          if (!creditResult.ok && creditResult.reason && creditResult.reason !== 'claim_lost') {
            console.error('❌ [RECON] creditar PIX:', creditResult.reason, mpId);
          } else if (creditResult.ok && creditResult.reason === 'credited') {
            console.log(`✅ [RECON] Pagamento ${mpId} aprovado e saldo aplicado ao usuário ${p.usuario_id}`);
          }
        }
      } catch (mpErr) {
        console.log(`⚠️ [RECON] Erro consultando MP ${mpId}:`, mpErr.response?.data || mpErr.message);
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

// Health check (com verificação ativa do banco)
// ✅ CORREÇÃO 404: Rotas para robots.txt e raiz
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nAllow: /');
});

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Gol de Ouro Backend API',
    version: '1.2.0',
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

app.get('/health', async (req, res) => {
  let dbStatus = dbConnected;
  try {
    if (!dbConnected) {
      await connectSupabase();
      dbStatus = dbConnected;
    }
    if (supabase) {
      // Ping leve ao banco
      const { error } = await supabase
        .from('usuarios')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      if (!error) dbStatus = true;
    }
  } catch (_) {
    dbStatus = false;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    database: dbStatus ? 'connected' : 'disconnected',
    mercadoPago: mercadoPagoConnected ? 'connected' : 'disconnected',
    contadorChutes: contadorChutesGlobal,
    ultimoGolDeOuro: ultimoGolDeOuro
  });
});

// Readiness check: 200 quando startup concluiu; 503 antes disso (não chama serviços pesados)
app.get('/ready', (req, res) => {
  if (isAppReady) {
    return res.status(200).json({ status: 'ready' });
  }
  res.status(503).json({ status: 'not ready' });
});

// Métricas globais
app.get('/api/metrics', async (req, res) => {
  try {
    // Métricas zeradas para produção real
    const metrics = {
      totalChutes: 0, // Zerado - sem dados simulados
      ultimoGolDeOuro: 0, // Zerado - sem dados simulados
      totalUsuarios: 0, // Será calculado apenas com usuários reais
      sistemaOnline: true,
      timestamp: new Date().toISOString()
    };

    // Se conectado ao banco, buscar dados adicionais
    if (dbConnected && supabase) {
      try {
        // Contar usuários
        const { count: userCount, error: userError } = await supabase
          .from('usuarios')
          .select('*', { count: 'exact', head: true });
        
        if (!userError) {
          metrics.totalUsuarios = userCount || 0;
        }

        // Buscar métricas do banco se existirem
        const { data: dbMetrics, error: metricsError } = await supabase
          .from('metricas_globais')
          .select('*')
          .eq('id', 1)
          .single();

        if (!metricsError && dbMetrics) {
          // Usar apenas dados reais verificados - zerar dados fantasmas
          metrics.totalChutes = 0; // Zerado até ter dados reais verificados
          metrics.ultimoGolDeOuro = 0; // Zerado até ter dados reais verificados
        }
      } catch (dbError) {
        console.log('⚠️ [METRICS] Usando métricas em memória devido a erro no banco:', dbError.message);
      }
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('❌ [METRICS] Erro:', error);
    res.status(500).json({
        success: false,
      message: 'Erro interno do servidor'
    });
  }
});

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

    // Conectar Supabase
    await connectSupabase();
    
    // Testar Mercado Pago
    await testMercadoPago();
    
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

// Endpoint de métricas avançadas
app.get('/api/monitoring/metrics', (req, res) => {
  try {
    // Atualizar métricas do sistema
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    monitoringMetrics.performance.memoryUsage = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
    monitoringMetrics.performance.cpuUsage = cpuUsage.user + cpuUsage.system;
    monitoringMetrics.performance.uptime = Math.round(process.uptime());
    
    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        metrics: monitoringMetrics,
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid
        }
      }
    });
  } catch (error) {
    console.error('❌ [MONITORING] Erro ao obter métricas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter métricas de monitoramento'
    });
  }
});

// Endpoint de health check avançado
app.get('/api/monitoring/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(process.uptime()),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      database: dbConnected,
      mercadoPago: mercadoPagoConnected,
      requests: monitoringMetrics.requests,
      version: '1.2.0'
    };
    
    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('❌ [MONITORING] Erro no health check:', error);
    res.status(500).json({
      success: false,
      message: 'Health check falhou'
    });
  }
});

// Endpoint /meta para compatibilidade com frontend
app.get('/meta', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        version: '1.2.0',
        build: '2025-10-21',
        environment: 'production',
        compatibility: {
          minVersion: '1.0.0',
          supported: true
        },
        features: {
          pix: true,
          goldenGoal: true,
          monitoring: true
        }
      }
    });
  } catch (error) {
    console.error('❌ [META] Erro no endpoint meta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao obter informações do sistema'
    });
  }
});

// Endpoint para alterar senha (após login)
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Senha atual e nova senha são obrigatórias'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nova senha deve ter pelo menos 6 caracteres'
      });
    }

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível' 
      });
    }

    // Buscar usuário atual
    const { data: user, error: userError } = await supabase
        .from('usuarios')
        .select('*')
      .eq('id', req.user.userId)
      .eq('ativo', true)
        .single();

    if (userError || !user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

    // Verificar senha atual
    const currentPasswordValid = await bcrypt.compare(currentPassword, user.senha_hash);
    if (!currentPasswordValid) {
      return res.status(401).json({
          success: false,
        message: 'Senha atual incorreta'
        });
      }

    // Gerar hash da nova senha
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Atualizar senha no banco
      const { error: updateError } = await supabase
        .from('usuarios')
      .update({ senha_hash: hashedNewPassword })
      .eq('id', user.id);

      if (updateError) {
      console.error('❌ [CHANGE-PASSWORD] Erro ao atualizar senha:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }

    // ✅ CORREÇÃO FORMAT STRING: Combinar string antes de logar
    const sanitizedEmailChangePassword = typeof user.email === 'string' ? user.email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '') : String(user.email);
    const logMessageChangePassword = `✅ [CHANGE-PASSWORD] Senha alterada para usuário: ${sanitizedEmailChangePassword}`;
    console.log(logMessageChangePassword);
    
    res.json({
      success: true,
      message: 'Senha alterada com sucesso'
    });
    
  } catch (error) {
    console.error('❌ [CHANGE-PASSWORD] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint /auth/login para compatibilidade (implementação direta)
app.post('/auth/login', async (req, res) => {
  console.log('🔄 [COMPATIBILITY] Endpoint /auth/login chamado diretamente');
  
  try {
    const { email, password } = req.body;
    
    // Validar entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }
    
    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({ 
        success: false,
        message: 'Sistema temporariamente indisponível' 
      });
    }
    
    // Buscar usuário no Supabase
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .eq('ativo', true)
      .single();
    
    if (userError || !user) {
      console.log('❌ [LOGIN] Usuário não encontrado:', email);
      return res.status(401).json({
      success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Verificar senha
    const senhaValida = await bcrypt.compare(password, user.senha_hash);
    if (!senhaValida) {
      console.log('❌ [LOGIN] Senha inválida para:', email);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }
    
    // Usuário deve depositar para ter saldo - sem crédito automático
    
    // Gerar token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ [LOGIN] Login realizado com sucesso:', email);
    
    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      token: token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        saldo: user.saldo,
        tipo: user.tipo
      }
    });
    
  } catch (error) {
    console.error('❌ [COMPATIBILITY] Erro no endpoint login:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// BOOTSTRAP ADMIN (one-shot) - promove o usuário autenticado a admin
// Somente se ainda não houver nenhum admin no sistema
// =====================================================
app.post('/api/admin/bootstrap', authenticateToken, async (req, res) => {
  try {
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }
    // Verificar se já existe algum admin
    const { count, error: countError } = await supabase
      .from('usuarios')
      .select('*', { count: 'exact', head: true })
      .eq('tipo', 'admin');
    if (countError) {
      console.error('❌ [ADMIN-BOOTSTRAP] Erro ao contar admins:', countError);
      return res.status(500).json({ success: false, message: 'Erro ao verificar admins' });
    }
    if ((count || 0) > 0) {
      return res.status(403).json({
        success: false,
        message: 'Já existe um administrador configurado'
      });
    }
    // Promover o usuário atual
    const { error: promoteError } = await supabase
      .from('usuarios')
      .update({ tipo: 'admin', updated_at: new Date().toISOString() })
      .eq('id', req.user.userId);
    if (promoteError) {
      console.error('❌ [ADMIN-BOOTSTRAP] Erro ao promover admin:', promoteError);
      return res.status(500).json({ success: false, message: 'Erro ao promover usuário' });
    }
    console.log(`🛡️ [ADMIN-BOOTSTRAP] Usuário ${req.user.userId} promovido a admin`);
    res.json({ success: true, message: 'Administrador criado com sucesso' });
  } catch (error) {
    console.error('❌ [ADMIN-BOOTSTRAP] Erro:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// =====================================================
// API ADMIN (painel Gol de Ouro) — header x-admin-token = ADMIN_TOKEN
// Montado após /api/admin/bootstrap para não interceptar o POST de bootstrap.
// =====================================================
const createAdminApiRouter = require('./routes/adminApiFly');
app.use(
  '/api/admin',
  createAdminApiRouter({
    getSupabase: () => supabase,
    isDbConnected: () => dbConnected,
    getQueueSnapshot: () => ({
      lotesAtivosCount: lotesAtivos.size,
      contadorChutesGlobal
    })
  })
);

// Endpoint para verificar se sistema está em produção real
app.get('/api/production-status', (req, res) => {
  try {
    const status = {
      isProductionMode: isProductionMode(),
      allowSimulatedData: false,
      requireRealDeposits: true,
      enableMockMode: false,
      timestamp: new Date().toISOString(),
      version: '1.2.0-production-real'
    };
    
    console.log('🔍 [PRODUCTION] Status verificado:', status);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ [PRODUCTION] Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao verificar status de produção'
    });
  }
});

// Endpoint de debug para verificar token (desativado em produção: 404 sem corpo sensível)
app.get('/api/debug/token', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.sendStatus(404);
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  console.log('🔍 [DEBUG] Headers recebidos:', req.headers);
  console.log('🔍 [DEBUG] Auth header:', authHeader);
  console.log('🔍 [DEBUG] Token extraído:', token);
  
  if (!token) {
    return res.status(401).json({
        success: false,
      message: 'Token não fornecido',
      debug: {
        authHeader,
        token,
        headers: req.headers
      }
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ [DEBUG] Token válido:', decoded);
    
    res.json({
      success: true,
      message: 'Token válido',
      debug: {
        decoded,
        authHeader,
        token: token.substring(0, 20) + '...'
      }
    });
  } catch (error) {
    console.log('❌ [DEBUG] Token inválido:', error.message);
    res.status(403).json({
        success: false,
      message: 'Token inválido',
      debug: {
        error: error.message,
        authHeader,
        token: token.substring(0, 20) + '...'
      }
    });
  }
});

// Endpoint /usuario/perfil para compatibilidade (implementação direta)
app.get('/usuario/perfil', authenticateToken, async (req, res) => {
  console.log('🔄 [COMPATIBILITY] Endpoint /usuario/perfil chamado diretamente');
  
  try {
    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({ 
        success: false,
        message: 'Sistema temporariamente indisponível' 
      });
    }

    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id', req.user.userId)
      .eq('ativo', true)
      .single();

    if (userError) {
      console.error('❌ [PERFIL] Erro ao buscar usuário:', userError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao carregar perfil do usuário'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    console.log('✅ [PERFIL] Usuário encontrado:', user.email);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          saldo: user.saldo,
          tipo: user.tipo,
          total_apostas: user.total_apostas,
          total_ganhos: user.total_ganhos,
          created_at: user.created_at
        }
      }
    });
  } catch (error) {
    console.error('❌ [COMPATIBILITY] Erro no endpoint perfil:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// Endpoint /api/fila/entrar para compatibilidade
app.get('/api/fila/entrar', authenticateToken, async (req, res) => {
  console.log('🔄 [COMPATIBILITY] Endpoint /api/fila/entrar chamado');
  
  try {
    // Simular entrada na fila (implementação básica)
    res.json({
      success: true,
      data: {
        message: 'Entrada na fila realizada com sucesso',
        // ✅ CORREÇÃO INSECURE RANDOMNESS: Usar crypto.randomInt ao invés de Math.random()
        position: crypto.randomInt(1, 11), // 1 a 10
        estimatedWait: crypto.randomInt(1, 6) // 1 a 5
      }
    });
  } catch (error) {
    console.error('❌ [COMPATIBILITY] Erro no endpoint fila:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

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
      console.log(`❌ [404] Rota não encontrada: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        path: req.originalUrl,
        method: req.method
      });
    });
    
    // Iniciar servidor HTTP e WebSocket
    const server = http.createServer(app);
    httpServer = server;
    const wss = new WebSocketManager(server);
    server.listen(PORT, '0.0.0.0', () => {
      isAppReady = true;
      console.log(`🚀 [SERVER] Servidor iniciado na porta ${PORT}`);
      console.log(`🌐 [SERVER] Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 [SERVER] Supabase: ${dbConnected ? 'Conectado' : 'Desconectado'}`);
      console.log(`💳 [SERVER] Mercado Pago: ${mercadoPagoConnected ? 'Conectado' : 'Desconectado'}`);
      console.log('✅ [SERVER] Sistema de monitoramento desabilitado temporariamente');
    });
    
  } catch (error) {
    console.error('❌ [SERVER] Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

// Graceful shutdown: SIGTERM (Fly.io/k8s) e SIGINT (Ctrl+C)
function gracefulShutdown(signal) {
  console.log(`🛑 [SERVER] ${signal} recebido; encerrando conexões...`);
  if (httpServer) {
    httpServer.close(() => {
      console.log('✅ [SERVER] Servidor encerrado.');
      process.exit(0);
    });
    // Fallback: se close demorar, forçar saída após 10s
    setTimeout(() => {
      console.warn('⚠️ [SERVER] Timeout no shutdown; encerrando.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// =====================================================
// SERVIDOR SIMPLIFICADO v1.2.0 - DEPLOY FUNCIONAL
// =====================================================
