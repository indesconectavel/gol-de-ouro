# 🔥 AUDITORIA PIX REAL V6 - QR CODE EMV REAL
## Gol de Ouro - Data: 2025-11-28

---

## ✅ STATUS: **BLOQUEADO**

### **Score PIX:** **20/100**

---

## 📊 RESUMO EXECUTIVO

{
  "test1_QRCodePixEMVReal": {
    "request": {
      "url": "https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar",
      "method": "POST",
      "headers": {
        "Authorization": "Bearer [TOKEN]"
      },
      "body": {
        "valor": 1
      }
    },
    "response": {
      "status": 201,
      "data": {
        "success": true,
        "timestamp": "2025-11-28T19:52:35.683Z",
        "data": {
          "payment_id": "468718642-01b5fecf-2a39-4f4e-a018-9ce3458743be",
          "qr_code": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=468718642-01b5fecf-2a39-4f4e-a018-9ce3458743be",
          "qr_code_base64": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=468718642-01b5fecf-2a39-4f4e-a018-9ce3458743be",
          "pix_copy_paste": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=468718642-01b5fecf-2a39-4f4e-a018-9ce3458743be",
          "expires_at": "2025-11-28T20:22:33.258+00:00",
          "init_point": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=468718642-01b5fecf-2a39-4f4e-a018-9ce3458743be"
        },
        "message": "Pagamento PIX criado com sucesso!"
      },
      "latency": 4191
    },
    "qrCode": {
      "qr_code_base64": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=468718642-01b5fecf-2a39-4f4e-a018-9ce3458743be",
      "qr_code": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=468718642-01b5fecf-2a39-4f4e-a018-9ce3458743be",
      "copy_and_paste": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=468718642-01b5fecf-2a39-4f4e-a018-9ce3458743be",
      "transaction_id": "468718642-01b5fecf-2a39-4f4e-a018-9ce3458743be",
      "status": "pending"
    },
    "emv": {},
    "latency": 4191,
    "passed": false
  },
  "test2_ValidacaoEMVDigital": {
    "emv": {
      "raw": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=468718642-01b5fecf-2a39-4f4e-a018-9ce3458743be",
      "fields": {},
      "valid": false,
      "errors": [
        "Não começa com 000201"
      ]
    },
    "validation": {},
    "passed": false
  },
  "test3_ResilienciaPixV6": {
    "requests": [
      {
        "attempt": 1,
        "status": 201,
        "latency": 3857,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 2,
        "status": 201,
        "latency": 3867,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 3,
        "status": 201,
        "latency": 3648,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 4,
        "status": 201,
        "latency": 3613,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 5,
        "status": 201,
        "latency": 3638,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 6,
        "status": 201,
        "latency": 3657,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 7,
        "status": 201,
        "latency": 3642,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 8,
        "status": 201,
        "latency": 3653,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 9,
        "status": 201,
        "latency": 3603,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 10,
        "status": 201,
        "latency": 3590,
        "success": true,
        "isEMV": false
      }
    ],
    "latencies": [
      3590,
      3603,
      3613,
      3638,
      3642,
      3648,
      3653,
      3657,
      3857,
      3867
    ],
    "errors": [],
    "rateLimitHit": false,
    "averageLatency": 3677,
    "p95Latency": 3867,
    "errorRate": 0,
    "emvSuccessRate": 0
  }
}

---

## 📱 QR CODES EMV GERADOS



---

## 🔐 CÓDIGOS EMV VALIDADOS



---

## 📊 MÉTRICAS

{
  "resilience": {
    "requests": [
      {
        "attempt": 1,
        "status": 201,
        "latency": 3857,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 2,
        "status": 201,
        "latency": 3867,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 3,
        "status": 201,
        "latency": 3648,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 4,
        "status": 201,
        "latency": 3613,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 5,
        "status": 201,
        "latency": 3638,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 6,
        "status": 201,
        "latency": 3657,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 7,
        "status": 201,
        "latency": 3642,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 8,
        "status": 201,
        "latency": 3653,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 9,
        "status": 201,
        "latency": 3603,
        "success": true,
        "isEMV": false
      },
      {
        "attempt": 10,
        "status": 201,
        "latency": 3590,
        "success": true,
        "isEMV": false
      }
    ],
    "latencies": [
      3590,
      3603,
      3613,
      3638,
      3642,
      3648,
      3653,
      3657,
      3857,
      3867
    ],
    "errors": [],
    "rateLimitHit": false,
    "averageLatency": 3677,
    "p95Latency": 3867,
    "errorRate": 0,
    "emvSuccessRate": 0
  }
}

---

## ⚠️ ERROS

1. QR Code não está no formato EMV (não começa com 000201)
2. EMV inválido: Não começa com 000201

---

## ⚠️ WARNINGS

Nenhum warning encontrado.

---

**Data:** 2025-11-28T19:52:29.067Z
