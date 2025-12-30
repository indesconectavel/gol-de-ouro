# 🎯 V16 CORS TEST
## Data: 2025-12-04

## OPTIONS:
{
  "status": 500,
  "headers": {}
}

## POST sem Token:
{
  "status": 500,
  "data": {
    "success": false,
    "message": "Erro interno do servidor",
    "timestamp": "2025-12-04T16:17:57.373Z",
    "requestId": "unknown"
  },
  "headers": {
    "content-security-policy": "default-src 'self';style-src 'self' 'unsafe-inline';script-src 'self';img-src 'self' data: https:;base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';object-src 'none';script-src-attr 'none';upgrade-insecure-requests",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin",
    "origin-agent-cluster": "?1",
    "referrer-policy": "no-referrer",
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-dns-prefetch-control": "off",
    "x-download-options": "noopen",
    "x-frame-options": "DENY",
    "x-permitted-cross-domain-policies": "none",
    "x-xss-protection": "0",
    "content-type": "application/json; charset=utf-8",
    "etag": "W/\"73-Tk/xT/Int5mvAR/S7q4oSzTiaWU\"",
    "vary": "Accept-Encoding",
    "date": "Thu, 04 Dec 2025 16:17:57 GMT",
    "connection": "keep-alive",
    "keep-alive": "timeout=5",
    "transfer-encoding": "chunked",
    "server": "Fly/023f4916d (2025-12-03)",
    "via": "1.1 fly.io",
    "fly-request-id": "01KBN2FW3V2CPSF27CH9H54HB8-gru"
  }
}

## POST com Token:
{
  "status": 500,
  "data": {
    "success": false,
    "message": "Erro interno do servidor",
    "timestamp": "2025-12-04T16:17:57.400Z",
    "requestId": "unknown"
  },
  "headers": {
    "content-security-policy": "default-src 'self';style-src 'self' 'unsafe-inline';script-src 'self';img-src 'self' data: https:;base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';object-src 'none';script-src-attr 'none';upgrade-insecure-requests",
    "cross-origin-opener-policy": "same-origin",
    "cross-origin-resource-policy": "same-origin",
    "origin-agent-cluster": "?1",
    "referrer-policy": "no-referrer",
    "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
    "x-content-type-options": "nosniff",
    "x-dns-prefetch-control": "off",
    "x-download-options": "noopen",
    "x-frame-options": "DENY",
    "x-permitted-cross-domain-policies": "none",
    "x-xss-protection": "0",
    "content-type": "application/json; charset=utf-8",
    "etag": "W/\"73-Yj1qtrGBq0QMWOT5M4Cgs1mubkc\"",
    "vary": "Accept-Encoding",
    "date": "Thu, 04 Dec 2025 16:17:57 GMT",
    "connection": "keep-alive",
    "keep-alive": "timeout=5",
    "transfer-encoding": "chunked",
    "server": "Fly/023f4916d (2025-12-03)",
    "via": "1.1 fly.io",
    "fly-request-id": "01KBN2FW4PY4JKKSCBZYHFJJP7-gru"
  }
}
