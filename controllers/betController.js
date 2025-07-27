const Bet = require('../models/Bet.js');
const User = require('../models/User.js');

const createBet = async (req, res) => {
  try {
    const { userId, amount, choice, gameId } = req.body;

    if (!userId || !amount || !choice || !gameId) {
      return res.status(400).json({ message: "Dados incompletos." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    if (user.balance < amount) {
      return res.status(400).json({ message: "Saldo insuficiente." });
    }

    user.balance -= amount;
    await user.save();

    const newBet = new Bet({
      userId,
      amount,
      choice,
      gameId,
    });

    await newBet.save();

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

module.exports = {
  createBet
};
