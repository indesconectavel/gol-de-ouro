# 🧪 RELATÓRIO E2E FRONTEND - BROWSER AGENT
## Gol de Ouro Player - Data: 2025-12-01

---

## ✅ STATUS: **BLOQUEADO**

### **Score:** **15/100**

---

## 📊 RESUMO EXECUTIVO

- **Cenários executados:** 7
- **Cenários passaram:** 0
- **Cenários falharam:** 7
- **Taxa de sucesso:** 0.0%
- **Duração total:** 61.79s

---

## 🧪 CENÁRIOS EXECUTADOS


### 1. Health-check visual
- **Status:** ❌ FAIL
- **Duração:** 15.54s

- **Detalhes:** {
  "url": "https://www.goldeouro.lol/",
  "title": "Gol de Ouro - Jogador",
  "consoleErrors": 2,
  "hasBackendError": false,
  "errors": [
    {
      "type": "error",
      "text": "Failed to load resource: net::ERR_NAME_NOT_RESOLVED",
      "location": {
        "url": "https://goldeouro-backend.fly.dev/meta"
      },
      "timestamp": "2025-12-01T14:07:17.835Z"
    },
    {
      "type": "error",
      "text": "Failed to load resource: net::ERR_NAME_NOT_RESOLVED",
      "location": {
        "url": "https://goldeouro-backend.fly.dev/meta"
      },
      "timestamp": "2025-12-01T14:07:17.836Z"
    }
  ]
}


### 2. Registro
- **Status:** ❌ FAIL
- **Duração:** 32.34s

- **Detalhes:** {
  "email": "test+1764598040451@example.com",
  "username": "testuser_1764598040451",
  "hasToken": false,
  "redirectedToHome": false,
  "currentUrl": "https://www.goldeouro.lol/register",
  "storage": {}
}


### 3. WebSocket realtime
- **Status:** ❌ FAIL
- **Duração:** 0.02s
- **Erro:** Token não encontrado no localStorage



### 4. Criar PIX V6
- **Status:** ❌ FAIL
- **Duração:** 3.42s
- **Erro:** page.$x is not a function



### 5. Jogo (chute)
- **Status:** ❌ FAIL
- **Duração:** 4.07s
- **Erro:** page.$x is not a function



### 6. Logout & Persistence
- **Status:** ❌ FAIL
- **Duração:** 0.00s
- **Erro:** page.$x is not a function



### 7. Resiliência PIX (8x)
- **Status:** ❌ FAIL
- **Duração:** 6.41s

- **Detalhes:** {
  "successCount": 0,
  "successRate": 0,
  "avgLatency": 0,
  "p95Latency": 0,
  "attempts": [
    {
      "attempt": 1,
      "status": "FAIL",
      "latency": 708,
      "error": "page.$x is not a function"
    },
    {
      "attempt": 2,
      "status": "FAIL",
      "latency": 700,
      "error": "page.$x is not a function"
    },
    {
      "attempt": 3,
      "status": "FAIL",
      "latency": 643,
      "error": "page.$x is not a function"
    },
    {
      "attempt": 4,
      "status": "FAIL",
      "latency": 698,
      "error": "page.$x is not a function"
    },
    {
      "attempt": 5,
      "status": "FAIL",
      "latency": 714,
      "error": "page.$x is not a function"
    },
    {
      "attempt": 6,
      "status": "FAIL",
      "latency": 1509,
      "error": "page.$x is not a function"
    },
    {
      "attempt": 7,
      "status": "FAIL",
      "latency": 700,
      "error": "page.$x is not a function"
    },
    {
      "attempt": 8,
      "status": "FAIL",
      "latency": 734,
      "error": "page.$x is not a function"
    }
  ]
}


---

## ❌ ERROS ENCONTRADOS

1. Health-check: 2 erros no console
2. Registro: token=false, redirect=false
3. Resiliência PIX: 0.0% sucesso

---

## ⚠️ WARNINGS

Nenhum warning encontrado.

---

## 📸 SCREENSHOTS

1. 02-register-form-desktop (default)
2. 02-register-filled-desktop (default)
3. 02-register-success-desktop (default)
4. 05-pix-form-desktop (default)
5. 05-pix-filled-desktop (default)
6. 06-game-screen-desktop (default)

---

## 🔧 CORREÇÕES RECOMENDADAS

- Verificar configuração de DNS e CORS no backend
- Verificar endpoints de autenticação no backend
- Verificar salvamento de token no localStorage
- Verificar endpoint PIX V6 no backend
- Verificar renderização de QR Code no frontend

---

**Data:** 2025-12-01T14:07:01.519Z
