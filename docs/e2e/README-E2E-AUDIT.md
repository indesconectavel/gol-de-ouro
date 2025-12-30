# 🔥 PACOTE SUPREMO DE AUDITORIA E2E DE PRODUÇÃO

## 📦 Scripts Disponíveis

### 1. **Auditoria E2E Completa**
```bash
npm run test:e2e:prod
# ou
node scripts/e2e/auditoria-e2e-producao.js
```

**O que faz:**
- ✅ Valida data-testid em Login e Register
- ✅ Testa registro real de usuário
- ✅ Testa login real
- ✅ Valida VersionService (/meta)
- ✅ Testa WebSocket real
- ✅ Testa PIX V6 real
- ✅ Captura screenshots
- ✅ Captura network logs (HAR)
- ✅ Captura console logs
- ✅ Gera relatórios JSON e Markdown

**Saídas:**
- `docs/e2e/E2E-PRODUCTION-REPORT.json`
- `docs/e2e/E2E-PRODUCTION-REPORT.md`
- `docs/e2e/screenshots/*.png`
- `docs/e2e/network.har.json`

---

### 2. **Validação de Data-TestID**
```bash
npm run test:data-testid
# ou
node scripts/e2e/validate-data-testid.js
```

**O que faz:**
- ✅ Valida presença de data-testid em Login
- ✅ Valida presença de data-testid em Register
- ✅ Gera relatório JSON

**Saída:**
- `docs/e2e/data-testid-check.json`

---

## 📊 Sistema de Pontuação

| Categoria | Peso | Descrição |
|-----------|------|-----------|
| **Data-testid** | 20 | Validação de seletores |
| **Registro** | 20 | Criação de usuário real |
| **Login** | 20 | Autenticação real |
| **PIX V6** | 15 | Criação de PIX EMV |
| **WebSocket** | 10 | Conexão e autenticação |
| **VersionService** | 10 | Endpoint /meta |
| **Screenshots & Network** | 5 | Evidências visuais |

**Total:** 100 pontos

---

## 🎯 Critérios de Aprovação

- **APROVADO:** Score >= 90 e 0 erros
- **APROVADO_COM_RESSALVAS:** Score >= 80
- **REPROVADO:** Score < 80

---

## 📁 Estrutura de Pastas

```
scripts/e2e/
├── auditoria-e2e-producao.js    # Script principal
└── validate-data-testid.js      # Validação de data-testid

docs/e2e/
├── E2E-PRODUCTION-REPORT.json   # Relatório JSON completo
├── E2E-PRODUCTION-REPORT.md     # Relatório Markdown completo
├── data-testid-check.json        # Relatório de data-testid
├── network.har.json              # Network logs (HAR)
└── screenshots/                  # Screenshots capturados
    ├── 01-login-data-testid.png
    ├── 01-register-data-testid.png
    ├── 02-register-filled.png
    ├── 03-login-filled.png
    ├── 03-dashboard-after-login.png
    ├── 07-home.png
    └── ...
```

---

## ⚙️ Requisitos Técnicos

- **Node.js:** >= 18.0.0
- **Puppeteer:** ^24.31.0 (já incluído)
- **Headless:** true
- **Timeout:** 40s global
- **Retentativas:** Automáticas para /meta e PIX

---

## 🔍 URLs Testadas

- **Frontend:** https://www.goldeouro.lol
- **Backend:** https://goldeouro-backend-v2.fly.dev
- **WebSocket:** wss://goldeouro-backend-v2.fly.dev

---

## 📝 Exemplo de Uso

```bash
# Executar auditoria completa
npm run test:e2e:prod

# Verificar apenas data-testid
npm run test:data-testid

# Ver relatórios gerados
cat docs/e2e/E2E-PRODUCTION-REPORT.md
```

---

## 🐛 Troubleshooting

### Erro: "data-testid não encontrado"
**Causa:** Frontend não deployado com correções  
**Solução:** Fazer deploy do frontend com data-testid

### Erro: "WebSocket timeout"
**Causa:** WebSocket não está respondendo  
**Solução:** Verificar se o backend está rodando

### Erro: "PIX retornou erro"
**Causa:** Token inválido ou backend com problema  
**Solução:** Verificar autenticação e logs do backend

---

## 📊 Relatórios Gerados

### E2E-PRODUCTION-REPORT.json
```json
{
  "timestamp": "2025-12-01T...",
  "score": 95,
  "maxScore": 100,
  "status": "APROVADO",
  "modules": {
    "module1_dataTestID": { ... },
    "module2_register": { ... },
    ...
  },
  "errors": [],
  "warnings": []
}
```

### E2E-PRODUCTION-REPORT.md
Relatório Markdown completo com:
- Status e score
- Resumo executivo
- Detalhes de cada módulo
- Lista de erros e warnings
- Links para screenshots

---

## ✅ Checklist de Validação

- [ ] Data-testid presente em Login
- [ ] Data-testid presente em Register
- [ ] Registro funciona
- [ ] Login funciona
- [ ] VersionService responde
- [ ] WebSocket conecta
- [ ] PIX V6 gera QR EMV
- [ ] Screenshots capturados
- [ ] Network logs salvos
- [ ] Relatórios gerados

---

**Última atualização:** 2025-12-01  
**Versão:** 1.0.0

