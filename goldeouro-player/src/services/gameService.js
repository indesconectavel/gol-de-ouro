// Serviço de Controle de Jogos Dinâmicos - Gol de Ouro
// Sistema de lotes por valor de aposta com 1 ganhador aleatório

class GameService {
  constructor() {
    this.currentBatch = [];
    this.batchSize = 10; // Será definido dinamicamente baseado no valor da aposta
    this.batchId = null;
    this.winnerIndex = null;
    this.isBatchComplete = false;
    this.batchStartTime = null;
    this.currentBetValue = 1; // Valor da aposta atual
    
    // Sistema Gol de Ouro
    this.goldenGoalCounter = 0;
    this.goldenGoalThreshold = 1000; // A cada 1000 chutes
    this.goldenGoalPrize = 100; // R$100 de premiação especial
    this.isGoldenGoalBatch = false;
    this.goldenGoalBatchId = null;
    
    // Configurações dos lotes por valor de aposta
    this.batchConfigs = {
      1: { size: 10, totalValue: 10, winChance: 0.1, description: "10% chance" },
      2: { size: 5, totalValue: 10, winChance: 0.2, description: "20% chance" },
      5: { size: 2, totalValue: 10, winChance: 0.5, description: "50% chance" },
      10: { size: 1, totalValue: 10, winChance: 1.0, description: "100% chance" }
    };
  }

  // Iniciar novo lote baseado no valor da aposta
  startNewBatch(betValue = 1) {
    this.currentBetValue = betValue;
    const config = this.batchConfigs[betValue];
    this.batchSize = config.size;
    this.currentBatch = [];
    this.batchId = Date.now().toString();
    this.winnerIndex = Math.floor(Math.random() * this.batchSize);
    this.isBatchComplete = false;
    this.batchStartTime = new Date();
    
    console.log(`🎮 Novo lote iniciado: ${this.batchId}`);
    console.log(`💰 Valor da aposta: R$${betValue}`);
    console.log(`📊 Tamanho do lote: ${this.batchSize} chutes`);
    console.log(`🎯 Chute ganhador será o índice: ${this.winnerIndex + 1}`);
    console.log(`📈 Chance de vitória: ${config.description}`);
    
    return {
      batchId: this.batchId,
      batchSize: this.batchSize,
      currentPosition: this.currentBatch.length,
      betValue: betValue,
      winChance: config.winChance,
      description: config.description
    };
  }

  // Adicionar chute ao lote atual
  addShot(shotData) {
    if (this.isBatchComplete || this.currentBatch.length === 0) {
      this.startNewBatch(shotData.bet);
    }

    const shotIndex = this.currentBatch.length;
    const isWinner = shotIndex === this.winnerIndex;
    
    // Incrementar contador global de chutes
    this.goldenGoalCounter++;
    
    // Verificar se é um lote especial de Gol de Ouro
    const isGoldenGoalBatch = this.goldenGoalCounter % this.goldenGoalThreshold === 0;
    if (isGoldenGoalBatch) {
      this.isGoldenGoalBatch = true;
      this.goldenGoalBatchId = this.batchId;
      console.log(`🏆 GOL DE OURO ATIVADO! Chute #${this.goldenGoalCounter} - Premiação especial de R$${this.goldenGoalPrize}`);
    }
    
    // Calcular premiação baseada no tipo de lote
    let prize = 0;
    let isGoldenGoal = false;
    
    if (isWinner) {
      if (isGoldenGoalBatch) {
        // Gol de Ouro: R$100 (premiação especial paga pela plataforma)
        prize = this.goldenGoalPrize; // R$100 para Gol de Ouro
        isGoldenGoal = true;
      } else {
        // Gol normal: R$5 (premiação fixa independente do valor apostado)
        prize = 5; // R$5 para gol normal
      }
    }
    
    const shot = {
      id: `${this.batchId}_${shotIndex}`,
      batchId: this.batchId,
      shotIndex: shotIndex + 1,
      playerId: shotData.playerId,
      playerName: shotData.playerName,
      bet: shotData.bet,
      direction: shotData.direction,
      timestamp: new Date(),
      isWinner: isWinner,
      result: isWinner ? 'goal' : 'defense',
      prize: prize, // Premiação (R$5 normal ou R$100 Gol de Ouro)
      platformFee: 5, // R$5 fixo para a plataforma (independente do valor apostado)
      isGoldenGoal: isGoldenGoal,
      goldenGoalCounter: this.goldenGoalCounter,
      isGoldenGoalBatch: isGoldenGoalBatch
    };

    this.currentBatch.push(shot);
    
    console.log(`⚽ Chute ${shotIndex + 1}/10 adicionado:`, {
      player: shotData.playerName,
      direction: shotData.direction,
      isWinner: isWinner,
      prize: shot.prize,
      isGoldenGoal: isGoldenGoal,
      goldenGoalCounter: this.goldenGoalCounter
    });

    // Verificar se lote está completo
    if (this.currentBatch.length >= this.batchSize) {
      this.isBatchComplete = true;
      this.processBatch();
    }

    return {
      shot: shot,
      batchProgress: {
        current: this.currentBatch.length,
        total: this.batchSize,
        remaining: this.batchSize - this.currentBatch.length
      },
      isBatchComplete: this.isBatchComplete,
      isGoldenGoal: isGoldenGoal,
      goldenGoalCounter: this.goldenGoalCounter,
      nextGoldenGoal: this.goldenGoalThreshold - (this.goldenGoalCounter % this.goldenGoalThreshold)
    };
  }

  // Processar lote completo
  processBatch() {
    const winner = this.currentBatch.find(shot => shot.isWinner);
    const totalCollected = this.currentBatch.reduce((sum, shot) => sum + shot.bet, 0);
    const totalPrizes = this.currentBatch.reduce((sum, shot) => sum + shot.prize, 0);
    const platformRevenue = this.currentBatch.reduce((sum, shot) => sum + shot.platformFee, 0);

    console.log(`🏆 Lote ${this.batchId} processado:`, {
      totalShots: this.currentBatch.length,
      totalCollected: totalCollected,
      winner: winner ? winner.playerName : 'Nenhum',
      totalPrizes: totalPrizes,
      platformRevenue: platformRevenue
    });

    return {
      batchId: this.batchId,
      totalShots: this.currentBatch.length,
      totalCollected: totalCollected,
      winner: winner,
      totalPrizes: totalPrizes,
      platformRevenue: platformRevenue,
      shots: this.currentBatch
    };
  }

  // Obter status do lote atual
  getCurrentBatchStatus() {
    return {
      batchId: this.batchId,
      currentShots: this.currentBatch.length,
      totalShots: this.batchSize,
      remainingShots: this.batchSize - this.currentBatch.length,
      isComplete: this.isBatchComplete,
      startTime: this.batchStartTime
    };
  }

  // Obter estatísticas gerais
  getGameStats() {
    return {
      currentBatch: this.getCurrentBatchStatus(),
      totalBatches: this.batchId ? 1 : 0, // Simplificado para demo
      averageShotsPerBatch: this.batchSize,
      winRate: 0.1 // 10% (1 em 10)
    };
  }
}

// Instância singleton
const gameService = new GameService();

export default gameService;
