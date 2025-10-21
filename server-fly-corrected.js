// SERVIDOR CORRIGIDO - GOL DE OURO v1.2.0 - PRODUÇÃO REAL 100%
// ============================================================
// Data: 21/10/2025
// Status: SERVIDOR CORRIGIDO E OTIMIZADO
// Versão: v1.2.0-final-production
// GPT-4o Auto-Fix: Backend completo e funcional

const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const winston = require('winston');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// =====================================================
// CONFIGURAÇÃO DE LOGS - WINSTON
// =====================================================

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// =====================================================
// CONFIGURAÇÃO SUPABASE
// =====================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
let dbConnected = false;

// Conectar Supabase
async function connectSupabase() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    logger.error('⚠️ [SUPABASE] Credenciais não configuradas');
    return false;
  }

  try {
    supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    // Testar conexão
    const { data, error } = await supabase.from('usuarios').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    logger.info('✅ [SUPABASE] Conectado com sucesso');
    dbConnected = true;
    return true;
  } catch (error) {
    logger.error('❌ [SUPABASE] Erro na conexão:', error.message);
    dbConnected = false;
    return false;
  }
}

// =====================================================
// CONFIGURAÇÃO MERCADO PAGO
// =====================================================

const mercadoPagoAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const mercadoPagoPublicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
const mercadoPagoWebhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

let mercadoPagoConnected = false;

// Testar Mercado Pago
async function testMercadoPago() {
  if (!mercadoPagoAccessToken) {
    logger.warn('⚠️ [MERCADO-PAGO] Token não configurado');
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
      logger.info('✅ [MERCADO-PAGO] Conectado com sucesso');
      mercadoPagoConnected = true;
      return true;
    }
  } catch (error) {
    logger.error('❌ [MERCADO-PAGO] Erro:', error.message);
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
app.set('trust proxy', true);

// CORS configurado
app.use(cors({
  origin: [
    'https://goldeouro.lol',
    'https://www.goldeouro.lol',
    'https://admin.goldeouro.lol'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Rate limiting específico para autenticação
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 tentativas de login por IP
  message: {
    success: false,
    message: 'Muitas tentativas de login. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =====================================================
// MIDDLEWARE DE AUTENTICAÇÃO
// =====================================================

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('❌ [AUTH] Token não fornecido');
    return res.status(401).json({ 
      success: false,
      message: 'Token de acesso requerido' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('❌ [AUTH] Token inválido:', err.message);
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
// MIDDLEWARE DE VALIDAÇÃO
// =====================================================

const validateData = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('❌ [VALIDATION] Dados inválidos:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors: errors.array()
    });
  }
  next();
};

// =====================================================
// SISTEMA DE LOTES CORRIGIDO
// =====================================================

let lotesAtivos = new Map();
let contadorChutesGlobal = 0;
let ultimoGolDeOuro = 0;

// Configurações dos lotes por valor de aposta
const batchConfigs = {
  1: { size: 10, totalValue: 10, winChance: 0.1, description: "10% chance" },
  2: { size: 5, totalValue: 10, winChance: 0.2, description: "20% chance" },
  5: { size: 2, totalValue: 10, winChance: 0.5, description: "50% chance" },
  10: { size: 1, totalValue: 10, winChance: 1.0, description: "100% chance" }
};

// Função para obter ou criar lote por valor de aposta
function getOrCreateLoteByValue(amount) {
  const config = batchConfigs[amount];
  if (!config) {
    throw new Error(`Valor de aposta inválido: ${amount}`);
  }

  // Verificar se existe lote ativo para este valor
  let loteAtivo = null;
  for (const [loteId, lote] of lotesAtivos.entries()) {
    if (lote.valorAposta === amount && lote.status === 'active' && lote.chutes.length < config.size) {
      loteAtivo = lote;
      break;
    }
  }

  // Se não existe lote ativo, criar novo
  if (!loteAtivo) {
    const loteId = `lote_${amount}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    loteAtivo = {
      id: loteId,
      valorAposta: amount,
      config: config,
      chutes: [],
      status: 'active',
      winnerIndex: Math.floor(Math.random() * config.size), // CORRIGIDO: Aleatório por lote
      createdAt: new Date().toISOString(),
      totalArrecadado: 0,
      premioTotal: 0
    };
    lotesAtivos.set(loteId, loteAtivo);
    logger.info(`🎮 [LOTE] Novo lote criado: ${loteId} (R$${amount})`);
  }

  return loteAtivo;
}

// =====================================================
// ROTAS DE AUTENTICAÇÃO
// =====================================================

// Registro de usuário
app.post('/api/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('username').isLength({ min: 3, max: 50 })
], validateData, async (req, res) => {
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
      logger.error('❌ [REGISTER] Erro ao verificar email:', checkError);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor' 
      });
    }

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Email já cadastrado' 
      });
    }

    // Hash da senha
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(password, saltRounds);

    // Criar usuário
    const { data: newUser, error: insertError } = await supabase
      .from('usuarios')
      .insert({
        email: email,
        username: username,
        senha_hash: senhaHash,
        saldo: 0.00,
        tipo: 'jogador',
        ativo: true,
        email_verificado: false,
        total_apostas: 0,
        total_ganhos: 0.00
      })
      .select()
      .single();

    if (insertError) {
      logger.error('❌ [REGISTER] Erro ao criar usuário:', insertError);
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

    logger.info(`✅ [REGISTER] Usuário criado: ${email}`);

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
    logger.error('❌ [REGISTER] Erro:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor' 
    });
  }
});

// Login de usuário
app.post('/api/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 1 })
], validateData, async (req, res) => {
  try {
    const { email, password } = req.body;

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
      logger.warn(`❌ [LOGIN] Usuário não encontrado: ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciais inválidas' 
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(password, user.senha_hash);
    if (!senhaValida) {
      logger.warn(`❌ [LOGIN] Senha inválida para: ${email}`);
      return res.status(401).json({ 
        success: false,
        message: 'Credenciais inválidas' 
      });
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

    logger.info(`✅ [LOGIN] Login realizado: ${email}`);

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
    logger.error('❌ [LOGIN] Erro:', error);
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
      logger.error('❌ [PROFILE] Usuário não encontrado:', userError);
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
    logger.error('❌ [PROFILE] Erro:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor' 
    });
  }
});

// Atualizar perfil do usuário
app.put('/api/user/profile', authenticateToken, [
  body('nome').isLength({ min: 3, max: 50 }),
  body('email').isEmail().normalizeEmail()
], validateData, async (req, res) => {
  try {
    const { nome, email } = req.body;
    
    // APENAS SUPABASE REAL - SEM FALLBACK
    if (!dbConnected || !supabase) {
      return res.status(503).json({ 
        success: false,
        message: 'Sistema temporariamente indisponível' 
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
      logger.error('❌ [PROFILE] Erro ao verificar email:', checkError);
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
      logger.error('❌ [PROFILE] Erro ao atualizar usuário:', updateError);
      return res.status(500).json({ 
        success: false,
        message: 'Erro ao atualizar perfil' 
      });
    }

    logger.info(`✅ [PROFILE] Perfil atualizado para usuário ${req.user.userId}`);

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
    logger.error('❌ [PROFILE] Erro:', error);
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
app.post('/api/games/shoot', authenticateToken, [
  body('direction').isIn(['TL', 'TR', 'C', 'BL', 'BR']),
  body('amount').isFloat({ min: 1, max: 10 })
], validateData, async (req, res) => {
  try {
    const { direction, amount } = req.body;
    
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
        logger.info(`🏆 [GOL DE OURO] Chute #${contadorChutesGlobal} - Prêmio: R$ ${premioGolDeOuro}`);
      }
    }
    
    // Adicionar chute ao lote
    const chute = {
      id: `${lote.id}_${shotIndex}`,
      playerId: req.user.userId,
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

    // Salvar chute no banco de dados
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
      logger.error('❌ [SHOOT] Erro ao salvar chute:', chuteError);
    }

    // Salvar transação
    const { error: transacaoError } = await supabase
      .from('transacoes')
      .insert({
        usuario_id: req.user.userId,
        tipo: 'bet',
        valor: -amount, // Negativo para aposta
        descricao: `Aposta de R$ ${amount} - ${direction}`,
        referencia_id: lote.id,
        status: 'completed'
      });

    if (transacaoError) {
      logger.error('❌ [SHOOT] Erro ao salvar transação:', transacaoError);
    }

    // Se ganhou, salvar transação de prêmio
    if (isGoal) {
      const { error: premioError } = await supabase
        .from('transacoes')
        .insert({
          usuario_id: req.user.userId,
          tipo: 'prize',
          valor: premio + premioGolDeOuro,
          descricao: `Prêmio: R$ ${premio}${isGolDeOuro ? ` + Gol de Ouro: R$ ${premioGolDeOuro}` : ''}`,
          referencia_id: lote.id,
          status: 'completed'
        });

      if (premioError) {
        logger.error('❌ [SHOOT] Erro ao salvar prêmio:', premioError);
      }
    }

    // Verificar se lote está completo
    if (lote.chutes.length >= lote.config.size) {
      lote.status = 'completed';
      logger.info(`🏆 [LOTE] Lote ${lote.id} completado: ${lote.chutes.length} chutes, R$${lote.totalArrecadado} arrecadado, R$${lote.premioTotal} em prêmios`);
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
      isLoteComplete: lote.status === 'completed',
      novoSaldo: user.saldo - amount + premio + premioGolDeOuro
    };

    // Atualizar saldo do usuário
    const novoSaldo = user.saldo - amount + premio + premioGolDeOuro;
    const { error: saldoError } = await supabase
      .from('usuarios')
      .update({ saldo: novoSaldo })
      .eq('id', req.user.userId);

    if (saldoError) {
      logger.error('❌ [SHOOT] Erro ao atualizar saldo:', saldoError);
    }
    
    logger.info(`⚽ [SHOOT] Chute #${contadorChutesGlobal}: ${result} por usuário ${req.user.userId}`);
    
    res.status(200).json({
      success: true,
      data: shootResult
    });

  } catch (error) {
    logger.error('❌ [SHOOT] Erro:', error);
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
app.post('/api/payments/pix/criar', authenticateToken, [
  body('amount').isFloat({ min: 1, max: 1000 })
], validateData, async (req, res) => {
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
      const paymentData = {
        transaction_amount: parseFloat(amount),
        description: 'Depósito Gol de Ouro',
        payment_method_id: 'pix',
        payer: {
          email: req.user.email
        }
      };

      // Gerar X-Idempotency-Key único
      const idempotencyKey = `pix_${req.user.userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
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
      
      // Salvar no banco de dados
      if (dbConnected && supabase) {
        const { data: pixRecord, error: insertError } = await supabase
          .from('pagamentos_pix')
          .insert({
            usuario_id: req.user.userId,
            external_id: payment.id.toString(),
            payment_id: payment.id.toString(),
            amount: parseFloat(amount),
            status: 'pending',
            qr_code: payment.point_of_interaction?.transaction_data?.qr_code || null,
            qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || null,
            pix_copy_paste: payment.point_of_interaction?.transaction_data?.qr_code || null
          })
          .select()
          .single();

        if (insertError) {
          logger.error('❌ [PIX] Erro ao salvar no banco:', insertError);
        }
      }

      logger.info(`💰 [PIX] PIX real criado: R$ ${amount} para usuário ${req.user.userId}`);

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
      logger.error('❌ [PIX] Erro Mercado Pago:', mpError.response?.data || mpError.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar PIX. Tente novamente em alguns minutos.'
      });
    }

  } catch (error) {
    logger.error('❌ [PIX] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// =====================================================
// WEBHOOK PIX CORRIGIDO
// =====================================================

// Webhook principal
app.post('/api/payments/webhook', async (req, res) => {
  try {
    const { type, data } = req.body;
    logger.info('📨 [WEBHOOK] PIX recebido:', { type, data });
    
    res.status(200).json({ received: true }); // Responder imediatamente
    
    if (type === 'payment' && data?.id) {
      // Verificar se já foi processado (idempotência)
      const { data: existingPayment, error: checkError } = await supabase
        .from('pagamentos_pix')
        .select('id, status')
        .eq('external_id', data.id)
        .single();
        
      if (existingPayment && existingPayment.status === 'approved') {
        logger.info('📨 [WEBHOOK] Pagamento já processado:', data.id);
        return;
      }
      
      // Verificar pagamento no Mercado Pago
      const payment = await axios.get(
        `https://api.mercadopago.com/v1/payments/${data.id}`,
        { 
          headers: { 
            'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );
      
      if (payment.data.status === 'approved') {
        // Atualizar status do pagamento
        const { error: updateError } = await supabase
          .from('pagamentos_pix')
          .update({ 
            status: 'approved',
            updated_at: new Date().toISOString()
          })
          .eq('external_id', data.id);
          
        if (updateError) {
          logger.error('❌ [WEBHOOK] Erro ao atualizar pagamento:', updateError);
          return;
        }

        // Buscar usuário e atualizar saldo
        const { data: pixRecord, error: pixError } = await supabase
          .from('pagamentos_pix')
          .select('usuario_id, amount')
          .eq('external_id', data.id)
          .single();

        if (pixError || !pixRecord) {
          logger.error('❌ [WEBHOOK] Erro ao buscar pagamento:', pixError);
          return;
        }

        // Atualizar saldo do usuário
        const { data: user, error: userError } = await supabase
          .from('usuarios')
          .select('saldo')
          .eq('id', pixRecord.usuario_id)
          .single();

        if (userError || !user) {
          logger.error('❌ [WEBHOOK] Erro ao buscar usuário:', userError);
          return;
        }

        const novoSaldo = user.saldo + pixRecord.amount;
        const { error: saldoError } = await supabase
          .from('usuarios')
          .update({ saldo: novoSaldo })
          .eq('id', pixRecord.usuario_id);

        if (saldoError) {
          logger.error('❌ [WEBHOOK] Erro ao atualizar saldo:', saldoError);
          return;
        }

        // Salvar transação
        const { error: transacaoError } = await supabase
          .from('transacoes')
          .insert({
            usuario_id: pixRecord.usuario_id,
            tipo: 'deposit',
            valor: pixRecord.amount,
            descricao: `Depósito PIX aprovado - R$ ${pixRecord.amount}`,
            referencia_id: data.id,
            status: 'completed'
          });

        if (transacaoError) {
          logger.error('❌ [WEBHOOK] Erro ao salvar transação:', transacaoError);
        }

        logger.info(`💰 [WEBHOOK] Pagamento aprovado: R$ ${pixRecord.amount} para usuário ${pixRecord.usuario_id}`);
      }
    }
  } catch (error) {
    logger.error('❌ [WEBHOOK] Erro:', error);
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
        logger.error('❌ [METRICS] Erro ao salvar contador:', error);
      }
    } catch (error) {
      logger.error('❌ [METRICS] Erro:', error);
    }
  }
}

// =====================================================
// ROTAS DE SAÚDE E MONITORAMENTO
// =====================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.2.0',
    database: dbConnected ? 'connected' : 'disconnected',
    mercadoPago: mercadoPagoConnected ? 'connected' : 'disconnected',
    contadorChutes: contadorChutesGlobal,
    ultimoGolDeOuro: ultimoGolDeOuro
  });
});

// Métricas globais
app.get('/api/metrics', async (req, res) => {
  try {
    if (!dbConnected || !supabase) {
      return res.status(503).json({
        success: false,
        message: 'Sistema temporariamente indisponível'
      });
    }

    const { data: metrics, error } = await supabase
      .from('metricas_globais')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar métricas'
      });
    }

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('❌ [METRICS] Erro:', error);
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
          logger.info(`📊 [METRICS] Contador carregado: ${contadorChutesGlobal} chutes, último Gol de Ouro: ${ultimoGolDeOuro}`);
        }
      } catch (error) {
        logger.error('❌ [METRICS] Erro ao carregar contador:', error);
      }
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`🚀 [SERVER] Servidor iniciado na porta ${PORT}`);
      logger.info(`🌐 [SERVER] Ambiente: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 [SERVER] Supabase: ${dbConnected ? 'Conectado' : 'Desconectado'}`);
      logger.info(`💳 [SERVER] Mercado Pago: ${mercadoPagoConnected ? 'Conectado' : 'Desconectado'}`);
    });
    
  } catch (error) {
    logger.error('❌ [SERVER] Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

// =====================================================
// SERVIDOR CORRIGIDO v1.2.0 - PRODUÇÃO REAL 100%
// =====================================================
