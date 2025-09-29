const pool = require('../db');
const env = require('../config/env');

class GameController {
  // Entrar na fila para jogar
  static async entrarNaFila(req, res) {
    try {
      const { user_id } = req.body;
      const bet_amount = 1.00; // Valor fixo por partida

      // Verificar se usuário tem saldo suficiente
      const userResult = await pool.query(
        'SELECT balance FROM users WHERE id = $1',
        [user_id]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Usuário não encontrado'
        });
      }

      const userBalance = parseFloat(userResult.rows[0].balance);
      if (userBalance < bet_amount) {
        return res.status(400).json({
          error: 'Saldo insuficiente',
          message: `Você precisa de pelo menos R$ ${bet_amount.toFixed(2)} para jogar`
        });
      }

      // Verificar se usuário já está em uma partida ativa
      const activeGameResult = await pool.query(
        `SELECT qb.*, g.status 
         FROM queue_board qb 
         JOIN games g ON qb.game_id = g.id 
         WHERE qb.user_id = $1 AND g.status IN ('waiting', 'active')`,
        [user_id]
      );

      if (activeGameResult.rows.length > 0) {
        return res.status(400).json({
          error: 'Usuário já está em uma partida ativa',
          game_id: activeGameResult.rows[0].game_id
        });
      }

      // Buscar partida em espera ou criar nova
      let gameResult = await pool.query(
        `SELECT * FROM games 
         WHERE status = 'waiting' 
         AND (SELECT COUNT(*) FROM queue_board WHERE game_id = games.id) < 10
         ORDER BY created_at ASC 
         LIMIT 1`
      );

      let game_id;
      if (gameResult.rows.length === 0) {
        // Criar nova partida
        const newGameResult = await pool.query(
          `INSERT INTO games (players, status, bet_amount, total_pot, winner_prize, house_cut, created_at)
           VALUES ('[]'::jsonb, 'waiting', $1, $2, $3, $4, NOW()) RETURNING id`,
          [bet_amount, 10.00, 5.00, 5.00]
        );
        game_id = newGameResult.rows[0].id;
      } else {
        game_id = gameResult.rows[0].id;
      }

      // Calcular posição na fila
      const positionResult = await pool.query(
        'SELECT COUNT(*) + 1 as position FROM queue_board WHERE game_id = $1',
        [game_id]
      );
      const position = parseInt(positionResult.rows[0].position);

      // Descontar aposta do saldo
      await pool.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [bet_amount, user_id]
      );

      // Adicionar jogador à fila
      await pool.query(
        `INSERT INTO queue_board (user_id, position, status, bet_amount, game_id, created_at)
         VALUES ($1, $2, 'waiting', $3, $4, NOW())`,
        [user_id, position, bet_amount, game_id]
      );

      // Registrar transação
      await pool.query(
        'INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, $3)',
        [user_id, -bet_amount, 'bet']
      );

      // Verificar se partida está completa (10 jogadores)
      const playersCountResult = await pool.query(
        'SELECT COUNT(*) FROM queue_board WHERE game_id = $1',
        [game_id]
      );
      const playersCount = parseInt(playersCountResult.rows[0].count);

      if (playersCount === 10) {
        // Selecionar vencedor aleatório
        const winnerResult = await pool.query(
          'SELECT user_id FROM queue_board WHERE game_id = $1 ORDER BY RANDOM() LIMIT 1',
          [game_id]
        );
        const winner_user_id = winnerResult.rows[0].user_id;

        // Atualizar jogo
        await pool.query(
          `UPDATE games 
           SET winner_user_id = $1, 
               winner_selected_at = NOW(),
               status = 'active',
               game_started_at = NOW()
           WHERE id = $2`,
          [winner_user_id, game_id]
        );

        // Marcar vencedor na fila
        await pool.query(
          'UPDATE queue_board SET is_winner = TRUE WHERE user_id = $1 AND game_id = $2',
          [winner_user_id, game_id]
        );
      }

      res.json({
        success: true,
        message: `Entrou na fila na posição ${position}`,
        data: {
          game_id,
          position,
          players_count: playersCount,
          game_status: playersCount === 10 ? 'active' : 'waiting'
        }
      });

    } catch (error) {
      console.error('Erro ao entrar na fila:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível entrar na fila'
      });
    }
  }

  // Obter status da fila
  static async obterStatusFila(req, res) {
    try {
      const { user_id } = req.body;

      const result = await pool.query(
        `SELECT qb.*, g.status, g.winner_user_id, g.game_started_at
         FROM queue_board qb
         JOIN games g ON qb.game_id = g.id
         WHERE qb.user_id = $1
         ORDER BY qb.created_at DESC
         LIMIT 1`,
        [user_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Usuário não está em nenhuma fila'
        });
      }

      const player = result.rows[0];
      const game_id = player.game_id;

      // Contar jogadores na partida
      const playersCountResult = await pool.query(
        'SELECT COUNT(*) FROM queue_board WHERE game_id = $1',
        [game_id]
      );
      const playersCount = parseInt(playersCountResult.rows[0].count);

      // Verificar se já chutou
      const shotResult = await pool.query(
        'SELECT * FROM player_shots WHERE user_id = $1 AND game_id = $2',
        [user_id, game_id]
      );
      const jaChutou = shotResult.rows.length > 0;

      res.json({
        success: true,
        data: {
          game_id,
          position: player.position,
          status: player.status,
          game_status: player.status,
          players_count: playersCount,
          ja_chutou: jaChutou,
          is_winner: player.is_winner,
          game_started_at: player.game_started_at
        }
      });

    } catch (error) {
      console.error('Erro ao obter status da fila:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível obter status da fila'
      });
    }
  }

  // Obter opções de chute
  static async obterOpcoesChute(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM shot_options ORDER BY id'
      );

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao obter opções de chute:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível obter opções de chute'
      });
    }
  }

  // Executar chute
  static async executarChute(req, res) {
    try {
      const { user_id, game_id, shot_option_id } = req.body;

      // Verificar se usuário está na partida
      const playerResult = await pool.query(
        'SELECT * FROM queue_board WHERE user_id = $1 AND game_id = $2',
        [user_id, game_id]
      );

      if (playerResult.rows.length === 0) {
        return res.status(400).json({
          error: 'Usuário não está nesta partida'
        });
      }

      // Verificar se já chutou
      const shotResult = await pool.query(
        'SELECT * FROM player_shots WHERE user_id = $1 AND game_id = $2',
        [user_id, game_id]
      );

      if (shotResult.rows.length > 0) {
        return res.status(400).json({
          error: 'Usuário já chutou nesta partida'
        });
      }

      // Verificar se partida está ativa
      const gameResult = await pool.query(
        'SELECT * FROM games WHERE id = $1',
        [game_id]
      );

      if (gameResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Partida não encontrada'
        });
      }

      const game = gameResult.rows[0];
      if (game.status !== 'active') {
        return res.status(400).json({
          error: 'Partida não está ativa'
        });
      }

      // Verificar se é o vencedor
      const is_winner = (user_id === game.winner_user_id);
      const is_goal = is_winner;

      // Atualizar contador global de chutes
      const counterResult = await pool.query(
        `UPDATE global_counters 
         SET counter_value = counter_value + 1, last_updated = NOW() 
         WHERE counter_name = 'total_shots' 
         RETURNING counter_value`
      );
      const total_shots = parseInt(counterResult.rows[0].counter_value);

      // Verificar se é o milésimo chute (Gol de Ouro)
      const is_golden_goal = (total_shots % 1000 === 0 && is_goal);
      const golden_goal_prize = 50.00;

      // Registrar chute
      await pool.query(
        `INSERT INTO player_shots (game_id, user_id, shot_option_id, was_winner, was_goal, shot_time)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [game_id, user_id, shot_option_id, is_winner, is_goal]
      );

      // Registrar animação especial para Gol de Ouro
      if (is_golden_goal) {
        await pool.query(
          `INSERT INTO game_animations (game_id, user_id, animation_type, animation_data)
           VALUES ($1, $2, $3, $4)`,
          [game_id, user_id, 'golden_goal', JSON.stringify({
            shot_number: total_shots,
            prize_amount: golden_goal_prize,
            special_animation: true
          })]
        );
      }

      // Se marcou gol, creditar prêmio
      if (is_goal) {
        // Prêmio normal + prêmio especial se for Gol de Ouro
        if (is_golden_goal) {
          await pool.query(
            'UPDATE users SET balance = balance + $1 + $2 WHERE id = $3',
            [game.winner_prize, golden_goal_prize, user_id]
          );

          await pool.query(
            'INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, $3)',
            [user_id, game.winner_prize, 'reward']
          );

          await pool.query(
            'INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, $3)',
            [user_id, golden_goal_prize, 'golden_goal']
          );
        } else {
          await pool.query(
            'UPDATE users SET balance = balance + $1 WHERE id = $2',
            [game.winner_prize, user_id]
          );

          await pool.query(
            'INSERT INTO transactions (user_id, amount, type) VALUES ($1, $2, $3)',
            [user_id, game.winner_prize, 'reward']
          );
        }
      }

      // Atualizar status do jogador
      await pool.query(
        'UPDATE queue_board SET status = $1, shot_time = NOW() WHERE user_id = $2 AND game_id = $3',
        ['finished', user_id, game_id]
      );

      // Verificar se todos chutaram
      const shotsCountResult = await pool.query(
        'SELECT COUNT(*) FROM player_shots WHERE game_id = $1',
        [game_id]
      );
      const shotsCount = parseInt(shotsCountResult.rows[0].count);

      if (shotsCount === 10) {
        // Finalizar partida
        await pool.query(
          'UPDATE games SET status = $1, game_finished_at = NOW() WHERE id = $2',
          ['finished', game_id]
        );
      }

      // Determinar mensagem e prêmio total
      let message, totalPrize = 0;
      if (is_golden_goal) {
        message = `🏆 GOL DE OURO! Você marcou o ${total_shots}º chute e ganhou R$ ${game.winner_prize + golden_goal_prize}!`;
        totalPrize = game.winner_prize + golden_goal_prize;
      } else if (is_goal) {
        message = 'GOL! Você marcou e ganhou R$ 5,00!';
        totalPrize = game.winner_prize;
      } else {
        message = 'Errou o chute.';
      }

      res.json({
        success: true,
        message,
        data: {
          is_goal,
          is_winner,
          is_golden_goal,
          total_shots,
          prize: totalPrize,
          shots_count: shotsCount,
          game_finished: shotsCount === 10
        }
      });

    } catch (error) {
      console.error('Erro ao executar chute:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível executar o chute'
      });
    }
  }

  // Obter histórico de jogos
  static async obterHistoricoJogos(req, res) {
    try {
      const { user_id } = req.body;
      const { limit = 20, offset = 0 } = req.query;

      const result = await pool.query(
        `SELECT 
           g.id as game_id,
           g.created_at as game_date,
           g.status as game_status,
           ps.shot_option_id,
           so.name as shot_option_name,
           ps.was_goal,
           ps.was_winner,
           ps.shot_time
         FROM games g
         JOIN player_shots ps ON g.id = ps.game_id
         JOIN shot_options so ON ps.shot_option_id = so.id
         WHERE ps.user_id = $1
         ORDER BY g.created_at DESC
         LIMIT $2 OFFSET $3`,
        [user_id, limit, offset]
      );

      res.json({
        success: true,
        data: result.rows
      });

    } catch (error) {
      console.error('Erro ao obter histórico de jogos:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível obter histórico de jogos'
      });
    }
  }

  // Obter estatísticas do jogo (admin)
  static async obterEstatisticas(req, res) {
    try {
      // Total de partidas
      const totalGamesResult = await pool.query(
        'SELECT COUNT(*) FROM games WHERE status = $1',
        ['finished']
      );

      // Total de jogadores
      const totalPlayersResult = await pool.query(
        'SELECT COUNT(DISTINCT user_id) FROM player_shots'
      );

      // Total de prêmios distribuídos
      const totalPrizesResult = await pool.query(
        'SELECT SUM(amount) FROM transactions WHERE type = $1',
        ['reward']
      );

      // Total de apostas
      const totalBetsResult = await pool.query(
        'SELECT SUM(amount) FROM transactions WHERE type = $1',
        ['bet']
      );

      // Total de chutes
      const totalShotsResult = await pool.query(
        'SELECT counter_value FROM global_counters WHERE counter_name = $1',
        ['total_shots']
      );

      // Total de Gols de Ouro
      const goldenGoalsResult = await pool.query(
        'SELECT COUNT(*) FROM transactions WHERE type = $1',
        ['golden_goal']
      );

      // Próximo Gol de Ouro
      const totalShots = parseInt(totalShotsResult.rows[0]?.counter_value || 0);
      const nextGoldenGoal = Math.ceil(totalShots / 1000) * 1000;

      res.json({
        success: true,
        data: {
          total_games: parseInt(totalGamesResult.rows[0].count),
          total_players: parseInt(totalPlayersResult.rows[0].count),
          total_prizes: parseFloat(totalPrizesResult.rows[0].sum || 0),
          total_bets: parseFloat(totalBetsResult.rows[0].sum || 0),
          total_shots: totalShots,
          golden_goals: parseInt(goldenGoalsResult.rows[0].count),
          next_golden_goal: nextGoldenGoal,
          shots_to_next_golden_goal: nextGoldenGoal - totalShots
        }
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      res.status(500).json({
        error: 'Erro interno do servidor',
        message: 'Não foi possível obter estatísticas'
      });
    }
  }
}

module.exports = GameController;
