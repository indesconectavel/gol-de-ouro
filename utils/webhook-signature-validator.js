// Validação de Webhook Signature - Gol de Ouro v1.2.0
// ===================================================
const crypto = require('crypto');

/**
 * Formato real do header X-Signature do Mercado Pago: "ts=...,v1=..."
 * @param {string} xSignature
 * @returns {{ ts: string, v1: string } | null}
 */
function parseMercadoPagoTsV1(xSignature) {
  if (!xSignature || typeof xSignature !== 'string') return null;
  const out = {};
  for (const part of xSignature.split(',')) {
    const trimmed = part.trim();
    const i = trimmed.indexOf('=');
    if (i === -1) continue;
    const key = trimmed.slice(0, i).trim();
    const value = trimmed.slice(i + 1).trim();
    if (key === 'ts' || key === 'v1') {
      out[key] = value;
    }
  }
  if (!out.ts || !out.v1) return null;
  return { ts: String(out.ts), v1: String(out.v1) };
}

function firstScalar(v) {
  if (v === undefined || v === null) return null;
  if (Array.isArray(v)) {
    return v[0] !== undefined && v[0] !== null && String(v[0]).length > 0
      ? String(v[0])
      : null;
  }
  return String(v).length > 0 ? String(v) : null;
}

/** @param {object} req — Express request */
function getMercadoPagoWebhookDataId(req) {
  const q = req.query && firstScalar(req.query['data.id']);
  if (q) return q;
  const b = req.body && req.body.data && firstScalar(req.body.data.id);
  return b || null;
}

/**
 * Manifest exato exigido pelo Mercado Pago (notificações v2)
 */
function buildMercadoPagoSignatureManifest(dataId, requestId, ts) {
  return `id:${dataId};request-id:${requestId};ts:${ts};`;
}

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

  /**
   * ts do header X-Signature (Mercado Pago) em segundos Unix.
   * Janela: MERCADOPAGO_WEBHOOK_MAX_TS_SKEW_MS (milissegundos), default 30 min.
   * Não altera validateTimestamp (5 min) usada por outros fluxos.
   */
  validateMercadoPagoSignatureTs(ts) {
    try {
      const defaultMs = 30 * 60 * 1000;
      const raw = process.env.MERCADOPAGO_WEBHOOK_MAX_TS_SKEW_MS;
      let maxSkewMs = defaultMs;
      if (raw != null && String(raw).trim() !== '') {
        const n = parseInt(String(raw).trim(), 10);
        if (Number.isFinite(n) && n > 0) {
          maxSkewMs = n;
        }
      }
      const maxSkewSec = maxSkewMs / 1000;
      const webhookTime = parseInt(String(ts), 10);
      if (Number.isNaN(webhookTime) || webhookTime < 0) {
        return { valid: false, error: 'Timestamp inválido' };
      }
      const currentTime = Math.floor(Date.now() / 1000);
      const timeDiff = Math.abs(currentTime - webhookTime);
      if (timeDiff > maxSkewSec) {
        return {
          valid: false,
          error: 'Timestamp fora da janela (Mercado Pago)'
        };
      }
      return {
        valid: true,
        timestamp: webhookTime,
        timeDiff
      };
    } catch (error) {
      return { valid: false, error: 'Timestamp inválido' };
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

  // Validar webhook do Mercado Pago (X-Signature: ts=...,v1=... + manifest, sem corpo bruto)
  validateMercadoPagoWebhook(req) {
    try {
      if (!this.secret) {
        return {
          valid: false,
          error: 'MERCADOPAGO_WEBHOOK_SECRET não configurado'
        };
      }

      const xSignature = req.headers['x-signature'];
      if (!xSignature) {
        return {
          valid: false,
          error: 'Header X-Signature não encontrado'
        };
      }

      const parsed = parseMercadoPagoTsV1(xSignature);
      if (!parsed) {
        return {
          valid: false,
          error: 'Formato de X-Signature inválido (esperado ts=...,v1=...)'
        };
      }

      const { ts, v1 } = parsed;
      const tsCheck = this.validateMercadoPagoSignatureTs(ts);
      if (!tsCheck.valid) {
        return {
          valid: false,
          error: tsCheck.error
        };
      }

      const dataId = getMercadoPagoWebhookDataId(req);
      if (!dataId) {
        return {
          valid: false,
          error: 'data.id ausente (query ou body.data.id)'
        };
      }

      const requestId = req.headers['x-request-id'];
      if (requestId === undefined || requestId === null || String(requestId).length === 0) {
        return {
          valid: false,
          error: 'Header x-request-id ausente'
        };
      }

      const manifest = buildMercadoPagoSignatureManifest(
        dataId,
        String(requestId),
        String(ts)
      );

      const expectedHex = crypto
        .createHmac('sha256', this.secret)
        .update(manifest, 'utf8')
        .digest('hex');
      const v1Norm = String(v1).trim().toLowerCase();
      if (!/^[0-9a-f]+$/.test(v1Norm) || v1Norm.length % 2 !== 0) {
        return { valid: false, error: 'v1 de assinatura inválida' };
      }
      if (!/^[0-9a-f]+$/i.test(expectedHex) || expectedHex.length !== v1Norm.length) {
        return { valid: false, error: 'Comprimento de assinatura incompatível' };
      }

      const expectedBuf = Buffer.from(expectedHex, 'hex');
      const v1Buf = Buffer.from(v1Norm, 'hex');
      if (expectedBuf.length !== v1Buf.length) {
        return { valid: false, error: 'Comprimento de assinatura incompatível' };
      }

      const isValid = crypto.timingSafeEqual(expectedBuf, v1Buf);
      if (!isValid) {
        return {
          valid: false,
          error: 'Assinatura v1 não confere com o manifest',
          headers: { signature: xSignature, ts, requestId: String(requestId) }
        };
      }

      return {
        valid: true,
        payload: req.body,
        signature: xSignature,
        timestamp: String(ts),
        algorithm: 'sha256',
        manifest
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

/**
 * Debug controlado: não altera validação nem crédito.
 * Com MERCADOPAGO_WEBHOOK_DEBUG_LOG=1 loga headers e o manifest de assinatura (sem usar body bruto).
 */
function logMercadoPagoWebhookDebugRequest(req) {
  if (String(process.env.MERCADOPAGO_WEBHOOK_DEBUG_LOG || '') !== '1') {
    return;
  }
  try {
    const dataId = getMercadoPagoWebhookDataId(req);
    const requestId = req.headers['x-request-id'];
    const parsed = parseMercadoPagoTsV1(req.headers['x-signature']);
    const manifest =
      dataId && requestId && parsed
        ? buildMercadoPagoSignatureManifest(String(dataId), String(requestId), String(parsed.ts))
        : null;
    const snapshot = {
      'x-signature': req.headers['x-signature'],
      'x-request-id': requestId,
      'query.data.id': req.query && req.query['data.id'],
      query: req.query,
      'body.data.id': req.body && req.body.data && req.body.data.id,
      body: req.body,
      headers: req.headers,
      manifestUsadoPelaValidacao: manifest
    };
    console.log('🔬 [MP WEBHOOK DEBUG]', JSON.stringify(snapshot, null, 2));
  } catch (e) {
    console.error('🔬 [MP WEBHOOK DEBUG] falha ao serializar:', e && e.message);
  }
}

module.exports = WebhookSignatureValidator;
module.exports.logMercadoPagoWebhookDebugRequest = logMercadoPagoWebhookDebugRequest;
