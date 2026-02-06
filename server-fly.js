// @ts-check
// SERVIDOR SIMPLIFICADO - GOL DE OURO v1.2.1 - DEPLOY FUNCIONAL
// ==============================================================
// Data: 21/10/2025
// Status: SERVIDOR SIMPLIFICADO PARA DEPLOY
// Versão: v1.2.1-deploy-functional
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
const { createPixWithdraw } = require('./services/pix-mercado-pago');
const {
  payoutCounters,
  createLedgerEntry,
  rollbackWithdraw,
  processPendingWithdrawals
} = require('./src/domain/payout/processPendingWithdrawals');
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
  { onlyInProduction: ['MERCADOPAGO_DEPOSIT_ACCESS_TOKEN'] }
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

const runProcessPendingWithdrawals = async () => {
  const payoutEnabled = String(process.env.PAYOUT_PIX_ENABLED || '').toLowerCase() === 'true';
  return processPendingWithdrawals({
    supabase,
    isDbConnected: dbConnected,
    payoutEnabled,
    createPixWithdraw
  });
};

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

const mercadoPagoAccessToken = process.env.MERCADOPAGO_DEPOSIT_ACCESS_TOKEN;
let mercadoPagoConnected = false;

// Testar Mercado Pago
async function testMercadoPago() {
  if (!mercadoPagoAccessToken) {
    console.log('⚠️ [MERCADO-PAGO][DEPOSIT] Token de depósito não configurado');
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
  contentSecurityPolicy: false,
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

app.use(cors({
  origin: parseCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
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
  skip: (req) => req.path === '/login',
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
      // ✅ CORREÇÃO INSECURE RANDOMNESS: Usar crypto.randomInt ao invés de Math.random()
      winnerIndex: crypto.randomInt(0, config.size), // CORRIGIDO: Aleatório seguro por lote
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
    
    // ✅ CORREÇÃO STRING ESCAPING: Sanitizar dados antes de usar em logs
    const sanitizedEmail = typeof email === 'string' ? email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '') : String(email);
    const sanitizedToken = typeof resetToken === 'string' ? resetToken.substring(0, 20) + '...' : '***';
    
    // ✅ CORREÇÃO FORMAT STRING: Combinar mensagem e variáveis em string única antes de logar
    if (emailResult.success) {
      const logMessage = `📧 [FORGOT-PASSWORD] Email enviado para ${sanitizedEmail}: ${emailResult.messageId}`;
      console.log(logMessage);
    } else {
      const logMessage = `⚠️ [FORGOT-PASSWORD] Falha ao enviar email para ${sanitizedEmail}: ${emailResult.error}`;
      console.log(logMessage);
      // Logar token como fallback (truncado por segurança)
      const tokenMessage = `🔗 [FORGOT-PASSWORD] Link de recuperação: https://goldeouro.lol/reset-password?token=${sanitizedToken}`;
      console.log(tokenMessage);
    }

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

    // Marcar token como usado
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token);

    if (markUsedError) {
      console.error('❌ [RESET-PASSWORD] Erro ao marcar token como usado:', markUsedError);
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
    const { email, password, username } = req.body;

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
                total_ganhos: user.total_ganhos
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
        total_ganhos: 0.00
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
        tipo: newUser.tipo
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

// ⚠️ REGRA V1:
// Qualquer alteração neste endpoint exige passar no teste de login feliz.
// Não remover @ts-check desta seção.
// Login de usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    /**
     * @param {{ email: string, password: string }} body
     */
    const { email, password } = /** @type {{ email: string, password: string }} */ (req.body);
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email e senha são obrigatórios'
      });
    }

    /** @type {string} */
    const sanitizedEmailLogin = email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '');

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    // Buscar usuário
    let user;
    let userError;
    try {
      const result = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('ativo', true)
        .single();
      user = result.data;
      userError = result.error;
    } catch (supabaseError) {
      console.error('❌ [LOGIN] Erro Supabase:', supabaseError?.message || supabaseError);
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    if (userError || !user) {
      // ✅ CORREÇÃO FORMAT STRING: Combinar string antes de logar
      const logMessageLoginNotFound = `❌ [LOGIN] Usuário não encontrado: ${sanitizedEmailLogin}`;
      console.log(logMessageLoginNotFound);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

    // Verificar senha
    if (!user.senha_hash || typeof user.senha_hash !== 'string') {
      const logMessageInvalidPassword = `❌ [LOGIN] Senha inválida para: ${sanitizedEmailLogin}`;
      console.log(logMessageInvalidPassword);
      return res.status(401).json({
        success: false,
        message: 'Credenciais inválidas'
      });
    }

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
    /** @type {{ userId: string, email: string, username: string }} */
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      username: user.username
    };
    const token = jwt.sign(
      tokenPayload,
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
        total_ganhos: user.total_ganhos
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

// Endpoint para chutar
app.post('/api/games/shoot', authenticateToken, async (req, res) => {
  try {
    const { direction, amount } = req.body;
    
    // Validar entrada
    if (!direction || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Direção e valor são obrigatórios'
      });
    }

    // Validar valor de aposta
    if (!batchConfigs[amount]) {
      return res.status(400).json({
        success: false,
        message: 'Valor de aposta inválido. Use: 1, 2, 5 ou 10'
      });
    }

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
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

    if (user.saldo < amount) {
      return res.status(400).json({
      success: false,
        message: 'Saldo insuficiente'
      });
    }

    // Obter ou criar lote para este valor
    const lote = getOrCreateLoteByValue(amount);
    
    // Validar integridade do lote antes de processar chute
    const integrityValidation = loteIntegrityValidator.validateBeforeShot(lote, {
      direction: direction,
      amount: amount,
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
      
      // Encerrar o lote imediatamente após o gol (um vencedor por lote)
      // Isso evita novos chutes no mesmo lote e alinha com o validador de integridade.
      lote.status = 'completed';
      lote.ativo = false;
    }
    
    // Adicionar chute ao lote
    const chute = {
      id: `${lote.id}_${shotIndex}`,
      // Campo esperado pelo validador
      userId: req.user.userId,
      direction,
      amount,
      result,
      premio,
      premioGolDeOuro,
      isGolDeOuro,
      shotIndex: shotIndex + 1,
      timestamp: new Date().toISOString()
    };
    
    lote.chutes.push(chute);
    lote.totalArrecadado += amount;
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
      // Reverter chute do lote
      lote.chutes.pop();
      lote.totalArrecadado -= amount;
      lote.premioTotal -= premio + premioGolDeOuro;
      return res.status(400).json({
        success: false,
        message: postShotValidation.error
      });
    }

    // Salvar chute no banco de dados (usar tabela 'chutes' para acionar gatilhos de métricas/saldo)
    const { error: chuteError } = await supabase
      .from('chutes')
      .insert({
        usuario_id: req.user.userId,
        lote_id: lote.id,
        direcao: direction,
        valor_aposta: amount,
        resultado: result,
        premio: premio,
        premio_gol_de_ouro: premioGolDeOuro,
        is_gol_de_ouro: isGolDeOuro,
        contador_global: contadorChutesGlobal,
        shot_index: shotIndex + 1
      });

    if (chuteError) {
      console.error('❌ [SHOOT] Erro ao salvar chute:', chuteError);
    }

    // Verificar se lote está completo
    // Já encerrado em caso de gol, mas mantém fechamento por tamanho para consistência
    if (lote.chutes.length >= lote.config.size && lote.status !== 'completed') {
      lote.status = 'completed';
      // Desativar para o validador entender que não aceita mais chutes
      lote.ativo = false;
      console.log(`🏆 [LOTE] Lote ${lote.id} completado: ${lote.chutes.length} chutes, R$${lote.totalArrecadado} arrecadado, R$${lote.premioTotal} em prêmios`);
    }
    
    const shootResult = {
      loteId: lote.id,
      direction,
      amount,
      result,
      premio,
      premioGolDeOuro,
      isGolDeOuro,
      contadorGlobal: contadorChutesGlobal,
      timestamp: new Date().toISOString(),
      playerId: req.user.userId,
      loteProgress: {
        current: lote.chutes.length,
        total: lote.config.size,
        remaining: lote.config.size - lote.chutes.length
      },
      isLoteComplete: lote.status === 'completed'
    };

    // Ajuste de saldo:
    // - Perdas: gatilho do banco subtrai 'valor_aposta' automaticamente
    // - Vitórias: gatilho do banco credita apenas o prêmio (premio + premioGolDeOuro)
    //   Para manter a economia esperada (todos pagam a aposta), subtrair manualmente
    //   o valor da aposta apenas quando houver gol (evita dupla cobrança nas derrotas).
    if (isGoal) {
      const novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro;
      const { error: saldoWinnerError } = await supabase
        .from('usuarios')
        .update({ saldo: novoSaldoVencedor })
        .eq('id', req.user.userId);
      if (saldoWinnerError) {
        console.error('❌ [SHOOT] Erro ao ajustar saldo do vencedor:', saldoWinnerError);
      } else {
        shootResult.novoSaldo = novoSaldoVencedor;
      }
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
    const correlationId = String(
      req.headers['x-idempotency-key'] ||
      req.headers['x-correlation-id'] ||
      crypto.randomUUID()
    );

    console.log(`🔄 [SAQUE] Início`, { userId, correlationId });

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

    const minWithdrawAmount = 10.00;
    const requestedAmount = parseFloat(valor);
    if (requestedAmount < minWithdrawAmount) {
      return res.status(400).json({
        success: false,
        message: `Valor mínimo para saque é R$ ${minWithdrawAmount.toFixed(2)}`
      });
    }

    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    // Idempotência por correlation_id (se já existe, retornar o saque existente)
    const { data: existingWithdraw, error: existingWithdrawError } = await supabase
      .from('saques')
      .select('id, amount, valor, fee, net_amount, pix_key, pix_type, chave_pix, tipo_chave, status, created_at, correlation_id')
      .eq('correlation_id', correlationId)
      .maybeSingle();

    if (existingWithdrawError) {
      console.error('❌ [SAQUE] Erro ao verificar idempotência:', existingWithdrawError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar idempotência do saque'
      });
    }

    if (existingWithdraw?.id) {
      console.log(`✅ [SAQUE] Idempotência - saque já existente`, { userId, correlationId, saqueId: existingWithdraw.id });
      return res.status(200).json({
        success: true,
        message: 'Saque solicitado com sucesso',
        data: {
          id: existingWithdraw.id,
          amount: existingWithdraw.amount ?? existingWithdraw.valor,
          fee: existingWithdraw.fee ?? null,
          net_amount: existingWithdraw.net_amount ?? null,
          pix_key: existingWithdraw.pix_key ?? existingWithdraw.chave_pix,
          pix_type: existingWithdraw.pix_type ?? existingWithdraw.tipo_chave,
          status: existingWithdraw.status,
          created_at: existingWithdraw.created_at,
          correlation_id: existingWithdraw.correlation_id
        }
      });
    }

    // Bloquear saque duplicado pendente
    const { data: pendingWithdrawals, error: pendingError } = await supabase
      .from('saques')
      .select('id, status')
      .eq('usuario_id', userId)
      .in('status', ['pendente', 'pending'])
      .limit(1);

    if (pendingError) {
      console.error('❌ [SAQUE] Erro ao verificar saques pendentes:', pendingError);
      return res.status(500).json({
        success: false,
        message: 'Erro ao verificar saques pendentes'
      });
    }

    if (pendingWithdrawals && pendingWithdrawals.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Já existe um saque pendente em processamento'
      });
    }

    // Verificar saldo do usuário
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

    if (parseFloat(usuario.saldo) < requestedAmount) {
      return res.status(400).json({
        success: false,
        message: 'Saldo insuficiente'
      });
    }

    // Calcular taxa de saque
    const taxa = parseFloat(process.env.PAGAMENTO_TAXA_SAQUE || '2.00');
    const valorLiquido = requestedAmount - taxa;
    if (valorLiquido <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valor líquido inválido para saque'
      });
    }

    // Debitar saldo do usuário (com verificação de concorrência)
    const novoSaldo = parseFloat(usuario.saldo) - requestedAmount;
    const { data: saldoAtualizado, error: saldoUpdateError } = await supabase
      .from('usuarios')
      .update({ saldo: novoSaldo, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .eq('saldo', usuario.saldo)
      .select('saldo')
      .single();

    if (saldoUpdateError || !saldoAtualizado) {
      console.error('❌ [SAQUE] Erro ao debitar saldo:', saldoUpdateError);
      return res.status(409).json({
        success: false,
        message: 'Saldo atualizado recentemente. Tente novamente.'
      });
    }

    // Criar saque no banco (schema padronizado)
    const { data: saque, error: saqueError } = await supabase
      .from('saques')
      .insert({
        usuario_id: userId,
        // Compatibilidade com esquemas antigos e novos
        valor: requestedAmount, // alguns schemas usam 'valor'
        amount: requestedAmount,
        fee: taxa,
        net_amount: valorLiquido,
        correlation_id: correlationId,
        // colunas novas
        pix_key: validation.data.pixKey,
        pix_type: validation.data.pixType,
        // colunas legadas
        chave_pix: validation.data.pixKey,
        tipo_chave: validation.data.pixType,
        // status compatível com ambos esquemas (aceita 'pendente' sem CHECK no novo; requerido no antigo)
        status: 'pendente',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (saqueError) {
      console.error('❌ [SAQUE] Erro ao criar saque:', saqueError);
      // Reverter débito de saldo em caso de falha
      const rollback = await supabase
        .from('usuarios')
        .update({ saldo: usuario.saldo, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (rollback.error) {
        console.error('❌ [SAQUE] Falha ao reverter saldo:', rollback.error);
      }
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar saque'
      });
    }

    const ledgerDebit = await createLedgerEntry({
      supabase,
      tipo: 'saque',
      usuarioId: userId,
      valor: requestedAmount,
      referencia: saque.id,
      correlationId
    });

    if (!ledgerDebit.success) {
      console.error('❌ [SAQUE] Erro ao registrar ledger (saque):', ledgerDebit.error);
      await rollbackWithdraw({
        supabase,
        saqueId: saque.id,
        userId,
        correlationId,
        amount: requestedAmount,
        fee: taxa,
        motivo: 'Erro ao registrar ledger do saque'
      });
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar saque'
      });
    }

    const ledgerFee = await createLedgerEntry({
      supabase,
      tipo: 'taxa',
      usuarioId: userId,
      valor: taxa,
      referencia: `${saque.id}:fee`,
      correlationId
    });

    if (!ledgerFee.success) {
      console.error('❌ [SAQUE] Erro ao registrar ledger (taxa):', ledgerFee.error);
      await rollbackWithdraw({
        supabase,
        saqueId: saque.id,
        userId,
        correlationId,
        amount: requestedAmount,
        fee: taxa,
        motivo: 'Erro ao registrar ledger da taxa'
      });
      return res.status(500).json({
        success: false,
        message: 'Erro ao registrar saque'
      });
    }

    // Transação contábil: delegada para processador externo/contábil (removida do backend direto)

    console.log(`✅ [SAQUE] Sucesso`, { saqueId: saque.id, userId, correlationId });

    res.status(201).json({
      success: true,
      message: 'Saque solicitado com sucesso',
      data: {
        id: saque.id,
        amount: requestedAmount,
        fee: taxa,
        net_amount: valorLiquido,
        pix_key: validation.data.pixKey,
        pix_type: validation.data.pixType,
        status: 'pending',
        created_at: saque.created_at,
        correlation_id: correlationId
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

    const historico = (saques || []).map((row) => ({
      id: row.id,
      valor: row.valor ?? row.amount ?? 0,
      amount: row.amount ?? row.valor ?? 0,
      fee: row.fee ?? row.taxa ?? null,
      net_amount: row.net_amount ?? row.valor_liquido ?? null,
      status: row.status,
      pix_key: row.pix_key ?? row.chave_pix ?? null,
      pix_type: row.pix_type ?? row.tipo_chave ?? null,
      created_at: row.created_at
    }));

    res.json({
      success: true,
      data: {
        saques: historico,
        total: historico.length
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
    if (!mercadoPagoAccessToken) {
      console.log('⚠️ [PIX][DEPOSIT] Token de depósito não configurado');
      return res.status(503).json({
        success: false,
        message: 'Sistema de pagamento temporariamente indisponível. Tente novamente em alguns minutos.'
      });
    }

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
            'Authorization': `Bearer ${mercadoPagoAccessToken}`,
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
      
      // Salvar no banco de dados
      if (dbConnected && supabase) {
        const { data: pixRecord, error: insertError } = await supabase
          .from('pagamentos_pix')
          .insert({
            usuario_id: req.user.userId,
            external_id: String(payment.id),
            payment_id: String(payment.id),
            amount: parseFloat(amount),
            valor: parseFloat(amount),
            status: 'pending',
            qr_code: payment.point_of_interaction?.transaction_data?.qr_code || null,
            qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
            pix_copy_paste: payment.point_of_interaction?.transaction_data?.qr_code || null
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ [PIX] Erro ao salvar no banco:', insertError);
        }
      }

      console.log(`💰 [PIX] PIX real criado: R$ ${amount} para usuário ${req.user.userId}`);

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
        payments: payments || [],
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
    
    if (type === 'payment' && data?.id) {
      // Verificar se já foi processado (idempotência)
      let { data: existingPayment, error: checkError } = await supabase
        .from('pagamentos_pix')
        .select('id, status')
        .eq('external_id', data.id)
        .maybeSingle();
      if ((!existingPayment || checkError) && (!existingPayment?.id)) {
        // fallback por payment_id (schemas legados)
        const alt = await supabase
          .from('pagamentos_pix')
          .select('id, status')
          .eq('payment_id', String(data.id))
          .maybeSingle();
        existingPayment = alt.data;
      }
        
      if (existingPayment && existingPayment.status === 'approved') {
        console.log('📨 [WEBHOOK] Pagamento já processado:', data.id);
        return;
      }
      
      // ✅ CORREÇÃO SSRF: Validar data.id antes de usar na URL
      if (!data.id || typeof data.id !== 'string' || !/^\d+$/.test(data.id)) {
        console.error('❌ [WEBHOOK] ID de pagamento inválido:', data.id);
        return;
      }
      
      const paymentId = parseInt(data.id, 10);
      if (isNaN(paymentId) || paymentId <= 0) {
        console.error('❌ [WEBHOOK] ID de pagamento inválido (não é número positivo):', data.id);
        return;
      }
      
      if (!mercadoPagoAccessToken) {
        console.log('⚠️ [PIX][DEPOSIT] Token de depósito não configurado');
        return;
      }

      // Verificar pagamento no Mercado Pago
      const payment = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { 
          headers: { 
            'Authorization': `Bearer ${mercadoPagoAccessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      if (payment.data.status === 'approved') {
        // Claim atômico: atualizar para approved SOMENTE se ainda não estiver approved; creditar saldo APENAS se exatamente 1 linha afetada
        let claimed = null;
        const { data: claimByPaymentId, error: claimErr1 } = await supabase
          .from('pagamentos_pix')
          .update({ status: 'approved', updated_at: new Date().toISOString() })
          .eq('payment_id', String(data.id))
          .neq('status', 'approved')
          .select('id, usuario_id, amount, valor');
        if (!claimErr1 && claimByPaymentId && claimByPaymentId.length === 1) {
          claimed = claimByPaymentId[0];
        }
        if (!claimed) {
          const { data: claimByExternalId, error: claimErr2 } = await supabase
            .from('pagamentos_pix')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('external_id', String(data.id))
            .neq('status', 'approved')
            .select('id, usuario_id, amount, valor');
          if (!claimErr2 && claimByExternalId && claimByExternalId.length === 1) {
            claimed = claimByExternalId[0];
          }
        }
        if (!claimed) {
          console.log('📨 [WEBHOOK] Claim perdeu: pagamento já processado ou não encontrado:', data.id);
          return;
        }
        {
          const pixRecord = claimed;
          const { data: user, error: userError } = await supabase
            .from('usuarios')
            .select('saldo')
            .eq('id', pixRecord.usuario_id)
            .single();
          if (userError || !user) {
            console.error('❌ [WEBHOOK] Erro ao buscar usuário:', userError);
            return;
          }
          const credit = pixRecord.amount ?? pixRecord.valor ?? 0;
          const novoSaldo = user.saldo + credit;
          const { error: saldoError } = await supabase
            .from('usuarios')
            .update({ saldo: novoSaldo })
            .eq('id', pixRecord.usuario_id);
          if (saldoError) {
            console.error('❌ [WEBHOOK] Erro ao atualizar saldo:', saldoError);
            return;
          }
          console.log('💰 [WEBHOOK] Claim ganhou: pagamento aprovado e saldo creditado:', data.id);
        }
      }
    }
  } catch (error) {
    console.error('❌ [WEBHOOK] Erro:', error);
  }
});

// =====================================================
// WEBHOOK MERCADO PAGO - Payout PIX (Transfers)
// =====================================================
app.post('/webhooks/mercadopago', async (req, res) => {
  try {
    console.log('🟦 [WEBHOOK][MP] recebido', {
      body: req.body
    });

    res.status(200).json({ received: true });

    const payload = req.body || {};
    const statusRaw = payload.status || payload?.data?.status || payload?.data?.payment?.status;
    const externalReference =
      payload.external_reference ||
      payload?.data?.external_reference ||
      payload?.data?.payment?.external_reference;
    const payoutId = payload.id || payload?.data?.id || payload?.data?.transfer_id;

    if (!statusRaw || !externalReference) {
      console.warn('⚠️ [WEBHOOK][MP] Payload incompleto', { statusRaw, externalReference, payoutId });
      return;
    }

    const [saqueId, correlationId] = String(externalReference).split('_');
    if (!saqueId || !correlationId) {
      console.warn('⚠️ [WEBHOOK][MP] external_reference inválido', { externalReference });
      return;
    }

    const payoutEnabled = String(process.env.PAYOUT_PIX_ENABLED || '').toLowerCase() === 'true';
    if (!payoutEnabled) {
      console.warn('⚠️ [WEBHOOK][MP] PAYOUT_PIX_ENABLED=false, ignorando confirmação', {
        saqueId,
        correlationId
      });
      return;
    }

    if (!dbConnected || !supabase) {
      console.error('❌ [WEBHOOK][MP] Supabase indisponível');
      return;
    }

    const { data: saqueRow, error: saqueError } = await supabase
      .from('saques')
      .select('id, usuario_id, status, amount, valor, fee, net_amount, correlation_id')
      .eq('id', saqueId)
      .maybeSingle();

    if (saqueError || !saqueRow) {
      console.error('❌ [WEBHOOK][MP] Saque não encontrado', { saqueId, saqueError });
      return;
    }

    if (String(saqueRow.correlation_id) !== String(correlationId)) {
      console.warn('⚠️ [WEBHOOK][MP] correlation_id divergente', {
        saqueId,
        correlationId,
        correlation_db: saqueRow.correlation_id
      });
      return;
    }

    if (['processado', 'falhou'].includes(String(saqueRow.status))) {
      console.log('ℹ️ [WEBHOOK][MP] Saque já finalizado', {
        saqueId,
        status: saqueRow.status
      });
      return;
    }

    const { data: existingLedger, error: ledgerError } = await supabase
      .from('ledger_financeiro')
      .select('id, tipo')
      .eq('correlation_id', correlationId)
      .eq('referencia', saqueId)
      .in('tipo', ['payout_confirmado', 'falha_payout'])
      .maybeSingle();

    if (ledgerError) {
      console.error('❌ [WEBHOOK][MP] Erro ao verificar idempotência', ledgerError);
      return;
    }
    if (existingLedger?.id) {
      console.log('ℹ️ [WEBHOOK][MP] Evento duplicado ignorado', {
        saqueId,
        correlationId,
        tipo: existingLedger.tipo
      });
      return;
    }

    const normalizedStatus = String(statusRaw).toLowerCase();
    const amount = parseFloat(saqueRow.amount ?? saqueRow.valor ?? 0);
    const fee = parseFloat(saqueRow.fee ?? 0);
    const netAmount = parseFloat(saqueRow.net_amount ?? (amount - fee));

    if (['approved', 'credited'].includes(normalizedStatus)) {
      const ledgerPayout = await createLedgerEntry({
        supabase,
        tipo: 'payout_confirmado',
        usuarioId: saqueRow.usuario_id,
        valor: netAmount,
        referencia: saqueId,
        correlationId
      });

      if (!ledgerPayout.success) {
        console.error('❌ [WEBHOOK][MP] Falha ao registrar payout_confirmado', ledgerPayout.error);
        return;
      }

      await supabase.from('saques').update({ status: 'processado' }).eq('id', saqueId);
      payoutCounters.success++;
      console.log('✅ [PAYOUT][CONFIRMADO]', {
        saqueId,
        userId: saqueRow.usuario_id,
        correlationId,
        payoutId,
        status_original_do_provedor: normalizedStatus
      });
      return;
    }

    if (normalizedStatus === 'in_process') {
      await supabase.from('saques').update({ status: 'aguardando_confirmacao' }).eq('id', saqueId);
      console.warn('⚠️ [PAYOUT][EM_PROCESSAMENTO]', {
        saqueId,
        userId: saqueRow.usuario_id,
        correlationId,
        payoutId,
        status_original_do_provedor: normalizedStatus
      });
      return;
    }

    if (['rejected', 'cancelled'].includes(normalizedStatus)) {
      await createLedgerEntry({
        supabase,
        tipo: 'falha_payout',
        usuarioId: saqueRow.usuario_id,
        valor: netAmount,
        referencia: saqueId,
        correlationId
      });

      await rollbackWithdraw({
        supabase,
        saqueId,
        userId: saqueRow.usuario_id,
        correlationId,
        amount,
        fee,
        motivo: `payout ${normalizedStatus}`
      });
      payoutCounters.fail++;
      console.error('❌ [PAYOUT][REJEITADO] rollback acionado', {
        saqueId,
        userId: saqueRow.usuario_id,
        correlationId,
        payoutId,
        status_original_do_provedor: normalizedStatus
      });
      return;
    }

    console.warn('⚠️ [WEBHOOK][MP] Status não tratado', {
      saqueId,
      correlationId,
      payoutId,
      status_original_do_provedor: normalizedStatus
    });
  } catch (error) {
    console.error('❌ [WEBHOOK][MP] Erro inesperado:', error);
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
async function reconcilePendingPayments() {
  if (reconciling) return;
  if (!dbConnected || !supabase || !mercadoPagoConnected) return;
  if (!mercadoPagoAccessToken) {
    console.log('⚠️ [RECON][DEPOSIT] Token de depósito não configurado');
    return;
  }
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
      const mpId = String(p.external_id || p.payment_id || '').trim();
      if (!mpId) continue;

      // ✅ CORREÇÃO SSRF: Validar mpId antes de usar na URL
      if (!/^\d+$/.test(mpId)) {
        console.error('❌ [RECON] ID de pagamento inválido (não é número):', mpId);
        continue;
      }
      
      const paymentId = parseInt(mpId, 10);
      if (isNaN(paymentId) || paymentId <= 0) {
        console.error('❌ [RECON] ID de pagamento inválido (não é número positivo):', mpId);
        continue;
      }

      try {
        const resp = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${mercadoPagoAccessToken}` },
          timeout: 5000
        });
        const status = resp?.data?.status;
        if (status === 'approved') {
          // Claim atômico: atualizar por id do registro pendente SOMENTE se status != 'approved'; creditar APENAS se exatamente 1 linha afetada
          const { data: claimedRows, error: claimErr } = await supabase
            .from('pagamentos_pix')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', p.id)
            .neq('status', 'approved')
            .select('id, usuario_id, amount, valor');
          if (claimErr || !claimedRows || claimedRows.length !== 1) {
            if (!claimErr && claimedRows && claimedRows.length === 0) {
              // Já processado por webhook ou ciclo anterior
            } else if (claimErr) {
              console.error('❌ [RECON] Falha ao aprovar registro:', claimErr.message);
            }
            continue;
          }
          const pixRecord = claimedRows[0];
          const credit = Number(pixRecord.amount ?? pixRecord.valor ?? 0);
          if (credit > 0) {
            const { data: userRow, error: userErr } = await supabase
              .from('usuarios')
              .select('saldo')
              .eq('id', pixRecord.usuario_id)
              .single();
            if (!userErr && userRow) {
              const novoSaldo = Number(userRow.saldo || 0) + credit;
              const { error: saldoErr } = await supabase
                .from('usuarios')
                .update({ saldo: novoSaldo })
                .eq('id', pixRecord.usuario_id);
              if (saldoErr) {
                console.error('❌ [RECON] Erro ao creditar saldo:', saldoErr.message);
              } else {
                console.log(`✅ [RECON] Claim ganhou: pagamento ${mpId} aprovado e saldo +${credit} aplicado ao usuário ${pixRecord.usuario_id}`);
              }
            }
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
    version: '1.2.1',
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
    version: '1.2.1',
    database: dbStatus ? 'connected' : 'disconnected',
    mercadoPago: mercadoPagoConnected ? 'connected' : 'disconnected',
    contadorChutes: contadorChutesGlobal,
    ultimoGolDeOuro: ultimoGolDeOuro
  });
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
      version: '1.2.1'
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
        version: '1.2.1',
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

// Endpoint para verificar se sistema está em produção real
app.get('/api/production-status', (req, res) => {
  try {
    const status = {
      isProductionMode: isProductionMode(),
      allowSimulatedData: false,
      requireRealDeposits: true,
      enableMockMode: false,
      timestamp: new Date().toISOString(),
      version: '1.2.1-production-real'
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

// Endpoint de debug para verificar token
app.get('/api/debug/token', (req, res) => {
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
    const wss = new WebSocketManager(server);
    server.listen(PORT, '0.0.0.0', () => {
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

// Iniciar servidor somente quando executado diretamente
if (require.main === module) {
  startServer();
}

module.exports.processPendingWithdrawals = runProcessPendingWithdrawals;

// =====================================================
// SERVIDOR SIMPLIFICADO v1.2.0 - DEPLOY FUNCIONAL
// =====================================================
