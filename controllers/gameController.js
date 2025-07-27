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
    if (game.gameStatus !== "waiting" && game.gameStatus !== "active") {
      return res.status(400).json({ message: "Jogo não está disponível para apostas." });
    }

    // descontar saldo do usuário
    user.balance -= amount;
    await user.save();

    // registrar aposta
    const newBet = new Bet({
      userId,
      amount,
      choice,
      gameId,
      status: "pending",
      prize: 0
    });
    await newBet.save();

    // adicionar jogador ao game se não estiver listado
    if (!game.players.includes(userId)) {
      game.players.push(userId);
    }

    // marcar o jogo como ativo se for a primeira aposta
    game.gameStatus = "active";

    await game.save();

    res.status(201).json({
      message: "Aposta realizada com sucesso.",
      bet: newBet,
    });

  } catch (err) {
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
