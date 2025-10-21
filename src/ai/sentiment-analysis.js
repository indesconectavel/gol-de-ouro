// Sistema de Análise de Sentimento - Gol de Ouro v1.1.1
class SentimentAnalysis {
  constructor() {
    this.lexicon = this.buildSentimentLexicon();
    this.contextRules = this.buildContextRules();
  }

  // Analisar sentimento de texto
  analyze(text) {
    const words = this.tokenize(text);
    const sentiment = this.calculateSentiment(words);
    const context = this.analyzeContext(text);
    
    return {
      score: sentiment.score,
      magnitude: sentiment.magnitude,
      label: this.getSentimentLabel(sentiment.score),
      confidence: sentiment.confidence,
      context: context,
      keywords: sentiment.keywords,
      timestamp: new Date().toISOString()
    };
  }

  // Analisar sentimento de feedback de usuários
  async analyzeUserFeedback(userId, timeframe = '30d') {
    try {
      // Simular busca de feedback do usuário
      const feedbacks = await this.getUserFeedbacks(userId, timeframe);
      
      const analyses = feedbacks.map(feedback => ({
        id: feedback.id,
        text: feedback.text,
        sentiment: this.analyze(feedback.text),
        category: this.categorizeFeedback(feedback.text)
      }));

      const overallSentiment = this.calculateOverallSentiment(analyses);
      
      return {
        userId,
        timeframe,
        overallSentiment,
        individualAnalyses: analyses,
        summary: this.generateSentimentSummary(overallSentiment, analyses)
      };
    } catch (error) {
      console.error('Erro na análise de sentimento:', error);
      throw error;
    }
  }

  // Tokenizar texto
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
  }

  // Calcular sentimento
  calculateSentiment(words) {
    let positiveScore = 0;
    let negativeScore = 0;
    let keywords = [];

    words.forEach(word => {
      if (this.lexicon.positive[word]) {
        positiveScore += this.lexicon.positive[word];
        keywords.push({ word, type: 'positive', weight: this.lexicon.positive[word] });
      }
      if (this.lexicon.negative[word]) {
        negativeScore += this.lexicon.negative[word];
        keywords.push({ word, type: 'negative', weight: this.lexicon.negative[word] });
      }
    });

    const totalWords = words.length;
    const score = (positiveScore - negativeScore) / Math.max(totalWords, 1);
    const magnitude = Math.abs(positiveScore + negativeScore) / Math.max(totalWords, 1);
    const confidence = Math.min(1, magnitude * 2);

    return {
      score: Math.max(-1, Math.min(1, score)),
      magnitude: magnitude,
      confidence: confidence,
      keywords: keywords.sort((a, b) => b.weight - a.weight)
    };
  }

  // Analisar contexto
  analyzeContext(text) {
    const contexts = [];

    // Verificar contexto de jogo
    if (this.containsGameContext(text)) {
      contexts.push('game_related');
    }

    // Verificar contexto de pagamento
    if (this.containsPaymentContext(text)) {
      contexts.push('payment_related');
    }

    // Verificar contexto de suporte
    if (this.containsSupportContext(text)) {
      contexts.push('support_related');
    }

    // Verificar urgência
    if (this.containsUrgency(text)) {
      contexts.push('urgent');
    }

    return contexts;
  }

  // Obter label do sentimento
  getSentimentLabel(score) {
    if (score > 0.3) return 'positive';
    if (score < -0.3) return 'negative';
    return 'neutral';
  }

  // Categorizar feedback
  categorizeFeedback(text) {
    const categories = [];

    if (this.containsComplaint(text)) {
      categories.push('complaint');
    }
    if (this.containsSuggestion(text)) {
      categories.push('suggestion');
    }
    if (this.containsPraise(text)) {
      categories.push('praise');
    }
    if (this.containsBugReport(text)) {
      categories.push('bug_report');
    }
    if (this.containsFeatureRequest(text)) {
      categories.push('feature_request');
    }

    return categories.length > 0 ? categories : ['general'];
  }

  // Calcular sentimento geral
  calculateOverallSentiment(analyses) {
    const scores = analyses.map(a => a.sentiment.score);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = this.calculateVariance(scores);
    
    return {
      score: avgScore,
      label: this.getSentimentLabel(avgScore),
      confidence: Math.max(0, 1 - variance),
      distribution: {
        positive: analyses.filter(a => a.sentiment.label === 'positive').length,
        negative: analyses.filter(a => a.sentiment.label === 'negative').length,
        neutral: analyses.filter(a => a.sentiment.label === 'neutral').length
      }
    };
  }

  // Gerar resumo do sentimento
  generateSentimentSummary(overallSentiment, analyses) {
    const total = analyses.length;
    const positive = overallSentiment.distribution.positive;
    const negative = overallSentiment.distribution.negative;
    const neutral = overallSentiment.distribution.neutral;

    let summary = `Análise de ${total} feedbacks: `;
    
    if (overallSentiment.label === 'positive') {
      summary += `${positive} positivos (${Math.round(positive/total*100)}%), ${neutral} neutros, ${negative} negativos. Sentimento geral positivo.`;
    } else if (overallSentiment.label === 'negative') {
      summary += `${negative} negativos (${Math.round(negative/total*100)}%), ${neutral} neutros, ${positive} positivos. Sentimento geral negativo.`;
    } else {
      summary += `${neutral} neutros (${Math.round(neutral/total*100)}%), ${positive} positivos, ${negative} negativos. Sentimento geral neutro.`;
    }

    return summary;
  }

  // Construir léxico de sentimento
  buildSentimentLexicon() {
    return {
      positive: {
        'excelente': 0.8,
        'otimo': 0.7,
        'bom': 0.6,
        'perfeito': 0.9,
        'fantastico': 0.8,
        'incrivel': 0.7,
        'adorei': 0.8,
        'amei': 0.9,
        'recomendo': 0.6,
        'funciona': 0.5,
        'rapido': 0.4,
        'facil': 0.4,
        'intuitivo': 0.5,
        'divertido': 0.6,
        'emocionante': 0.7,
        'satisfeito': 0.6,
        'feliz': 0.7,
        'gostei': 0.6,
        'legal': 0.5,
        'show': 0.6,
        'top': 0.7,
        'massa': 0.5,
        'demais': 0.6,
        'sensacional': 0.8,
        'maravilhoso': 0.8,
        'genial': 0.7,
        'brilhante': 0.7,
        'formidavel': 0.8,
        'espetacular': 0.8,
        'magnifico': 0.9
      },
      negative: {
        'ruim': -0.6,
        'pessimo': -0.8,
        'terrivel': -0.9,
        'horrivel': -0.9,
        'odiei': -0.8,
        'detestei': -0.8,
        'lento': -0.4,
        'difcil': -0.4,
        'confuso': -0.5,
        'chato': -0.5,
        'entediante': -0.6,
        'frustrante': -0.7,
        'irritante': -0.6,
        'inaceitavel': -0.8,
        'inutil': -0.7,
        'desperdicio': -0.6,
        'perda': -0.5,
        'problema': -0.4,
        'erro': -0.5,
        'bug': -0.6,
        'falha': -0.6,
        'defeito': -0.5,
        'quebrado': -0.7,
        'nao': -0.3,
        'nunca': -0.4,
        'jamais': -0.5,
        'impossivel': -0.6,
        'inaceitavel': -0.8,
        'ridiculo': -0.7,
        'absurdo': -0.7,
        'escandaloso': -0.8
      }
    };
  }

  // Construir regras de contexto
  buildContextRules() {
    return {
      gameContext: ['jogo', 'partida', 'chute', 'gol', 'aposta', 'fila', 'jogador'],
      paymentContext: ['pix', 'pagamento', 'deposito', 'saque', 'saldo', 'dinheiro', 'valor'],
      supportContext: ['ajuda', 'suporte', 'problema', 'erro', 'bug', 'dificuldade'],
      urgency: ['urgente', 'rapido', 'imediato', 'agora', 'ja', 'urgentemente']
    };
  }

  // Verificar contexto de jogo
  containsGameContext(text) {
    return this.contextRules.gameContext.some(word => 
      text.toLowerCase().includes(word)
    );
  }

  // Verificar contexto de pagamento
  containsPaymentContext(text) {
    return this.contextRules.paymentContext.some(word => 
      text.toLowerCase().includes(word)
    );
  }

  // Verificar contexto de suporte
  containsSupportContext(text) {
    return this.contextRules.supportContext.some(word => 
      text.toLowerCase().includes(word)
    );
  }

  // Verificar urgência
  containsUrgency(text) {
    return this.contextRules.urgency.some(word => 
      text.toLowerCase().includes(word)
    );
  }

  // Verificar reclamação
  containsComplaint(text) {
    const complaintWords = ['reclamo', 'reclamacao', 'problema', 'erro', 'bug', 'falha', 'nao funciona'];
    return complaintWords.some(word => text.toLowerCase().includes(word));
  }

  // Verificar sugestão
  containsSuggestion(text) {
    const suggestionWords = ['sugestao', 'sugiro', 'poderia', 'seria bom', 'melhorar', 'adicionar'];
    return suggestionWords.some(word => text.toLowerCase().includes(word));
  }

  // Verificar elogio
  containsPraise(text) {
    const praiseWords = ['parabens', 'otimo', 'excelente', 'perfeito', 'adorei', 'amei'];
    return praiseWords.some(word => text.toLowerCase().includes(word));
  }

  // Verificar relatório de bug
  containsBugReport(text) {
    const bugWords = ['bug', 'erro', 'falha', 'nao funciona', 'travou', 'crash'];
    return bugWords.some(word => text.toLowerCase().includes(word));
  }

  // Verificar solicitação de funcionalidade
  containsFeatureRequest(text) {
    const featureWords = ['adicionar', 'implementar', 'criar', 'novo', 'funcionalidade', 'recurso'];
    return featureWords.some(word => text.toLowerCase().includes(word));
  }

  // Calcular variância
  calculateVariance(scores) {
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    return Math.sqrt(variance);
  }

  // Simular busca de feedbacks do usuário
  async getUserFeedbacks(userId, timeframe) {
    // Em uma implementação real, isso buscaria dados do banco
    return [
      {
        id: 'feedback-1',
        text: 'Adorei o jogo, muito divertido!',
        created_at: new Date().toISOString()
      },
      {
        id: 'feedback-2',
        text: 'O sistema de pagamento está muito lento',
        created_at: new Date().toISOString()
      },
      {
        id: 'feedback-3',
        text: 'Poderia adicionar mais opções de chute?',
        created_at: new Date().toISOString()
      }
    ];
  }
}

module.exports = SentimentAnalysis;
