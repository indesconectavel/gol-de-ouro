// Validação de Integridade dos Lotes - Gol de Ouro v1.2.0
// =======================================================
const crypto = require('crypto');

class LoteIntegrityValidator {
  constructor() {
    // Configurações dos lotes por valor de aposta
    this.batchConfigs = {
      // Alinhado ao modelo de jogo:
      // R$1 → 10 chutes, R$2 → 5 chutes, R$5 → 2 chutes, R$10 → 1 chute
      1: { tamanho: 10, multiplicador: 10 },
      2: { tamanho: 5, multiplicador: 10 },
      5: { tamanho: 2, multiplicador: 10 },
      10: { tamanho: 1, multiplicador: 10 }
    };

    // Cache de validações para performance
    this.validationCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Validar integridade completa de um lote
  validateLoteIntegrity(lote) {
    try {
      const validationId = this.generateValidationId(lote);
      
      // Verificar cache
      const cached = this.getCachedValidation(validationId);
      if (cached) {
        return cached;
      }

      const validation = {
        valid: true,
        errors: [],
        warnings: [],
        metadata: {
          validationId: validationId,
          timestamp: new Date().toISOString(),
          loteId: lote.id,
          valor: lote.valor
        }
      };

      // 1. Validar estrutura básica do lote
      const structureValidation = this.validateLoteStructure(lote);
      if (!structureValidation.valid) {
        validation.valid = false;
        validation.errors.push(...structureValidation.errors);
      }

      // 2. Validar configuração do lote
      const configValidation = this.validateLoteConfig(lote);
      if (!configValidation.valid) {
        validation.valid = false;
        validation.errors.push(...configValidation.errors);
      }

      // 3. Validar índice do vencedor
      const winnerValidation = this.validateWinnerIndex(lote);
      if (!winnerValidation.valid) {
        validation.valid = false;
        validation.errors.push(...winnerValidation.errors);
      }

      // 4. Validar chutes
      const shotsValidation = this.validateShots(lote);
      if (!shotsValidation.valid) {
        validation.valid = false;
        validation.errors.push(...shotsValidation.errors);
      }

      // 5. Validar consistência dos dados
      const consistencyValidation = this.validateConsistency(lote);
      if (!consistencyValidation.valid) {
        validation.valid = false;
        validation.errors.push(...consistencyValidation.errors);
      }

      // 6. Validar hash de integridade
      const hashValidation = this.validateIntegrityHash(lote);
      if (!hashValidation.valid) {
        validation.warnings.push(...hashValidation.warnings);
      }

      // Cachear resultado
      this.cacheValidation(validationId, validation);

      return validation;

    } catch (error) {
      return {
        valid: false,
        errors: [`Erro na validação de integridade: ${error.message}`],
        warnings: [],
        metadata: {
          timestamp: new Date().toISOString(),
          error: error.message
        }
      };
    }
  }

  // Validar estrutura básica do lote
  validateLoteStructure(lote) {
    const errors = [];

    if (!lote) {
      errors.push('Lote não pode ser nulo');
      return { valid: false, errors };
    }

    if (!lote.id) {
      errors.push('ID do lote é obrigatório');
    }

    if (!lote.valor) {
      errors.push('Valor do lote é obrigatório');
    }

    if (!Array.isArray(lote.chutes)) {
      errors.push('Chutes deve ser um array');
    }

    if (typeof lote.winnerIndex !== 'number') {
      errors.push('Índice do vencedor deve ser um número');
    }

    if (typeof lote.ativo !== 'boolean') {
      errors.push('Status ativo deve ser um booleano');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Validar configuração do lote
  validateLoteConfig(lote) {
    const errors = [];

    if (!this.batchConfigs[lote.valor]) {
      errors.push(`Valor de lote inválido: ${lote.valor}`);
      return { valid: false, errors };
    }

    const config = this.batchConfigs[lote.valor];
    const expectedSize = config.tamanho;

    if (lote.chutes.length > expectedSize) {
      errors.push(`Lote excedeu tamanho máximo: ${lote.chutes.length}/${expectedSize}`);
    }

    if (lote.winnerIndex >= expectedSize) {
      errors.push(`Índice do vencedor inválido: ${lote.winnerIndex}/${expectedSize}`);
    }

    if (lote.winnerIndex < 0) {
      errors.push('Índice do vencedor não pode ser negativo');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Validar índice do vencedor
  validateWinnerIndex(lote) {
    const errors = [];

    if (lote.winnerIndex < 0) {
      errors.push('Índice do vencedor não pode ser negativo');
    }

    const config = this.batchConfigs[lote.valor];
    if (config && lote.winnerIndex >= config.tamanho) {
      errors.push(`Índice do vencedor excede tamanho do lote: ${lote.winnerIndex}/${config.tamanho}`);
    }

    // O vencedor pode estar em qualquer posição válida do lote; não restringir ao número atual de chutes

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Validar chutes
  validateShots(lote) {
    const errors = [];

    if (!Array.isArray(lote.chutes)) {
      errors.push('Chutes deve ser um array');
      return { valid: false, errors };
    }

    // Validar cada chute
    lote.chutes.forEach((chute, index) => {
      if (!chute) {
        errors.push(`Chute ${index} não pode ser nulo`);
        return;
      }

      if (!chute.direction) {
        errors.push(`Chute ${index} deve ter direção`);
      }

      if (!chute.amount) {
        errors.push(`Chute ${index} deve ter valor`);
      }

      if (!chute.timestamp) {
        errors.push(`Chute ${index} deve ter timestamp`);
      }

      if (!chute.userId) {
        errors.push(`Chute ${index} deve ter userId`);
      }

      // Validar direção
      const validDirections = ['TL', 'TR', 'C', 'BL', 'BR'];
      if (chute.direction && !validDirections.includes(chute.direction)) {
        errors.push(`Chute ${index} tem direção inválida: ${chute.direction}`);
      }

      // Validar valor
      if (chute.amount && chute.amount !== lote.valor) {
        errors.push(`Chute ${index} tem valor inconsistente: ${chute.amount} (esperado: ${lote.valor})`);
      }
    });

    // É permitido o mesmo usuário chutar várias vezes no mesmo lote

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Validar consistência dos dados
  validateConsistency(lote) {
    const errors = [];

    // Verificar se o lote está completo
    const config = this.batchConfigs[lote.valor];
    if (config) {
      const isComplete = lote.chutes.length >= config.tamanho;
      
      if (isComplete && lote.winnerIndex >= lote.chutes.length) {
        errors.push('Lote completo mas índice do vencedor inválido');
      }

      // O índice do vencedor pode ser pré-definido; não validar aqui enquanto o lote não estiver completo
    }

    // Verificar se há chutes após o vencedor
    if (lote.chutes.length > lote.winnerIndex + 1) {
      errors.push('Há chutes após o vencedor do lote');
    }

    // Verificar timestamps dos chutes
    const timestamps = lote.chutes.map(chute => new Date(chute.timestamp));
    for (let i = 1; i < timestamps.length; i++) {
      if (timestamps[i] < timestamps[i-1]) {
        errors.push(`Chute ${i} tem timestamp anterior ao chute ${i-1}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // Validar hash de integridade
  validateIntegrityHash(lote) {
    const warnings = [];

    if (!lote.integrityHash) {
      warnings.push('Lote não possui hash de integridade');
      return { valid: false, warnings };
    }

    // Calcular hash esperado
    const expectedHash = this.calculateIntegrityHash(lote);
    
    if (lote.integrityHash !== expectedHash) {
      warnings.push('Hash de integridade não confere');
    }

    return {
      valid: warnings.length === 0,
      warnings: warnings
    };
  }

  // Calcular hash de integridade
  calculateIntegrityHash(lote) {
    const data = {
      id: lote.id,
      valor: lote.valor,
      winnerIndex: lote.winnerIndex,
      chutes: lote.chutes.map(chute => ({
        direction: chute.direction,
        amount: chute.amount,
        userId: chute.userId,
        timestamp: chute.timestamp
      }))
    };

    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  // Gerar ID de validação
  generateValidationId(lote) {
    const data = `${lote.id}_${lote.valor}_${lote.chutes.length}_${lote.winnerIndex}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  // Cache de validações
  getCachedValidation(validationId) {
    const cached = this.validationCache.get(validationId);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result;
    }
    return null;
  }

  cacheValidation(validationId, result) {
    this.validationCache.set(validationId, {
      result: result,
      timestamp: Date.now()
    });
  }

  // Validar lote antes de processar chute
  validateBeforeShot(lote, shotData) {
    try {
      // Validar integridade do lote
      const integrityValidation = this.validateLoteIntegrity(lote);
      if (!integrityValidation.valid) {
        return {
          valid: false,
          error: 'Lote com problemas de integridade',
          details: integrityValidation.errors
        };
      }

      // Validar se o lote ainda aceita chutes
      const config = this.batchConfigs[lote.valor];
      if (lote.chutes.length >= config.tamanho) {
        return {
          valid: false,
          error: 'Lote já está completo'
        };
      }

      // Validar dados do chute
      if (!shotData.direction || !shotData.amount || !shotData.userId) {
        return {
          valid: false,
          error: 'Dados do chute incompletos'
        };
      }

      // Permitir múltiplos chutes do mesmo usuário no mesmo lote
      // (regra do jogo: um mesmo jogador pode chutar mais de uma vez no lote)

      return {
        valid: true,
        lote: lote,
        shotData: shotData
      };

    } catch (error) {
      return {
        valid: false,
        error: `Erro na validação: ${error.message}`
      };
    }
  }

  // Validar lote após processar chute
  validateAfterShot(lote, shotResult) {
    try {
      // Pós‑chute: validar apenas o essencial para não bloquear fluxo legítimo

      // Validar resultado do chute
      if (!shotResult) {
        return {
          valid: false,
          error: 'Resultado do chute não pode ser nulo'
        };
      }

      // Validar se o resultado está correto
      const expectedResult = lote.chutes.length - 1 === lote.winnerIndex ? 'goal' : 'miss';
      if (shotResult.result !== expectedResult) {
        return {
          valid: false,
          error: `Resultado do chute incorreto: esperado ${expectedResult}, recebido ${shotResult.result}`
        };
      }

      return {
        valid: true,
        lote: lote,
        shotResult: shotResult
      };

    } catch (error) {
      return {
        valid: false,
        error: `Erro na validação pós-chute: ${error.message}`
      };
    }
  }
}

module.exports = LoteIntegrityValidator;
