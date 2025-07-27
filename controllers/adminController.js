const pool = require('../db');

// Relatório semanal
exports.relatorioSemanal = async (req, res) => {
  try {
    const hoje = new Date();
    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(hoje.getDate() - 7);

    const [creditos, debitos, partidasFinalizadas] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions 
         WHERE type = 'credit' AND transaction_date BETWEEN $1 AND $2`,
        [seteDiasAtras, hoje]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total FROM transactions 
         WHERE type = 'debit' AND transaction_date BETWEEN $1 AND $2`,
        [seteDiasAtras, hoje]
      ),
      pool.query(
        `SELECT COUNT(*) FROM games 
         WHERE status = 'finalizado' AND end_time BETWEEN $1 AND $2`,
        [seteDiasAtras, hoje]
      ),
    ]);

    const saldo = creditos.rows[0].total - debitos.rows[0].total;

    res.status(200).json({
      periodo: {
        de: seteDiasAtras,
        ate: hoje
      },
      creditos: parseFloat(creditos.rows[0].total),
      debitos: parseFloat(debitos.rows[0].total),
      saldo,
      partidas_finalizadas: parseInt(partidasFinalizadas.rows[0].count)
    });

  } catch (error) {
    console.error('Erro ao gerar relatório semanal:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório semanal' });
  }
};

// Controle da fila
exports.controleFila = async (req, res) => {
  try {
    const [aguardando, emJogo, partidasAtivas, partidasFinalizadas] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM queue_board WHERE status = 'aguardando'`),
      pool.query(`SELECT COUNT(*) FROM queue_board WHERE status = 'em_jogo'`),
      pool.query(`SELECT COUNT(*) FROM games WHERE status = 'ativo'`),
      pool.query(`SELECT COUNT(*) FROM games WHERE status = 'finalizado'`)
    ]);

    res.status(200).json({
      jogadores_aguardando: parseInt(aguardando.rows[0].count),
      jogadores_em_jogo: parseInt(emJogo.rows[0].count),
      partidas_ativas: parseInt(partidasAtivas.rows[0].count),
      partidas_finalizadas: parseInt(partidasFinalizadas.rows[0].count)
    });

  } catch (error) {
    console.error('Erro ao consultar controle da fila:', error);
    res.status(500).json({ error: 'Erro ao consultar controle da fila' });
  }
};

// Lista de usuários
exports.listarUsuarios = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, created_at FROM users ORDER BY id ASC`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

// Estatísticas gerais
exports.estatisticasGerais = async (req, res) => {
  try {
    const [
      totalUsuarios,
      totalPartidas,
      totalTransacoes,
      totalArrecadado,
      totalSaques,
      totalChutes
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users`),
      pool.query(`SELECT COUNT(*) FROM games`),
      pool.query(`SELECT COUNT(*) FROM transactions`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) FROM transactions WHERE type = 'credit'`),
      pool.query(`SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status != 'cancelado'`),
      pool.query(`SELECT COUNT(*) FROM shot_attempts`)
    ]);

    const mediaChutesPorUsuario =
      totalUsuarios.rows[0].count > 0
        ? totalChutes.rows[0].count / totalUsuarios.rows[0].count
        : 0;

    const lucro =
      parseFloat(totalArrecadado.rows[0].coalesce) - parseFloat(totalSaques.rows[0].coalesce);

    res.status(200).json({
      total_usuarios: parseInt(totalUsuarios.rows[0].count),
      total_partidas: parseInt(totalPartidas.rows[0].count),
      total_transacoes: parseInt(totalTransacoes.rows[0].count),
      total_arrecadado: parseFloat(totalArrecadado.rows[0].coalesce),
      total_pago: parseFloat(totalSaques.rows[0].coalesce),
      lucro,
      media_chutes_por_usuario: mediaChutesPorUsuario.toFixed(2)
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas gerais:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas gerais' });
  }
};

// Ranking de jogadores com mais gols
exports.topJogadores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        users.id AS user_id,
        users.name,
        COUNT(*) AS gols_marcados
      FROM shot_attempts
      JOIN users ON users.id = shot_attempts.user_id
      WHERE was_goal = true
      GROUP BY users.id
      ORDER BY gols_marcados DESC
      LIMIT 10
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar top jogadores:', error);
    res.status(500).json({ error: 'Erro ao buscar top jogadores' });
  }
};

// Transações recentes
exports.transacoesRecentes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_id, amount, type, description, transaction_date 
      FROM transactions 
      ORDER BY transaction_date DESC 
      LIMIT 20
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar transações recentes:', error);
    res.status(500).json({ error: 'Erro ao buscar transações recentes' });
  }
};

// Chutes recentes
exports.chutesRecentes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, user_id, was_goal, shot_choice, shot_date 
      FROM shot_attempts 
      ORDER BY shot_date DESC 
      LIMIT 20
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar chutes recentes:', error);
    res.status(500).json({ error: 'Erro ao buscar chutes recentes' });
  }
};

// Relatório por usuário
exports.relatorioUsuarios = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        COUNT(s.id) AS total_chutes,
        COUNT(CASE WHEN s.was_goal THEN 1 END) AS gols_marcados,
        COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) AS total_creditos,
        COALESCE(SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END), 0) AS total_debitos,
        COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN t.type = 'debit' THEN t.amount ELSE 0 END), 0) AS saldo
      FROM users u
      LEFT JOIN shot_attempts s ON s.user_id = u.id
      LEFT JOIN transactions t ON t.user_id = u.id
      GROUP BY u.id, u.name
      ORDER BY u.id
    `);

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao gerar relatório por usuário:', error);
    res.status(500).json({ error: 'Erro ao gerar relatório por usuário' });
  }
};

// Logs do sistema
exports.logsSistema = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM admin_logs ORDER BY data DESC LIMIT 100
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar logs do sistema:', error);
    res.status(500).json({ error: 'Erro ao buscar logs do sistema' });
  }
};

// Usuários bloqueados
exports.usuariosBloqueados = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, email FROM users WHERE bloqueado = true
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários bloqueados:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários bloqueados' });
  }
};

// Suspender usuário
exports.suspenderUsuario = async (req, res) => {
  const userId = req.params.id;
  try {
    await pool.query(
      `UPDATE users SET bloqueado = true WHERE id = $1`,
      [userId]
    );

    await pool.query(`
      INSERT INTO admin_logs (descricao, data)
      VALUES ($1, NOW())`,
      [`Usuário ${userId} suspenso manualmente`]
    );

    res.status(200).json({ message: 'Usuário suspenso com sucesso.' });
  } catch (error) {
    console.error('Erro ao suspender usuário:', error);
    res.status(500).json({ error: 'Erro ao suspender usuário' });
  }
};
