# R1 - CHECKLIST PRODUÇÃO SEM MOCKS + PIX LIVE

## ✅ CONFIGURAÇÕES VALIDADAS

### Player Mode
- [x] USE_MOCKS: false (produção)
- [x] USE_SANDBOX: false (PIX LIVE)
- [x] API_BASE_URL: https://api.goldeouro.lol
- [x] LOG_LEVEL: error (produção)

### Admin Panel
- [x] USE_MOCK_DATA: false (produção)
- [x] API_URL: https://api.goldeouro.lol
- [x] FALLBACK_TO_MOCK: false
- [x] ENABLE_DEBUG: false

### PIX LIVE Configuration
- [x] pixProvider: 'live'
- [x] pixEndpoint: '/api/payments/pix/criar'
- [x] pixStatusEndpoint: '/api/payments/pix/status'
- [x] pixUserEndpoint: '/api/payments/pix/usuario'
- [x] minAmount: 10.00 BRL
- [x] maxAmount: 1000.00 BRL
- [x] currency: 'BRL'
- [x] timeout: 30000ms

## ⚠️ VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### Obrigatórias para PIX LIVE
- [ ] VITE_PIX_LIVE_KEY
- [ ] VITE_PIX_LIVE_SECRET
- [ ] VITE_PIX_LIVE_WEBHOOK

### Backend (se necessário)
- [ ] PIX_MIN_AMOUNT=1.00
- [ ] PIX_MAX_AMOUNT=10000.00
- [ ] PIX_EXPIRATION_MINUTES=30
- [ ] PIX_WEBHOOK_URL

## 🚀 STATUS: CONFIGURAÇÕES PRONTAS PARA PRODUÇÃO

## Próximos Passos
- R2: SPA fallback + Deploy canário + Smoke
