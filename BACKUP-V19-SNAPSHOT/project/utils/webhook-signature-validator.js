// Validação de Webhook Signature - Gol de Ouro v1.2.0
// ===================================================
const crypto = require('crypto');

class WebhookSignatureValidator {
  constructor() {
    this.secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    this.allowedAlgorithms = ['sha256', 'sha1'];
    this.maxTimestampDiff = 5 * 60 * 1000; // 5 minutos
  }

  // Validar assinatura do webhook
  validateSignature(payload, signature, timestamp) {
    try {
      // Validar parâmetros básicos
      if (!payload || !signature) {
        return {
          valid: false,
          error: 'Payload e signature são obrigatórios'
        };
      }

      // Garantir secret configurado
      if (!this.secret) {
        return {
          valid: false,
          error: 'MERCADOPAGO_WEBHOOK_SECRET não configurado'
        };
      }

      // Validar timestamp (prevenir replay attacks)
      if (timestamp) {
        const timestampValidation = this.validateTimestamp(timestamp);
        if (!timestampValidation.valid) {
          return {
            valid: false,
            error: timestampValidation.error
          };
        }
      }

      // Extrair algoritmo e hash da signature
      const signatureParts = this.parseSignature(signature);
      if (!signatureParts) {
        return {
          valid: false,
          error: 'Formato de signature inválido'
        };
      }

      // Validar algoritmo
      if (!this.allowedAlgorithms.includes(signatureParts.algorithm)) {
        return {
          valid: false,
          error: `Algoritmo não suportado: ${signatureParts.algorithm}`
        };
      }

      // Calcular hash esperado
      const expectedHash = this.calculateHash(payload, signatureParts.algorithm);
      
      // Comparar hashes
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signatureParts.hash, 'hex'),
        Buffer.from(expectedHash, 'hex')
      );

      if (!isValid) {
        return {
          valid: false,
          error: 'Signature não confere'
        };
      }

      return {
        valid: true,
        algorithm: signatureParts.algorithm,
        hash: signatureParts.hash
      };

    } catch (error) {
      return {
        valid: false,
        error: `Erro na validação da signature: ${error.message}`
      };
    }
  }

  // Validar timestamp
  validateTimestamp(timestamp) {
    try {
      const webhookTime = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = Math.abs(currentTime - webhookTime);

      if (timeDiff > this.maxTimestampDiff / 1000) {
        return {
          valid: false,
          error: 'Timestamp muito antigo ou futuro'
        };
      }

      return {
        valid: true,
        timestamp: webhookTime,
        timeDiff: timeDiff
      };

    } catch (error) {
      return {
        valid: false,
        error: 'Timestamp inválido'
      };
    }
  }

  // Parsear signature
  parseSignature(signature) {
    try {
      // Formato esperado: "sha256=hash" ou "sha1=hash"
      const match = signature.match(/^(sha256|sha1)=([a-f0-9]+)$/i);
      
      if (!match) {
        return null;
      }

      return {
        algorithm: match[1].toLowerCase(),
        hash: match[2].toLowerCase()
      };

    } catch (error) {
      return null;
    }
  }

  // Calcular hash
  calculateHash(payload, algorithm) {
    const hmac = crypto.createHmac(algorithm, this.secret);
    hmac.update(payload, 'utf8');
    return hmac.digest('hex');
  }

  // Validar webhook do Mercado Pago
  validateMercadoPagoWebhook(req) {
    try {
      const signature = req.headers['x-signature'];
      const timestamp = req.headers['x-timestamp'];
      const payload = typeof req.rawBody === 'string' && req.rawBody.length > 0 
        ? req.rawBody 
        : JSON.stringify(req.body);

      if (!signature) {
        return {
          valid: false,
          error: 'Header X-Signature não encontrado'
        };
      }

      const validation = this.validateSignature(payload, signature, timestamp);
      
      if (!validation.valid) {
        return {
          valid: false,
          error: validation.error,
          headers: {
            signature: signature,
            timestamp: timestamp
          }
        };
      }

      return {
        valid: true,
        payload: req.body,
        signature: signature,
        timestamp: timestamp,
        algorithm: validation.algorithm
      };

    } catch (error) {
      return {
        valid: false,
        error: `Erro na validação do webhook: ${error.message}`
      };
    }
  }

  // Validar webhook genérico
  validateGenericWebhook(req, expectedSecret) {
    try {
      const signature = req.headers['x-signature'] || req.headers['x-hub-signature-256'];
      const timestamp = req.headers['x-timestamp'];
      const payload = typeof req.rawBody === 'string' && req.rawBody.length > 0 
        ? req.rawBody 
        : JSON.stringify(req.body);

      if (!signature) {
        return {
          valid: false,
          error: 'Header de signature não encontrado'
        };
      }

      // Usar secret específico se fornecido
      const secret = expectedSecret || this.secret;
      const validator = new WebhookSignatureValidator();
      validator.secret = secret;

      const validation = validator.validateSignature(payload, signature, timestamp);
      
      if (!validation.valid) {
        return {
          valid: false,
          error: validation.error
        };
      }

      return {
        valid: true,
        payload: req.body,
        signature: signature,
        timestamp: timestamp
      };

    } catch (error) {
      return {
        valid: false,
        error: `Erro na validação do webhook genérico: ${error.message}`
      };
    }
  }

  // Middleware para validação automática
  createValidationMiddleware(options = {}) {
    return (req, res, next) => {
      try {
        const validation = this.validateMercadoPagoWebhook(req);
        
        if (!validation.valid) {
          console.error('❌ [WEBHOOK] Signature inválida:', validation.error);
          return res.status(401).json({
            success: false,
            error: 'Webhook signature inválida',
            message: validation.error
          });
        }

        // Adicionar dados de validação ao request
        req.webhookValidation = {
          valid: true,
          algorithm: validation.algorithm,
          timestamp: validation.timestamp
        };

        console.log('✅ [WEBHOOK] Signature válida:', {
          algorithm: validation.algorithm,
          timestamp: validation.timestamp
        });

        next();

      } catch (error) {
        console.error('❌ [WEBHOOK] Erro na validação:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno na validação do webhook'
        });
      }
    };
  }

  // Gerar signature para testes
  generateTestSignature(payload, algorithm = 'sha256') {
    const hash = this.calculateHash(payload, algorithm);
    return `${algorithm}=${hash}`;
  }

  // Validar múltiplas signatures (para compatibilidade)
  validateMultipleSignatures(payload, signatures) {
    const results = [];

    for (const signature of signatures) {
      const validation = this.validateSignature(payload, signature);
      results.push({
        signature: signature,
        valid: validation.valid,
        error: validation.error
      });
    }

    const validSignatures = results.filter(r => r.valid);
    
    return {
      valid: validSignatures.length > 0,
      results: results,
      validSignatures: validSignatures
    };
  }

  // Log de validação para auditoria
  logValidation(validation, req) {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      signature: req.headers['x-signature'],
      timestamp: req.headers['x-timestamp'],
      valid: validation.valid,
      error: validation.error,
      algorithm: validation.algorithm
    };

    console.log('🔍 [WEBHOOK] Log de validação:', logData);
    
    // Em produção, salvar no banco de dados para auditoria
    return logData;
  }
}

module.exports = WebhookSignatureValidator;
