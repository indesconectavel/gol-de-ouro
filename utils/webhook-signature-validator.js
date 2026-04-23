// Validação de Webhook Signature - Gol de Ouro v1.2.0
// ===================================================
const crypto = require('crypto');

class WebhookSignatureValidator {
  constructor() {
    this.secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    this.allowedAlgorithms = ['sha256', 'sha1'];
    this.maxTimestampDiff = 5 * 60 * 1000; // 5 minutos
    // MP pode reentregar a mesma notificação (mesmo `ts` no header) após minutos; 5m barra antes do HMAC.
    const skewEnv = process.env.MERCADOPAGO_WEBHOOK_MAX_TS_SKEW_MS;
    this.mercadoPagoWebhookMaxTimestampDiff = skewEnv
      ? Math.max(0, parseInt(String(skewEnv), 10) || 0) || 30 * 60 * 1000
      : 30 * 60 * 1000;
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

  /**
   * Mercado Pago (notificações webhooks): X-Signature = "ts=<ms>,v1=<hex>"
   * Manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
   * data.id vem preferencialmente da query (?data.id=); fallback body.data.id (proxies).
   * @see https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
   */
  parseMercadoPagoSignatureHeader(xSignature) {
    if (!xSignature || typeof xSignature !== 'string') return null;
    let ts = null;
    let v1 = null;
    for (const part of xSignature.split(',')) {
      const eq = part.indexOf('=');
      if (eq === -1) continue;
      const key = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();
      if (key === 'ts') ts = value;
      else if (key === 'v1') v1 = value;
    }
    if (!ts || !v1) return null;
    return { ts, v1 };
  }

  normalizeMercadoPagoManifestDataId(raw) {
    if (raw == null) return '';
    const s = String(raw).trim();
    if (!s) return '';
    if (/^[a-f0-9]+$/i.test(s)) return s.toLowerCase();
    if (/[a-z]/i.test(s)) return s.toLowerCase();
    return s;
  }

  /**
   * Mesma ordem dos exemplos oficiais (PHP/Go): id; request-id; ts — valores vazios mantêm o segmento.
   * data.id deve refletir o usado pelo MP na assinatura (query ?data.id= com fallback body.data.id).
   */
  buildMercadoPagoSignatureManifest({ dataId, xRequestId, ts }) {
    const idPart = dataId == null ? '' : String(dataId).trim();
    const rid = xRequestId == null ? '' : String(xRequestId).trim();
    return `id:${idPart};request-id:${rid};ts:${ts};`;
  }

  validateTimestampMilliseconds(tsMs, maxDiffMs) {
    const limit =
      maxDiffMs != null && maxDiffMs > 0 ? maxDiffMs : this.maxTimestampDiff;
    try {
      if (Number.isNaN(tsMs)) {
        return { valid: false, error: 'Timestamp ts inválido' };
      }
      const now = Date.now();
      const diffMs = Math.abs(now - tsMs);
      if (diffMs > limit) {
        return {
          valid: false,
          error: 'Timestamp da notificação fora da janela tolerada'
        };
      }
      return { valid: true, timeDiffMs: diffMs };
    } catch (e) {
      return { valid: false, error: 'Timestamp inválido' };
    }
  }

  normalizeMercadoPagoTsToMilliseconds(rawTs) {
    if (rawTs == null) return NaN;
    const tsStr = String(rawTs).trim();
    if (!/^\d+$/.test(tsStr)) return NaN;

    // Mercado Pago pode enviar ts em segundos (10) ou milissegundos (13).
    if (tsStr.length === 10) return Number(tsStr) * 1000;
    if (tsStr.length === 13) return Number(tsStr);

    // Fallback conservador para formatos numéricos fora do padrão.
    const n = Number(tsStr);
    if (!Number.isFinite(n)) return NaN;
    return tsStr.length < 13 ? n * 1000 : n;
  }

  // Validar webhook do Mercado Pago (notificações oficiais: X-Signature ts/v1 + manifest)
  validateMercadoPagoWebhook(req) {
    try {
      if (!this.secret) {
        return {
          valid: false,
          error: 'MERCADOPAGO_WEBHOOK_SECRET não configurado'
        };
      }

      const xSignature = req.headers['x-signature'] || req.headers['X-Signature'];
      if (!xSignature) {
        return {
          valid: false,
          error: 'Header X-Signature não encontrado'
        };
      }

      const parts = this.parseMercadoPagoSignatureHeader(xSignature);
      if (!parts) {
        return {
          valid: false,
          error: 'Formato de X-Signature inválido (esperado ts=...,v1=... conforme Mercado Pago)'
        };
      }

      const tsMs = this.normalizeMercadoPagoTsToMilliseconds(parts.ts);
      const tsCheck = this.validateTimestampMilliseconds(
        tsMs,
        this.mercadoPagoWebhookMaxTimestampDiff
      );
      if (!tsCheck.valid) {
        return { valid: false, error: tsCheck.error };
      }

      const xRequestId =
        req.headers['x-request-id'] ||
        req.headers['X-Request-Id'] ||
        '';

      const q = req.query || {};
      let rawDataId = q['data.id'];
      if (Array.isArray(rawDataId)) rawDataId = rawDataId[0];
      let dataId = rawDataId != null && rawDataId !== '' ? String(rawDataId).trim() : '';

      if (!dataId && req.body && req.body.data != null && req.body.data.id != null) {
        dataId = String(req.body.data.id).trim();
      }

      dataId = this.normalizeMercadoPagoManifestDataId(dataId);

      const manifest = this.buildMercadoPagoSignatureManifest({
        dataId,
        xRequestId,
        ts: parts.ts
      });

      const expectedHex = crypto
        .createHmac('sha256', this.secret)
        .update(manifest, 'utf8')
        .digest('hex');

      const got = String(parts.v1).toLowerCase().trim();
      if (!/^[a-f0-9]+$/.test(got) || got.length % 2 !== 0) {
        return { valid: false, error: 'Valor v1 em X-Signature inválido' };
      }

      const gotBuf = Buffer.from(got, 'hex');
      const expBuf = Buffer.from(expectedHex, 'hex');
      if (gotBuf.length !== expBuf.length || gotBuf.length === 0) {
        return { valid: false, error: 'Signature v1 não confere (tamanho)' };
      }

      if (!crypto.timingSafeEqual(gotBuf, expBuf)) {
        return {
          valid: false,
          error: 'Signature v1 não confere (HMAC-SHA256 do manifest)'
        };
      }

      return {
        valid: true,
        payload: req.body,
        signature: xSignature,
        timestamp: parts.ts,
        algorithm: 'sha256'
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
