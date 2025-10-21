// Sistema de Chatbot IA - Gol de Ouro v1.1.1
const SentimentAnalysis = require('./sentiment-analysis');

class GolDeOuroChatbot {
  constructor() {
    this.sentimentAnalysis = new SentimentAnalysis();
    this.intents = this.buildIntentDatabase();
    this.responses = this.buildResponseDatabase();
    this.context = new Map();
  }

  // Processar mensagem do usuário
  async processMessage(userId, message, sessionId = null) {
    try {
      // Analisar sentimento da mensagem
      const sentiment = this.sentimentAnalysis.analyze(message);
      
      // Identificar intenção
      const intent = this.identifyIntent(message);
      
      // Obter contexto da sessão
      const sessionContext = this.getSessionContext(sessionId || userId);
      
      // Gerar resposta
      const response = await this.generateResponse(intent, sentiment, sessionContext, userId);
      
      // Atualizar contexto
      this.updateSessionContext(sessionId || userId, {
        lastMessage: message,
        lastIntent: intent,
        sentiment: sentiment,
        timestamp: new Date().toISOString()
      });
      
      return {
        response: response.text,
        intent: intent.name,
        confidence: intent.confidence,
        sentiment: sentiment,
        suggestions: response.suggestions,
        quickActions: response.quickActions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Erro no processamento da mensagem:', error);
      return this.getErrorResponse();
    }
  }

  // Identificar intenção da mensagem
  identifyIntent(message) {
    const lowerMessage = message.toLowerCase();
    let bestMatch = { name: 'general', confidence: 0.1, keywords: [] };
    
    for (const [intentName, intent] of Object.entries(this.intents)) {
      const confidence = this.calculateIntentConfidence(lowerMessage, intent);
      
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          name: intentName,
          confidence: confidence,
          keywords: intent.keywords,
          patterns: intent.patterns
        };
      }
    }
    
    return bestMatch;
  }

  // Calcular confiança da intenção
  calculateIntentConfidence(message, intent) {
    let score = 0;
    let totalKeywords = 0;
    
    // Verificar palavras-chave
    intent.keywords.forEach(keyword => {
      if (message.includes(keyword.toLowerCase())) {
        score += 1;
      }
      totalKeywords += 1;
    });
    
    // Verificar padrões regex
    intent.patterns.forEach(pattern => {
      if (pattern.test(message)) {
        score += 2; // Padrões têm peso maior
      }
    });
    
    return totalKeywords > 0 ? score / totalKeywords : 0;
  }

  // Gerar resposta
  async generateResponse(intent, sentiment, context, userId) {
    const responseTemplate = this.responses[intent.name] || this.responses.general;
    
    let response = this.selectResponse(responseTemplate, sentiment);
    
    // Personalizar resposta baseada no contexto
    response = this.personalizeResponse(response, context, userId);
    
    // Adicionar sugestões baseadas na intenção
    const suggestions = this.generateSuggestions(intent, context);
    
    // Adicionar ações rápidas
    const quickActions = this.generateQuickActions(intent, context);
    
    return {
      text: response,
      suggestions: suggestions,
      quickActions: quickActions
    };
  }

  // Selecionar resposta baseada no sentimento
  selectResponse(templates, sentiment) {
    if (sentiment.label === 'negative' && templates.negative) {
      return templates.negative[Math.floor(Math.random() * templates.negative.length)];
    } else if (sentiment.label === 'positive' && templates.positive) {
      return templates.positive[Math.floor(Math.random() * templates.positive.length)];
    } else {
      return templates.neutral[Math.floor(Math.random() * templates.neutral.length)];
    }
  }

  // Personalizar resposta
  personalizeResponse(response, context, userId) {
    // Substituir placeholders
    response = response.replace('{userName}', context.userName || 'Jogador');
    response = response.replace('{gameName}', 'Gol de Ouro');
    
    // Adicionar informações contextuais
    if (context.lastIntent === 'balance' && context.balance) {
      response += ` Seu saldo atual é R$ ${context.balance.toFixed(2)}.`;
    }
    
    return response;
  }

  // Gerar sugestões
  generateSuggestions(intent, context) {
    const suggestions = [];
    
    switch (intent.name) {
      case 'greeting':
        suggestions.push('Como jogar?', 'Ver meu saldo', 'Entrar na fila');
        break;
      case 'balance':
        suggestions.push('Fazer depósito', 'Ver extrato', 'Solicitar saque');
        break;
      case 'game':
        suggestions.push('Entrar na fila', 'Ver ranking', 'Histórico de partidas');
        break;
      case 'payment':
        suggestions.push('Depositar via PIX', 'Ver status do pagamento', 'Configurar PIX');
        break;
      case 'support':
        suggestions.push('Reportar problema', 'Falar com suporte', 'Ver FAQ');
        break;
      default:
        suggestions.push('Ajuda', 'Contato', 'Configurações');
    }
    
    return suggestions.slice(0, 3); // Máximo 3 sugestões
  }

  // Gerar ações rápidas
  generateQuickActions(intent, context) {
    const actions = [];
    
    switch (intent.name) {
      case 'balance':
        actions.push({ text: 'Depositar', action: 'deposit', icon: '💰' });
        actions.push({ text: 'Saque', action: 'withdraw', icon: '💸' });
        break;
      case 'game':
        actions.push({ text: 'Jogar', action: 'play', icon: '⚽' });
        actions.push({ text: 'Ranking', action: 'ranking', icon: '🏆' });
        break;
      case 'support':
        actions.push({ text: 'FAQ', action: 'faq', icon: '❓' });
        actions.push({ text: 'Contato', action: 'contact', icon: '📞' });
        break;
    }
    
    return actions.slice(0, 2); // Máximo 2 ações
  }

  // Obter contexto da sessão
  getSessionContext(sessionId) {
    return this.context.get(sessionId) || {
      userName: null,
      balance: null,
      lastIntent: null,
      messageCount: 0,
      createdAt: new Date().toISOString()
    };
  }

  // Atualizar contexto da sessão
  updateSessionContext(sessionId, data) {
    const currentContext = this.getSessionContext(sessionId);
    this.context.set(sessionId, {
      ...currentContext,
      ...data,
      messageCount: currentContext.messageCount + 1,
      lastUpdated: new Date().toISOString()
    });
  }

  // Resposta de erro
  getErrorResponse() {
    return {
      response: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.',
      intent: 'error',
      confidence: 1.0,
      sentiment: { label: 'neutral', score: 0 },
      suggestions: ['Tentar novamente', 'Falar com suporte'],
      quickActions: [],
      timestamp: new Date().toISOString()
    };
  }

  // Construir base de dados de intenções
  buildIntentDatabase() {
    return {
      greeting: {
        keywords: ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'e aí'],
        patterns: [/^(oi|olá|hey)$/i, /bom\s+(dia|tarde|noite)/i]
      },
      balance: {
        keywords: ['saldo', 'dinheiro', 'valor', 'quanto tenho', 'meu saldo'],
        patterns: [/saldo/i, /quanto\s+(tenho|posso)/i, /meu\s+dinheiro/i]
      },
      game: {
        keywords: ['jogar', 'partida', 'fila', 'chute', 'gol', 'jogo'],
        patterns: [/como\s+jogar/i, /entrar\s+na\s+fila/i, /fazer\s+chute/i]
      },
      payment: {
        keywords: ['pix', 'pagamento', 'deposito', 'saque', 'pagar', 'depositar'],
        patterns: [/pix/i, /deposito/i, /saque/i, /como\s+pagar/i]
      },
      support: {
        keywords: ['ajuda', 'suporte', 'problema', 'erro', 'bug', 'dificuldade'],
        patterns: [/preciso\s+de\s+ajuda/i, /como\s+funciona/i, /não\s+entendi/i]
      },
      rules: {
        keywords: ['regras', 'como funciona', 'instruções', 'tutorial'],
        patterns: [/regras\s+do\s+jogo/i, /como\s+funciona/i, /instruções/i]
      },
      ranking: {
        keywords: ['ranking', 'posição', 'melhor', 'top', 'classificação'],
        patterns: [/meu\s+ranking/i, /posição/i, /top\s+players/i]
      },
      withdrawal: {
        keywords: ['sacar', 'saque', 'retirar', 'pix'],
        patterns: [/como\s+sacar/i, /fazer\s+saque/i, /retirar\s+dinheiro/i]
      }
    };
  }

  // Construir base de dados de respostas
  buildResponseDatabase() {
    return {
      greeting: {
        neutral: [
          'Olá! Bem-vindo ao Gol de Ouro! Como posso te ajudar hoje?',
          'Oi! Estou aqui para te ajudar com o jogo. O que você gostaria de saber?',
          'E aí! Pronto para marcar alguns gols? Como posso te auxiliar?'
        ],
        positive: [
          'Oi! Que bom te ver por aqui! Como posso te ajudar hoje?',
          'Olá! Fico feliz em te ajudar! O que você gostaria de saber?'
        ],
        negative: [
          'Olá! Vejo que você pode estar com alguma dificuldade. Como posso te ajudar?',
          'Oi! Estou aqui para resolver qualquer problema. O que está acontecendo?'
        ]
      },
      balance: {
        neutral: [
          'Seu saldo atual é R$ {balance}. Você pode depositar mais ou fazer um saque.',
          'Atualmente você tem R$ {balance} disponível. Precisa de ajuda com transações?',
          'Seu saldo: R$ {balance}. Posso te ajudar com depósitos ou saques.'
        ],
        positive: [
          'Ótimo! Seu saldo está em R$ {balance}. Continue assim!',
          'Excelente! Você tem R$ {balance} disponível. Quer jogar mais?'
        ],
        negative: [
          'Seu saldo atual é R$ {balance}. Posso te ajudar a fazer um depósito?',
          'Vejo que seu saldo está baixo (R$ {balance}). Quer que eu te ajude a depositar?'
        ]
      },
      game: {
        neutral: [
          'Para jogar, você precisa entrar na fila e aguardar outros jogadores. Cada partida tem 10 jogadores.',
          'O jogo funciona assim: entre na fila, aguarde formar uma partida de 10 jogadores, faça sua aposta e chute!',
          'É simples: fila → partida → aposta → chute → resultado! Quer que eu explique melhor?'
        ],
        positive: [
          'Que legal que você quer jogar! É muito divertido! Entre na fila e se divirta!',
          'Ótimo! O jogo é incrível! Vou te explicar como funciona...'
        ],
        negative: [
          'Entendo que pode parecer complicado, mas é bem simples! Deixe-me te explicar...',
          'Não se preocupe! Vou te ajudar a entender como jogar...'
        ]
      },
      payment: {
        neutral: [
          'Para depositar, use PIX. É rápido e seguro! Para saques, configure sua chave PIX.',
          'Depósitos são via PIX e saques também. Posso te ajudar com algum deles?',
          'PIX é nossa forma de pagamento. Quer depositar ou fazer um saque?'
        ],
        positive: [
          'Ótimo! PIX é a melhor forma de pagamento! Rápido e seguro!',
          'Excelente escolha! PIX é super prático!'
        ],
        negative: [
          'Entendo sua preocupação com pagamentos. PIX é muito seguro! Posso te ajudar?',
          'Não se preocupe! PIX é confiável. Deixe-me te explicar...'
        ]
      },
      support: {
        neutral: [
          'Estou aqui para te ajudar! Qual é o problema?',
          'Como posso te auxiliar? Descreva o que está acontecendo.',
          'Vou te ajudar a resolver isso! Me conte mais detalhes.'
        ],
        positive: [
          'Que bom que você está gostando! Como posso te ajudar ainda mais?',
          'Fico feliz em saber! Precisa de mais alguma coisa?'
        ],
        negative: [
          'Entendo sua frustração. Vamos resolver isso juntos!',
          'Sinto muito pelo problema. Vou te ajudar a resolver!'
        ]
      },
      general: {
        neutral: [
          'Como posso te ajudar hoje?',
          'O que você gostaria de saber?',
          'Estou aqui para te auxiliar!'
        ]
      }
    };
  }
}

module.exports = GolDeOuroChatbot;
