// Validação de Webhook Signature - Gol de Ouro v1.2.0
// ===================================================
const crypto = require('crypto');

class WebhookSignatureValidator {
  constructor() {
    this.secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    this.allowedAlgorithms = ['sha256', 'sha1'];
    this.maxTimestampDiff = 5 * 60 * 1000; // 5 minutos (fluxo legado x-timestamp)
    /** Janela para ts do header x-signature (Mercado Pago) — segundos */
    this.mpTsMaxSkewSec = parseInt(process.env.MP_WEBHOOK_TS_SKEW_SEC || '600', 10);
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
      const webhookTime = parseInt(timestamp, 10);
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

  // Parsear signature (GitHub / padrão sha256= — não é o formato do Mercado Pago)
  parseSignature(signature) {
    try {
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

  /**
   * Mercado Pago: x-signature = ts=...,v1=... (HMAC-SHA256 do manifest, não do body).
   * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
   */
  validateMercadoPagoWebhook(req) {
    try {
      if (!this.secret) {
        return {
          valid: false,
          error: 'MERCADOPAGO_WEBHOOK_SECRET não configurado'
        };
      }

      const xSignature = req.headers['x-signature'];
      if (!xSignature || typeof xSignature !== 'string') {
        return {
          valid: false,
          code: 'missing_signature_header',
          error: 'Header X-Signature não encontrado'
        };
      }

      // Fail-closed: formato legado sha256=... não é assinatura MP de webhook
      if (/^\s*sha(256|1)=/i.test(xSignature)) {
        return {
          valid: false,
          code: 'legacy_signature_format',
          error: 'Formato legado de assinatura não suportado para webhook Mercado Pago'
        };
      }

      let tsVal = null;
      let v1Val = null;
      for (const part of xSignature.split(',')) {
        const eq = part.indexOf('=');
        if (eq === -1) continue;
        const key = part.slice(0, eq).trim().toLowerCase();
        const val = part.slice(eq + 1).trim();
        if (key === 'ts') tsVal = val;
        if (key === 'v1') v1Val = val;
      }

      if (!tsVal || !v1Val) {
        return {
          valid: false,
          code: 'invalid_signature_format',
          error: 'Formato de x-signature inválido (esperado ts e v1)'
        };
      }

      const qId =
        req.query && req.query['data.id'] != null ? String(req.query['data.id']).trim() : '';
      const bodyId =
        req.body && req.body.data && req.body.data.id != null
          ? String(req.body.data.id).trim()
          : '';
      let dataID = qId || bodyId;
      if (!dataID) {
        return {
          valid: false,
          code: 'missing_data_id',
          error: 'data.id ausente (query ou body)'
        };
      }
      if (/^[a-zA-Z0-9]+$/.test(dataID)) {
        dataID = dataID.toLowerCase();
      }

      const ridRaw = req.headers['x-request-id'];
      const requestIdStr =
        ridRaw != null && String(ridRaw).trim() !== '' ? String(ridRaw).trim() : '';

      const manifestParts = [`id:${dataID};`];
      if (requestIdStr) {
        manifestParts.push(`request-id:${requestIdStr};`);
      }
      manifestParts.push(`ts:${tsVal};`);
      const manifest = manifestParts.join('');

      const expectedHex = crypto.createHmac('sha256', this.secret).update(manifest).digest('hex');

      let v1Buf;
      let expBuf;
      try {
        v1Buf = Buffer.from(v1Val, 'hex');
        expBuf = Buffer.from(expectedHex, 'hex');
      } catch {
        return {
          valid: false,
          code: 'invalid_v1_hex',
          error: 'Assinatura v1 inválida (hex)'
        };
      }
      if (v1Buf.length !== expBuf.length || !crypto.timingSafeEqual(v1Buf, expBuf)) {
        return {
          valid: false,
          code: 'signature_mismatch',
          error: 'Signature não confere'
        };
      }

      const tsNum = parseInt(tsVal, 10);
      if (!Number.isNaN(tsNum)) {
        const nowSec = Math.floor(Date.now() / 1000);
        const tsSec = tsNum > 1e12 ? Math.floor(tsNum / 1000) : tsNum;
        const skew = Math.max(60, this.mpTsMaxSkewSec);
        if (Math.abs(nowSec - tsSec) > skew) {
          return {
            valid: false,
            code: 'timestamp_out_of_window',
            error: 'Timestamp fora da janela permitida'
          };
        }
      }

      return {
        valid: true,
        payload: req.body,
        signature: xSignature,
        timestamp: tsVal,
        algorithm: 'mp-manifest-hmac-sha256'
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
      const payload =
        typeof req.rawBody === 'string' && req.rawBody.length > 0
          ? req.rawBody
          : JSON.stringify(req.body);

      if (!signature) {
        return {
          valid: false,
          error: 'Header de signature não encontrado'
        };
      }

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

  // Gerar signature para testes (formato sha256= — legado)
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

    const validSignatures = results.filter((r) => r.valid);

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
      timestampHeader: req.headers['x-timestamp'],
      valid: validation.valid,
      error: validation.error,
      algorithm: validation.algorithm
    };

    console.log('🔍 [WEBHOOK] Log de validação:', logData);

    return logData;
  }
}

module.exports = WebhookSignatureValidator;
