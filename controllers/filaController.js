const pool = require('../db');

// Função para calcular a posição do novo jogador
async function calcularPosicao() {
  const result = await pool.query(
    'SELECT COUNT(*) FROM queue_board WHERE status = $1',
    ['waiting']
  );
  return parseInt(result.rows[0].count) + 1;
}

// Função para contar jogadores na fila
async function contarJogadoresFila() {
  const result = await pool.query(
    'SELECT COUNT(*) FROM queue_board WHERE status = $1',
    ['waiting']
  );
  return parseInt(result.rows[0].count);
}

// POST /fila/entrar
exports.enterQueue = async (req, res) => {
  const { userId } = req.body;

  try {
    const position = await calcularPosicao();

    await pool.query(
      'INSERT INTO queue_board (user_id, position, status, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, position, 'waiting']
    );

    console.log(`🟢 Usuário ${userId} inserido na posição ${position}`);
    res.status(200).json({
      message: `Usuário ${userId} entrou na fila com sucesso na posição ${position}`,
    });
  } catch (error) {
    console.error('Erro ao inserir na fila:', error);
    res.status(500).json({ error: 'Erro interno ao inserir na fila' });
  }
};

// POST /fila/chutar
exports.shootBall = async (req, res) => {
  const { userId, shotChoice } = req.body;

  try {
    const partida = await pool.query(
      `SELECT * FROM queue_board 
       WHERE status IN ('waiting', 'in_game') 
       ORDER BY created_at ASC 
       LIMIT 10`
    );

    const players = partida.rows;

    if (players.length < 10) {
      return res.status(400).json({ error: 'Aguardando completar 10 jogadores.' });
    }

    const jogador = players.find(p => p.user_id === userId);
    if (!jogador) {
      return res.status(400).json({ error: 'Você não está entre os 10 jogadores da partida atual.' });
    }

    if (jogador.status === 'finished') {
      return res.status(400).json({ error: 'Você já chutou nesta partida.' });
    }

    let winner = players.find(p => p.is_winner);
    let winnerUserId = winner ? winner.user_id : null;

    if (!winnerUserId) {
      const sorteado = players[Math.floor(Math.random() * players.length)];
      winnerUserId = sorteado.user_id;

      await pool.query(
        'UPDATE queue_board SET is_winner = TRUE WHERE user_id = $1',
        [winnerUserId]
      );
    }

    const wasGoal = userId === winnerUserId;

    await pool.query(
      'INSERT INTO shot_attempts (user_id, shot_choice, was_goal, shot_date) VALUES ($1, $2, $3, NOW())',
      [userId, shotChoice, wasGoal]
    );

    if (wasGoal) {
      await pool.query(
        'INSERT INTO transactions (user_id, amount, type, transaction_date) VALUES ($1, $2, $3, NOW())',
        [userId, 5.0, 'reward']
      );
    }

    await pool.query(
      'UPDATE queue_board SET status = $1 WHERE user_id = $2',
      ['finished', userId]
    );

    const finalizados = await pool.query(
      `SELECT COUNT(*) FROM queue_board 
       WHERE status = 'finished' AND id IN (
         SELECT id FROM queue_board ORDER BY created_at ASC LIMIT 10
       )`
    );

    if (parseInt(finalizados.rows[0].count) === 10) {
      console.log('🏁 Partida finalizada');
    }

    res.status(200).json({
      message: wasGoal ? 'GOL! Você marcou e ganhou R$5,00.' : 'Errou o chute.',
    });
  } catch (error) {
    console.error('Erro ao processar chute:', error);
    res.status(500).json({ error: 'Erro interno ao chutar' });
  }
};

// GET /fila/status
exports.getStatus = async (req, res) => {
  const { userId } = req.body;

  try {
    const fila = await pool.query(
      'SELECT * FROM queue_board WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (fila.rowCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado na fila.' });
    }

    const jogador = fila.rows[0];
    const totalNaFila = await contarJogadoresFila();

    const chute = await pool.query(
      'SELECT * FROM shot_attempts WHERE user_id = $1 ORDER BY shot_date DESC LIMIT 1',
      [userId]
    );

    res.status(200).json({
      posicao: jogador.position,
      status: jogador.status,
      jaChutou: chute.rowCount > 0,
      marcouGol: chute.rows[0]?.was_goal || false,
      totalNaFila,
    });
  } catch (error) {
    console.error('❌ Erro interno ao inserir na fila:', error.message, error.stack);
    res.status(500).json({ error: 'Erro interno ao inserir na fila', detalhe: error.message });
  }
};
