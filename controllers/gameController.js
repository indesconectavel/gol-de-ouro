const Bet = require("../models/Bet.js");
const User = require("../models/User.js");
const Game = require("../models/Game.js");

const createBet = async (req, res) => {
  try {
    const { userId, amount, choice, gameId } = req.body;

    // validação de campos obrigatórios
    if (!userId || !amount || !choice || !gameId) {
      return res.status(400).json({ message: "Dados incompletos." });
    }

    // buscar usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // verificar saldo
    if (user.balance < amount) {
      return res.status(400).json({ message: "Saldo insuficiente." });
    }

    // buscar jogo
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({ message: "Jogo não encontrado." });
    }

    // verificar se jogo está ativo
    if (game.game_status !== "waiting" && game.game_status !== "active") {
      return res.status(400).json({ message: "Jogo não está disponível para apostas." });
    }

    // descontar saldo do usuário
    const newBalance = user.balance - amount;
    await User.updateBalance(userId, newBalance);

    // registrar aposta
    const newBet = await Bet.create({
      userId,
      amount,
      choice,
      gameId,
      status: "pending",
      prize: 0
    });

    // adicionar jogador ao game se não estiver listado
    await Game.addPlayer(gameId, userId);

    // marcar o jogo como ativo se for a primeira aposta
    if (game.game_status === "waiting") {
      await Game.update(gameId, { gameStatus: "active" });
    }

    res.status(201).json({
      message: "Aposta realizada com sucesso.",
      bet: newBet,
    });

  } catch (err) {
    console.error('Erro ao criar aposta:', err);
    res.status(500).json({
      message: "Erro ao criar aposta.",
      error: err.message,
    });
  }
};

// Exportação no padrão CommonJS (Node.js)
module.exports = {
  createBet
};
