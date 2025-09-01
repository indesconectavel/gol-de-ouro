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

    // Descontar saldo do usuário
    const newBalance = user.balance - amount;
    await User.updateBalance(userId, newBalance);

    // Criar nova aposta
    const newBet = await Bet.create({
      userId,
      amount,
      choice,
      gameId,
      status: "pending",
      prize: 0
    });

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

// Buscar apostas do usuário
const getUserBets = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: "ID do usuário é obrigatório." });
    }

    const bets = await Bet.findByUserId(userId);
    
    res.status(200).json({
      message: "Apostas encontradas com sucesso.",
      bets: bets,
      count: bets.length
    });

  } catch (err) {
    console.error('Erro ao buscar apostas do usuário:', err);
    res.status(500).json({
      message: "Erro ao buscar apostas.",
      error: err.message,
    });
  }
};

// Atualizar status da aposta
const updateBetStatus = async (req, res) => {
  try {
    const { betId } = req.params;
    const { status, prize } = req.body;
    
    if (!betId || !status) {
      return res.status(400).json({ message: "ID da aposta e status são obrigatórios." });
    }

    const updatedBet = await Bet.updateStatus(betId, status, prize || 0);
    
    if (!updatedBet) {
      return res.status(404).json({ message: "Aposta não encontrada." });
    }

    res.status(200).json({
      message: "Status da aposta atualizado com sucesso.",
      bet: updatedBet
    });

  } catch (err) {
    console.error('Erro ao atualizar status da aposta:', err);
    res.status(500).json({
      message: "Erro ao atualizar status da aposta.",
      error: err.message,
    });
  }
};

// Estatísticas das apostas
const getBetStats = async (req, res) => {
  try {
    const stats = await Bet.getStats();
    
    res.status(200).json({
      message: "Estatísticas das apostas recuperadas com sucesso.",
      stats: stats
    });

  } catch (err) {
    console.error('Erro ao buscar estatísticas das apostas:', err);
    res.status(500).json({
      message: "Erro ao buscar estatísticas das apostas.",
      error: err.message,
    });
  }
};

module.exports = {
  createBet,
  getUserBets,
  updateBetStatus,
  getBetStats
};
