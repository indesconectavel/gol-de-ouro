# 🧪 TESTES EM PRODUÇÃO - GOL DE OURO v1.2.0
# Backend + Mobile + Admin - Testes Automatizados

**Data:** 17/11/2025  
**Status:** ⏭️ **TESTES EM PRODUÇÃO**  
**Versão:** v1.2.0

---

## 🎯 OBJETIVO

Simular e validar todos os fluxos críticos do sistema em produção, garantindo que Backend, Mobile e Admin estão funcionando corretamente de ponta a ponta.

---

## 🔍 BACKEND - TESTES EM PRODUÇÃO

### 1. Health Check ✅

**Endpoint:** `GET /health`

**Teste Realizado:**
```bash
curl https://goldeouro-backend-v2.fly.dev/health
```

**Resultado Esperado:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T21:20:48.373Z",
  "version": "1.2.0",
  "database": "connected",
  "mercadoPago": "configured"
}
```

**Status:** ✅ **TESTE PASSOU** (Status 200, Version 1.2.0, Database connected)

---

### 2. Autenticação - Login ✅

**Endpoint:** `POST /api/auth/login`

**Teste:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Resultado Esperado:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": {
      "id": "...",
      "email": "test@example.com",
      "username": "...",
      "saldo": 0
    }
  },
  "message": "Login realizado com sucesso",
  "timestamp": "..."
}
```

**Validações:**
- [ ] Status 200
- [ ] Token JWT válido
- [ ] User data presente
- [ ] Formato padronizado

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

### 3. Jogos - Shoot ✅

**Endpoint:** `POST /api/games/shoot`

**Requisitos:**
- ✅ Autenticação: `Authorization: Bearer <token>`
- ✅ Body: `{ "direction": 3, "amount": 1 }`

**Teste:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/games/shoot \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"direction":3,"amount":1}'
```

**Resultado Esperado:**
```json
{
  "success": true,
  "data": {
    "result": "goal" | "miss",
    "isGolDeOuro": false,
    "premio": 5,
    "premioGolDeOuro": 0,
    "saldoAnterior": 10,
    "saldoPosterior": 14,
    "loteId": "...",
    "timestamp": "..."
  },
  "message": "Chute processado com sucesso",
  "timestamp": "..."
}
```

**Validações:**
- [ ] Status 200
- [ ] Resultado presente (goal/miss)
- [ ] Saldo atualizado corretamente
- [ ] Lote processado
- [ ] Recompensa creditada (se gol)

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

### 4. PIX - Criar Pagamento ✅

**Endpoint:** `POST /api/payments/pix/criar`

**Requisitos:**
- ✅ Autenticação: `Authorization: Bearer <token>`
- ✅ Body: `{ "valor": 10, "descricao": "Depósito" }`

**Teste:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"valor":10,"descricao":"Depósito"}'
```

**Resultado Esperado:**
```json
{
  "success": true,
  "data": {
    "payment_id": "...",
    "qr_code": "...",
    "qr_code_base64": "...",
    "pix_copy_paste": "...",
    "expires_at": "..."
  },
  "message": "Pagamento PIX criado com sucesso",
  "timestamp": "..."
}
```

**Validações:**
- [ ] Status 200
- [ ] Payment ID presente
- [ ] QR Code presente
- [ ] PIX Copy Paste presente
- [ ] Expiração configurada (30 minutos)

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

### 5. PIX - Status do Pagamento ✅

**Endpoint:** `GET /api/payments/pix/status/:payment_id`

**Requisitos:**
- ✅ Autenticação: `Authorization: Bearer <token>`

**Teste:**
```bash
curl https://goldeouro-backend-v2.fly.dev/api/payments/pix/status/<payment_id> \
  -H "Authorization: Bearer <token>"
```

**Resultado Esperado:**
```json
{
  "success": true,
  "data": {
    "payment_id": "...",
    "status": "pending" | "approved" | "rejected" | "cancelled",
    "valor": 10,
    "created_at": "...",
    "updated_at": "..."
  },
  "message": "Status do pagamento obtido",
  "timestamp": "..."
}
```

**Validações:**
- [ ] Status 200
- [ ] Status do pagamento presente
- [ ] Dados do pagamento corretos

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

### 6. Saldo e Extrato ✅

**Endpoint:** `GET /api/payments/saldo/:user_id`  
**Endpoint:** `GET /api/payments/extrato/:user_id`

**Requisitos:**
- ✅ Autenticação: `Authorization: Bearer <token>`

**Teste Saldo:**
```bash
curl https://goldeouro-backend-v2.fly.dev/api/payments/saldo/<user_id> \
  -H "Authorization: Bearer <token>"
```

**Teste Extrato:**
```bash
curl https://goldeouro-backend-v2.fly.dev/api/payments/extrato/<user_id> \
  -H "Authorization: Bearer <token>"
```

**Resultado Esperado (Saldo):**
```json
{
  "success": true,
  "data": {
    "saldo": 50.00,
    "user_id": "..."
  },
  "message": "Saldo obtido com sucesso",
  "timestamp": "..."
}
```

**Resultado Esperado (Extrato):**
```json
{
  "success": true,
  "data": {
    "transacoes": [...],
    "total": 10
  },
  "message": "Extrato obtido com sucesso",
  "timestamp": "..."
}
```

**Validações:**
- [ ] Status 200
- [ ] Saldo correto
- [ ] Extrato com transações
- [ ] Formato padronizado

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 🔍 ADMIN PANEL - TESTES EM PRODUÇÃO

### 1. Login ✅

**URL:** `https://admin.goldeouro.lol/login` (ou URL do Vercel)

**Teste:**
1. Acessar página de login
2. Inserir senha válida
3. Verificar redirecionamento para `/painel`

**Validações:**
- [ ] Página carrega corretamente
- [ ] Login funciona
- [ ] Token salvo no localStorage
- [ ] Redirecionamento funciona

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

### 2. Dashboard ✅

**URL:** `https://admin.goldeouro.lol/painel`

**Teste:**
1. Acessar dashboard após login
2. Verificar carregamento de dados
3. Verificar estatísticas exibidas

**Validações:**
- [ ] Dados carregam corretamente
- [ ] Estatísticas exibidas
- [ ] Loading state funciona
- [ ] Empty state funciona (se não houver dados)

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

### 3. Relatórios ✅

**URLs:**
- `/relatorio-financeiro`
- `/relatorio-semanal`
- `/relatorio-geral`
- `/relatorio-usuarios`
- `/relatorio-por-usuario`

**Teste:**
1. Acessar cada relatório
2. Verificar carregamento de dados
3. Verificar formatação correta

**Validações:**
- [ ] Dados carregam corretamente
- [ ] Formatação monetária correta
- [ ] Formatação de datas correta
- [ ] Filtros funcionam (quando aplicável)

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

### 4. Estatísticas ✅

**URLs:**
- `/estatisticas`
- `/estatisticas-gerais`

**Teste:**
1. Acessar estatísticas
2. Verificar carregamento de dados
3. Verificar gráficos (se houver)

**Validações:**
- [ ] Dados carregam corretamente
- [ ] Estatísticas corretas
- [ ] Gráficos renderizam (se houver)

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 🔍 MOBILE APP - TESTES EM PRODUÇÃO

### 1. Login ✅

**Fluxo:**
1. Abrir app
2. Inserir email e senha
3. Clicar em "Entrar"
4. Verificar redirecionamento

**Validações:**
- [ ] Login funciona
- [ ] Token salvo no AsyncStorage
- [ ] User data salvo
- [ ] Redirecionamento funciona

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

### 2. Chute (Shoot) ✅

**Fluxo:**
1. Acessar tela de jogo
2. Selecionar direção (1-5)
3. Selecionar valor de aposta (1,2,5,10)
4. Clicar em "Chutar"
5. Verificar resultado

**Validações:**
- [ ] Chute enviado corretamente
- [ ] Parâmetros corretos (`direction`, `amount`)
- [ ] Resultado exibido
- [ ] Saldo atualizado
- [ ] Feedback visual funciona

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

### 3. PIX ✅

**Fluxo Criar PIX:**
1. Acessar tela de criar PIX
2. Inserir valor
3. Criar pagamento
4. Verificar QR Code exibido

**Fluxo Status PIX:**
1. Acessar status do pagamento
2. Verificar status atualizado

**Fluxo Histórico PIX:**
1. Acessar histórico
2. Verificar lista de pagamentos

**Validações:**
- [ ] Criar PIX funciona
- [ ] QR Code exibido
- [ ] Copy paste funciona
- [ ] Status atualiza corretamente
- [ ] Histórico carrega

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

### 4. Histórico ✅

**Fluxo:**
1. Acessar histórico de chutes
2. Verificar lista de chutes
3. Verificar formatação

**Validações:**
- [ ] Histórico carrega
- [ ] Chutes exibidos corretamente
- [ ] Formatação correta
- [ ] Paginação funciona (se aplicável)

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 📊 RESUMO DOS TESTES

### Backend:

| Teste | Status | Observações |
|-------|--------|-------------|
| Health Check | ✅ PASSOU | Status 200, Version 1.2.0 |
| Login | ⏭️ PENDENTE | Requer credenciais válidas |
| Shoot | ⏭️ PENDENTE | Requer autenticação |
| PIX Criar | ⏭️ PENDENTE | Requer autenticação |
| PIX Status | ⏭️ PENDENTE | Requer payment_id válido |
| Saldo/Extrato | ⏭️ PENDENTE | Requer autenticação |

### Admin:

| Teste | Status | Observações |
|-------|--------|-------------|
| Login | ⏭️ PENDENTE | Requer acesso ao admin |
| Dashboard | ⏭️ PENDENTE | Requer login |
| Relatórios | ⏭️ PENDENTE | Requer login |
| Estatísticas | ⏭️ PENDENTE | Requer login |

### Mobile:

| Teste | Status | Observações |
|-------|--------|-------------|
| Login | ⏭️ PENDENTE | Requer app instalado |
| Shoot | ⏭️ PENDENTE | Requer login |
| PIX | ⏭️ PENDENTE | Requer login |
| Histórico | ⏭️ PENDENTE | Requer login |

---

## ✅ CONCLUSÃO DA FASE B

### Status: ⏭️ **TESTES EM PRODUÇÃO PENDENTES**

**Testes Automatizados:**
- ✅ Health Check: PASSOU
- ⏭️ Demais testes: Requerem execução manual

**Próxima Fase:** FASE C - Detecção de Falhas

---

**Data:** 17/11/2025  
**Versão:** v1.2.0  
**Status:** ⏭️ **FASE B EM ANDAMENTO**

