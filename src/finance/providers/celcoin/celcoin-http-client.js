'use strict';

const {
  getCelcoinConfig,
  getAuthBaseUrl,
  isCelcoinHttpEnabled,
  celcoinLog
} = require('./celcoin-config');

const TOKEN_PATH = '/v5/token';
const TOKEN_EXPIRY_SKEW_MS = 30_000;

/** @type {{ accessToken: string|null, tokenType: string|null, expiresAtMs: number }} */
let tokenCache = {
  accessToken: null,
  tokenType: null,
  expiresAtMs: 0
};

function clearTokenCache() {
  tokenCache = { accessToken: null, tokenType: null, expiresAtMs: 0 };
}

function sanitizeAuthError(rawData, httpStatus) {
  const message =
    (rawData && (rawData.message || rawData.error_description || rawData.error)) ||
    'Falha na autenticação Celcoin';
  return {
    httpStatus: httpStatus ?? null,
    errorCode: rawData?.errorCode ?? rawData?.error ?? null,
    message: String(message)
  };
}

function maskTokenPreview(token) {
  if (!token || typeof token !== 'string') return null;
  if (token.length <= 12) return '***';
  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

/**
 * OAuth 2.0 client_credentials — POST {authBaseUrl}/v5/token (sandbox).
 * Não loga client_id, client_secret nem access_token completo.
 */
async function requestAccessToken(options = {}) {
  if (!isCelcoinHttpEnabled()) {
    celcoinLog('http_blocked_disabled', { method: 'requestAccessToken' });
    return {
      success: false,
      error: 'CELCOIN_HTTP_DISABLED',
      message: 'HTTP Celcoin bloqueado: CELCOIN_HTTP_ENABLED=false'
    };
  }

  const config = getCelcoinConfig();
  if (!config.clientId || !config.clientSecret) {
    celcoinLog('http_blocked_missing_credentials', {
      missingClientId: !config.clientId,
      missingClientSecret: !config.clientSecret
    });
    return {
      success: false,
      error: 'CELCOIN_NOT_CONFIGURED',
      message: 'Autenticação Celcoin bloqueada: CELCOIN_CLIENT_ID ou CELCOIN_CLIENT_SECRET ausente'
    };
  }

  const forceRefresh = options.forceRefresh === true;
  const now = Date.now();
  if (
    !forceRefresh &&
    tokenCache.accessToken &&
    tokenCache.expiresAtMs > now + TOKEN_EXPIRY_SKEW_MS
  ) {
    celcoinLog('auth_cache_hit', {
      tokenPreview: maskTokenPreview(tokenCache.accessToken),
      expiresInSec: Math.max(0, Math.floor((tokenCache.expiresAtMs - now) / 1000))
    });
    return {
      success: true,
      accessToken: tokenCache.accessToken,
      tokenType: tokenCache.tokenType || 'bearer',
      expiresIn: Math.max(0, Math.floor((tokenCache.expiresAtMs - now) / 1000)),
      cached: true,
      authBaseUrl: getAuthBaseUrl()
    };
  }

  const authBaseUrl = getAuthBaseUrl();
  const tokenUrl = `${authBaseUrl}${TOKEN_PATH}`;

  const body = new URLSearchParams();
  body.set('client_id', config.clientId);
  body.set('grant_type', 'client_credentials');
  body.set('client_secret', config.clientSecret);

  celcoinLog('auth_request_start', {
    authBaseUrl,
    tokenPath: TOKEN_PATH
  });

  let response;
  try {
    response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });
  } catch (err) {
    celcoinLog('auth_request_network_error', {
      authBaseUrl,
      error: err?.message || 'network_error'
    });
    return {
      success: false,
      error: 'CELCOIN_AUTH_NETWORK_ERROR',
      message: err?.message || 'Erro de rede ao autenticar na Celcoin'
    };
  }

  let rawData = null;
  try {
    rawData = await response.json();
  } catch {
    rawData = null;
  }

  if (!response.ok) {
    const sanitized = sanitizeAuthError(rawData, response.status);
    celcoinLog('auth_request_failed', {
      authBaseUrl,
      httpStatus: response.status,
      errorCode: sanitized.errorCode
    });
    return {
      success: false,
      error: 'CELCOIN_AUTH_FAILED',
      ...sanitized
    };
  }

  const accessToken = rawData?.access_token;
  if (!accessToken || typeof accessToken !== 'string') {
    celcoinLog('auth_response_invalid', { authBaseUrl, httpStatus: response.status });
    return {
      success: false,
      error: 'CELCOIN_AUTH_INVALID_RESPONSE',
      message: 'Resposta OAuth sem access_token'
    };
  }

  const expiresIn = Number.parseInt(String(rawData.expires_in ?? 3600), 10);
  const tokenType = String(rawData.token_type || 'bearer').toLowerCase();

  tokenCache = {
    accessToken,
    tokenType,
    expiresAtMs: now + (Number.isFinite(expiresIn) ? expiresIn : 3600) * 1000
  };

  celcoinLog('auth_request_success', {
    authBaseUrl,
    tokenPreview: maskTokenPreview(accessToken),
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : null,
    tokenType
  });

  return {
    success: true,
    accessToken,
    tokenType,
    expiresIn: Number.isFinite(expiresIn) ? expiresIn : null,
    cached: false,
    authBaseUrl
  };
}

module.exports = {
  clearTokenCache,
  maskTokenPreview,
  requestAccessToken
};
