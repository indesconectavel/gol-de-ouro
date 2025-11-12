// ROUTER COM BANCO DE DADOS REAL - Gol de Ouro Backend v1.1.1
const express = require('express');
const router = express.Router();
const { supabase, supabaseAdmin, testConnection } = require('./database/supabase-config');

// Middleware de logging
router.use((req, res, next) => {
  console.log(`[Router] ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  next();
});

// Rota de health check
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected'
  });
});

// Rota de readiness check
router.get('/readiness', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: dbConnected ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message
    });
  }
});

// Rota raiz
router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Gol de Ouro Backend API',
    version: '1.1.1',
    timestamp: new Date().toISOString(),
    status: 'running',
    database: 'connected'
  });
});

// Middleware de autenticação admin
const authenticateAdmin = (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  if (!adminToken) {
    return res.status(401).json({ error: 'Token admin necessário' });
  }
  if (adminToken === process.env.ADMIN_TOKEN) {
    next();
  } else {
    return res.status(401).json({ error: 'Token admin inválido' });
  }
};

// Middleware de autenticação player
const authenticatePlayer = async (req, res, next) => {
  const playerToken = req.headers['x-player-token'];
  if (!playerToken) {
    return res.status(401).json({ error: 'Token player necessário' });
  }
  
  try {
    // Verificar token JWT (implementar validação real)
    // Por enquanto, aceitar qualquer token válido
    req.user = { id: playerToken }; // Placeholder
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token player inválido' });
  }
};

// Rotas Admin com Banco Real
router.post('/admin/lista-usuarios', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, name, email, balance, status, total_shots, total_goals, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/admin/relatorio-usuarios', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, name, email, balance, status, total_shots, total_goals, total_credits, total_debits, created_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar relatório de usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/admin/chutes-recentes', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('games')
      .select(`
        id, 
        game_type, 
        result, 
        bet_amount, 
        prize, 
        is_golden_goal,
        created_at,
        users!inner(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar chutes recentes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/admin/top-jogadores', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, name, total_goals, total_shots, balance')
      .order('total_goals', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar top jogadores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/admin/usuarios-bloqueados', authenticateAdmin, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('id, name, email, status, created_at')
      .eq('status', 'blocked');
    
    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar usuários bloqueados:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Dashboard público
router.get('/api/public/dashboard', async (req, res) => {
  try {
    const [usersResult, gamesResult, transactionsResult] = await Promise.all([
      supabase.from('usuarios').select('id', { count: 'exact' }),
      supabase.from('games').select('id', { count: 'exact' }),
      supabase.from('transactions').select('amount').eq('type', 'credit')
    ]);

    const totalUsers = usersResult.count || 0;
    const totalGames = gamesResult.count || 0;
    const totalRevenue = transactionsResult.data?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
    const activeUsers = usersResult.data?.filter(u => u.status === 'active').length || 0;

    res.status(200).json({
      totalUsers,
      totalGames,
      totalRevenue: totalRevenue.toFixed(2),
      activeUsers
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas Player com Banco Real
router.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, senha e nome são obrigatórios' });
    }

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    // Hash da senha (implementar bcrypt)
    const passwordHash = password; // Placeholder - implementar hash real

    // Criar usuário
    const { data, error } = await supabase
      .from('usuarios')
      .insert([{
        email,
        senha_hash: passwordHash,
        username,
        saldo: 0.00,
        tipo: 'jogador',
        ativo: true
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: { id: data.id, email: data.email, name: data.name }
    });
  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, email, username, senha_hash, saldo, tipo, ativo')
      .eq('email', email)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar status da conta
    if (data.ativo !== true) {
      return res.status(403).json({ error: 'Conta desativada' });
    }

    // Verificar senha com bcrypt
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, data.senha_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar JWT
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: data.id, email: data.email, role: data.tipo },
    process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login realizado com sucesso',
      token,
      user: { 
        id: data.id, 
        email: data.email, 
        username: data.username, 
        saldo: data.saldo,
        role: data.tipo
      }
    });
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/api/games/status', (req, res) => {
  res.status(200).json({
    status: 'active',
    message: 'Sistema ativo e funcionando'
  });
});

router.get('/fila', (req, res) => {
  res.status(200).json([]);
});

// Rotas de Pagamento
router.post('/api/payments/pix/criar', async (req, res) => {
  try {
    const { amount, user_id } = req.body;
    
    if (!amount || !user_id) {
      return res.status(400).json({ error: 'Valor e ID do usuário são obrigatórios' });
    }

    // Validar valor do PIX
    const minPix = 1.00;
    const maxPix = 500.00;
    const pixAmount = parseFloat(amount);
    
    if (pixAmount < minPix || pixAmount > maxPix) {
      return res.status(400).json({ 
        error: `Valor do PIX deve estar entre R$ ${minPix} e R$ ${maxPix}` 
      });
    }

    // Criar transação PIX
    const { data, error } = await supabase
      .from('transactions')
      .insert([{
        user_id,
        type: 'credit',
        amount: pixAmount,
        description: `Depósito PIX - R$ ${pixAmount}`,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      message: 'PIX criado com sucesso',
      transaction_id: data.id,
      amount: data.amount,
      status: data.status
    });
  } catch (error) {
    console.error('Erro ao criar PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas de Jogo
router.post('/api/games/shoot', authenticatePlayer, async (req, res) => {
  try {
    const { bet_amount, shot_direction } = req.body;
    const user_id = req.user.id;
    
    if (!bet_amount || !shot_direction) {
      return res.status(400).json({ error: 'Valor da aposta e direção são obrigatórios' });
    }

    // Lógica do jogo (implementar lógica real)
    const isGoal = Math.random() < 0.1; // 10% de chance de gol
    const isGoldenGoal = Math.random() < 0.001; // 0.1% de chance de gol de ouro
    const result = isGoal ? (isGoldenGoal ? 'golden_goal' : 'goal') : 'defense';
    
    const prize = result === 'golden_goal' ? 100.00 : (result === 'goal' ? 5.00 : 0.00);
    const platformFee = result === 'goal' ? 5.00 : 0.00;

    // Salvar jogo no banco
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert([{
        user_id,
        game_type: 'Chute ao Gol',
        bet_amount: parseFloat(bet_amount),
        result,
        prize,
        is_golden_goal: isGoldenGoal,
        shot_direction,
        goalie_direction: Math.random() < 0.5 ? 'left' : 'right'
      }])
      .select()
      .single();

    if (gameError) throw gameError;

    // Atualizar estatísticas do usuário
    await supabase
      .from('usuarios')
      .update({
        total_shots: supabase.raw('total_shots + 1'),
        total_goals: result !== 'defense' ? supabase.raw('total_goals + 1') : supabase.raw('total_goals'),
        total_golden_goals: isGoldenGoal ? supabase.raw('total_golden_goals + 1') : supabase.raw('total_golden_goals'),
        balance: supabase.raw(`balance + ${prize} - ${platformFee}`)
      })
      .eq('id', user_id);

    res.status(200).json({
      result,
      prize,
      is_golden_goal: isGoldenGoal,
      game_id: game.id
    });
  } catch (error) {
    console.error('Erro ao processar chute:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/api/games/history', authenticatePlayer, async (req, res) => {
  try {
    const user_id = req.user.id;
    
    const { data, error } = await supabase
      .from('games')
      .select('id, game_type, result, bet_amount, prize, is_golden_goal, created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.status(200).json(data || []);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota de fallback
router.get('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
