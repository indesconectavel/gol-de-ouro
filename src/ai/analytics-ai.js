// Sistema de IA para Analytics - Gol de Ouro v1.1.1
const { supabase } = require('../database/supabase-config');

class AnalyticsAI {
  constructor() {
    this.models = {
      playerBehavior: new PlayerBehaviorModel(),
      gameOutcome: new GameOutcomeModel(),
      fraudDetection: new FraudDetectionModel(),
      recommendation: new RecommendationModel()
    };
  }

  // Analisar comportamento do jogador
  async analyzePlayerBehavior(userId, timeframe = '30d') {
    try {
      const data = await this.getPlayerData(userId, timeframe);
      
      const analysis = {
        userId,
        timeframe,
        patterns: await this.models.playerBehavior.analyze(data),
        riskScore: await this.models.fraudDetection.calculateRisk(data),
        recommendations: await this.models.recommendation.generate(data),
        timestamp: new Date().toISOString()
      };

      // Salvar análise no banco
      await this.saveAnalysis('player_behavior', analysis);
      
      return analysis;
    } catch (error) {
      console.error('Erro na análise de comportamento:', error);
      throw error;
    }
  }

  // Prever resultado de partidas
  async predictGameOutcome(gameData) {
    try {
      const prediction = await this.models.gameOutcome.predict(gameData);
      
      return {
        gameId: gameData.id,
        prediction: prediction,
        confidence: prediction.confidence,
        factors: prediction.factors,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na previsão de jogo:', error);
      throw error;
    }
  }

  // Detectar fraudes
  async detectFraud(transactionData) {
    try {
      const riskScore = await this.models.fraudDetection.analyze(transactionData);
      
      return {
        transactionId: transactionData.id,
        riskScore: riskScore.score,
        riskLevel: riskScore.level,
        flags: riskScore.flags,
        recommendation: riskScore.recommendation,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na detecção de fraude:', error);
      throw error;
    }
  }

  // Gerar recomendações personalizadas
  async generateRecommendations(userId) {
    try {
      const userData = await this.getPlayerData(userId, '90d');
      const recommendations = await this.models.recommendation.generate(userData);
      
      return {
        userId,
        recommendations: recommendations,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro na geração de recomendações:', error);
      throw error;
    }
  }

  // Obter dados do jogador
  async getPlayerData(userId, timeframe) {
    const days = this.parseTimeframe(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [partidas, transacoes, chutes] = await Promise.all([
      supabase
        .from('partida_jogadores')
        .select(`
          *,
          partidas (
            id,
            status,
            valor_aposta,
            premio_total,
            gols_marcados,
            created_at
          )
        `)
        .eq('usuario_id', userId)
        .gte('created_at', startDate.toISOString()),
      
      supabase
        .from('transacoes')
        .select('*')
        .eq('usuario_id', userId)
        .gte('created_at', startDate.toISOString()),
      
      supabase
        .from('chutes')
        .select('*')
        .eq('usuario_id', userId)
        .gte('created_at', startDate.toISOString())
    ]);

    return {
      partidas: partidas.data || [],
      transacoes: transacoes.data || [],
      chutes: chutes.data || []
    };
  }

  // Salvar análise no banco
  async saveAnalysis(type, analysis) {
    try {
      await supabase
        .from('ai_analyses')
        .insert({
          type: type,
          data: analysis,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao salvar análise:', error);
    }
  }

  // Converter timeframe para dias
  parseTimeframe(timeframe) {
    const timeframes = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return timeframes[timeframe] || 30;
  }
}

// Modelo de comportamento do jogador
class PlayerBehaviorModel {
  async analyze(data) {
    const patterns = {
      playingFrequency: this.calculatePlayingFrequency(data.partidas),
      bettingPatterns: this.analyzeBettingPatterns(data.transacoes),
      skillLevel: this.calculateSkillLevel(data.chutes),
      riskTolerance: this.calculateRiskTolerance(data.transacoes),
      timePatterns: this.analyzeTimePatterns(data.partidas)
    };

    return patterns;
  }

  calculatePlayingFrequency(partidas) {
    if (!partidas.length) return { level: 'low', frequency: 0 };
    
    const days = 30;
    const frequency = partidas.length / days;
    
    return {
      level: frequency > 1 ? 'high' : frequency > 0.5 ? 'medium' : 'low',
      frequency: frequency,
      totalGames: partidas.length
    };
  }

  analyzeBettingPatterns(transacoes) {
    const apostas = transacoes.filter(t => t.tipo === 'aposta');
    if (!apostas.length) return { pattern: 'conservative', avgBet: 0 };
    
    const values = apostas.map(a => Math.abs(parseFloat(a.valor)));
    const avgBet = values.reduce((sum, v) => sum + v, 0) / values.length;
    const maxBet = Math.max(...values);
    const variance = this.calculateVariance(values);
    
    return {
      pattern: avgBet > 50 ? 'aggressive' : avgBet > 10 ? 'moderate' : 'conservative',
      avgBet: avgBet,
      maxBet: maxBet,
      variance: variance,
      totalBets: apostas.length
    };
  }

  calculateSkillLevel(chutes) {
    if (!chutes.length) return { level: 'beginner', accuracy: 0 };
    
    const goals = chutes.filter(c => c.gol_marcado).length;
    const accuracy = goals / chutes.length;
    
    return {
      level: accuracy > 0.7 ? 'expert' : accuracy > 0.5 ? 'intermediate' : 'beginner',
      accuracy: accuracy,
      totalKicks: chutes.length,
      goals: goals
    };
  }

  calculateRiskTolerance(transacoes) {
    const depositos = transacoes.filter(t => t.tipo === 'deposito');
    const saques = transacoes.filter(t => t.tipo === 'saque');
    
    if (!depositos.length) return { level: 'low', ratio: 0 };
    
    const totalDeposited = depositos.reduce((sum, d) => sum + parseFloat(d.valor), 0);
    const totalWithdrawn = saques.reduce((sum, s) => sum + Math.abs(parseFloat(s.valor)), 0);
    const ratio = totalWithdrawn / totalDeposited;
    
    return {
      level: ratio > 0.8 ? 'high' : ratio > 0.5 ? 'medium' : 'low',
      ratio: ratio,
      totalDeposited: totalDeposited,
      totalWithdrawn: totalWithdrawn
    };
  }

  analyzeTimePatterns(partidas) {
    const hours = partidas.map(p => new Date(p.created_at).getHours());
    const hourCounts = {};
    
    hours.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b
    );
    
    return {
      peakHour: parseInt(peakHour),
      distribution: hourCounts,
      totalGames: partidas.length
    };
  }

  calculateVariance(values) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }
}

// Modelo de previsão de resultados
class GameOutcomeModel {
  async predict(gameData) {
    const factors = this.analyzeFactors(gameData);
    const prediction = this.calculatePrediction(factors);
    
    return {
      outcome: prediction.outcome,
      confidence: prediction.confidence,
      factors: factors
    };
  }

  analyzeFactors(gameData) {
    return {
      playerCount: gameData.jogadores?.length || 0,
      averageSkill: this.calculateAverageSkill(gameData.jogadores),
      timeOfDay: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
      recentActivity: this.calculateRecentActivity(gameData)
    };
  }

  calculatePrediction(factors) {
    // Algoritmo simplificado de previsão
    let score = 0.5; // Base score
    
    // Ajustar baseado no número de jogadores
    if (factors.playerCount >= 10) score += 0.1;
    else if (factors.playerCount < 5) score -= 0.2;
    
    // Ajustar baseado na habilidade média
    if (factors.averageSkill > 0.7) score += 0.15;
    else if (factors.averageSkill < 0.3) score -= 0.1;
    
    // Ajustar baseado no horário
    if (factors.timeOfDay >= 19 && factors.timeOfDay <= 23) score += 0.05;
    
    // Ajustar baseado no dia da semana
    if (factors.dayOfWeek >= 5) score += 0.05; // Fim de semana
    
    const confidence = Math.min(0.9, Math.max(0.1, Math.abs(score - 0.5) * 2));
    
    return {
      outcome: score > 0.5 ? 'high_activity' : 'low_activity',
      confidence: confidence
    };
  }

  calculateAverageSkill(jogadores) {
    if (!jogadores?.length) return 0.5;
    
    // Simular cálculo de habilidade baseado em dados históricos
    return Math.random() * 0.4 + 0.3; // Entre 0.3 e 0.7
  }

  calculateRecentActivity(gameData) {
    // Simular cálculo de atividade recente
    return Math.random() * 0.3 + 0.4; // Entre 0.4 e 0.7
  }
}

// Modelo de detecção de fraude
class FraudDetectionModel {
  async analyze(transactionData) {
    const flags = [];
    let riskScore = 0;
    
    // Verificar valor suspeito
    if (parseFloat(transactionData.valor) > 1000) {
      flags.push('high_value_transaction');
      riskScore += 30;
    }
    
    // Verificar frequência de transações
    const frequency = await this.checkTransactionFrequency(transactionData.usuario_id);
    if (frequency > 10) {
      flags.push('high_frequency_transactions');
      riskScore += 25;
    }
    
    // Verificar horário suspeito
    const hour = new Date().getHours();
    if (hour >= 2 && hour <= 5) {
      flags.push('suspicious_time');
      riskScore += 15;
    }
    
    // Verificar padrões de IP (simulado)
    const ipRisk = await this.checkIPRisk(transactionData.ip_address);
    riskScore += ipRisk;
    
    const level = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
    
    return {
      score: riskScore,
      level: level,
      flags: flags,
      recommendation: this.getRecommendation(level)
    };
  }

  async checkTransactionFrequency(userId) {
    // Simular verificação de frequência
    return Math.floor(Math.random() * 20);
  }

  async checkIPRisk(ipAddress) {
    // Simular verificação de risco de IP
    return Math.floor(Math.random() * 30);
  }

  getRecommendation(level) {
    const recommendations = {
      low: 'approve',
      medium: 'review',
      high: 'block'
    };
    return recommendations[level];
  }
}

// Modelo de recomendações
class RecommendationModel {
  async generate(userData) {
    const recommendations = [];
    
    // Recomendação baseada na frequência de jogo
    const frequency = this.calculatePlayingFrequency(userData.partidas);
    if (frequency < 0.1) {
      recommendations.push({
        type: 'engagement',
        title: 'Jogue mais para melhorar suas habilidades!',
        description: 'Jogar regularmente ajuda a desenvolver suas técnicas de chute.',
        priority: 'medium'
      });
    }
    
    // Recomendação baseada no saldo
    const saldo = this.getCurrentBalance(userData.transacoes);
    if (saldo < 10) {
      recommendations.push({
        type: 'deposit',
        title: 'Faça um depósito para continuar jogando',
        description: 'Seu saldo está baixo. Faça um depósito para continuar participando das partidas.',
        priority: 'high'
      });
    }
    
    // Recomendação baseada na habilidade
    const skill = this.calculateSkillLevel(userData.chutes);
    if (skill.accuracy < 0.3) {
      recommendations.push({
        type: 'improvement',
        title: 'Pratique suas técnicas de chute',
        description: 'Experimente diferentes zonas e potências para melhorar sua precisão.',
        priority: 'low'
      });
    }
    
    return recommendations;
  }

  calculatePlayingFrequency(partidas) {
    if (!partidas.length) return 0;
    const days = 30;
    return partidas.length / days;
  }

  getCurrentBalance(transacoes) {
    if (!transacoes.length) return 0;
    
    const lastTransaction = transacoes
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    return parseFloat(lastTransaction.saldo_posterior || 0);
  }

  calculateSkillLevel(chutes) {
    if (!chutes.length) return { accuracy: 0 };
    
    const goals = chutes.filter(c => c.gol_marcado).length;
    return {
      accuracy: goals / chutes.length,
      totalKicks: chutes.length,
      goals: goals
    };
  }
}

module.exports = AnalyticsAI;
