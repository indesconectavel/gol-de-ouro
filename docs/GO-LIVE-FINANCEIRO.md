# 💳 GO-LIVE - TESTES FINANCEIROS REAIS
# Gol de Ouro v1.2.1 - Validação Financeira em Produção

**Data:** 17/11/2025  
**Status:** ⏭️ **TESTES FINANCEIROS PENDENTES**  
**Versão:** v1.2.1

---

## 📋 SUMÁRIO EXECUTIVO

### ✅ OBJETIVO

Validar em produção todos os fluxos financeiros críticos do sistema, garantindo que operações reais funcionem corretamente.

---

## 💰 1. CRIAR PIX REAL ⏭️

### 1.1 Teste Pendente

**Endpoint:** `POST /api/payments/pix/criar`

**Requisitos:**
- ✅ Usuário autenticado
- ✅ Token JWT válido
- ✅ Valor mínimo: R$ 1,00

**Teste:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"valor":10,"descricao":"Depósito teste"}'
```

**Validações:**
- [ ] Status 200
- [ ] Payment ID retornado
- [ ] QR Code gerado
- [ ] PIX Copy Paste gerado
- [ ] Expiração configurada (30 minutos)
- [ ] Pagamento salvo no banco

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 📊 2. CONSULTAR STATUS PIX ⏭️

### 2.1 Teste Pendente

**Endpoint:** `GET /api/payments/pix/status/:payment_id`

**Requisitos:**
- ✅ Usuário autenticado
- ✅ Payment ID válido

**Teste:**
```bash
curl https://goldeouro-backend-v2.fly.dev/api/payments/pix/status/<payment_id> \
  -H "Authorization: Bearer <token>"
```

**Validações:**
- [ ] Status 200
- [ ] Status do pagamento retornado
- [ ] Dados do pagamento corretos
- [ ] Timestamps corretos

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 💵 3. BAIXAR SALDO ⏭️

### 3.1 Teste Pendente

**Endpoint:** `GET /api/payments/saldo/:user_id`

**Requisitos:**
- ✅ Usuário autenticado
- ✅ User ID válido

**Teste:**
```bash
curl https://goldeouro-backend-v2.fly.dev/api/payments/saldo/<user_id> \
  -H "Authorization: Bearer <token>"
```

**Validações:**
- [ ] Status 200
- [ ] Saldo retornado
- [ ] Saldo correto
- [ ] Formato padronizado

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 🎯 4. CRIAR CHUTE REAL ⏭️

### 4.1 Teste Pendente

**Endpoint:** `POST /api/games/shoot`

**Requisitos:**
- ✅ Usuário autenticado
- ✅ Saldo suficiente
- ✅ Parâmetros válidos (`direction`: 1-5, `amount`: 1,2,5,10)

**Teste:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/games/shoot \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"direction":3,"amount":1}'
```

**Validações:**
- [ ] Status 200
- [ ] Chute processado
- [ ] Saldo debitado corretamente
- [ ] Lote processado
- [ ] Recompensa creditada (se gol)
- [ ] Histórico atualizado

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 🎁 5. REGISTRAR RECOMPENSA REAL ⏭️

### 5.1 Teste Pendente

**Fluxo:**
- ✅ Chute resulta em gol
- ✅ Sistema processa recompensa
- ✅ RewardService credita recompensa
- ✅ FinancialService adiciona saldo

**Validações:**
- [ ] Recompensa registrada no banco
- [ ] Saldo creditado corretamente
- [ ] Transaction ID gerado
- [ ] Histórico atualizado
- [ ] ACID garantido

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 📜 6. CONSULTAR HISTÓRICO REAL ⏭️

### 6.1 Teste Pendente

**Endpoints:**
- `GET /api/games/history` - Histórico de chutes
- `GET /api/payments/extrato/:user_id` - Extrato financeiro
- `GET /api/payments/pix/usuario/:user_id` - Histórico PIX

**Validações:**
- [ ] Histórico de chutes retorna dados
- [ ] Extrato retorna transações
- [ ] Histórico PIX retorna pagamentos
- [ ] Dados ordenados corretamente
- [ ] Paginação funcionando (se aplicável)

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 💸 7. REALIZAR SAQUE REAL ⏭️

### 7.1 Teste Pendente

**Endpoint:** `POST /api/payments/saque`

**Requisitos:**
- ✅ Usuário autenticado
- ✅ Saldo suficiente
- ✅ Dados bancários válidos

**Teste:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/saque \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"valor":5,"banco":"001","agencia":"1234","conta":"56789","tipo":"corrente"}'
```

**Validações:**
- [ ] Status 200
- [ ] Saque solicitado
- [ ] Saldo debitado corretamente
- [ ] Saque salvo no banco
- [ ] Histórico atualizado
- [ ] ACID garantido

**Status:** ⏭️ **AGUARDANDO TESTE REAL** (Valor baixo recomendado)

---

## 🔔 8. VALIDAR WEBHOOK PIX ⏭️

### 8.1 Teste Pendente

**Endpoint:** `POST /api/payments/webhook`

**Requisitos:**
- ✅ Webhook do Mercado Pago
- ✅ Signature válida
- ✅ Payment ID válido

**Validações:**
- [ ] Webhook recebido
- [ ] Signature validada
- [ ] Idempotência garantida
- [ ] Pagamento processado
- [ ] Saldo creditado
- [ ] Status atualizado
- [ ] ACID garantido

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 💾 9. VALIDAR ATUALIZAÇÕES NO BANCO ⏭️

### 9.1 Testes Pendentes

**Validações:**
- [ ] Transações salvas corretamente
- [ ] Saldo atualizado corretamente
- [ ] Histórico atualizado
- [ ] Timestamps corretos
- [ ] Foreign keys válidas
- [ ] Constraints respeitadas
- [ ] ACID garantido

**Status:** ⏭️ **AGUARDANDO TESTE REAL**

---

## 📊 RESUMO DOS TESTES FINANCEIROS

### Testes Pendentes:

| Teste | Status | Prioridade |
|-------|--------|------------|
| Criar PIX Real | ⏭️ Pendente | Alta |
| Consultar Status PIX | ⏭️ Pendente | Alta |
| Baixar Saldo | ⏭️ Pendente | Alta |
| Criar Chute Real | ⏭️ Pendente | Crítica |
| Registrar Recompensa Real | ⏭️ Pendente | Crítica |
| Consultar Histórico Real | ⏭️ Pendente | Média |
| Realizar Saque Real | ⏭️ Pendente | Alta |
| Validar Webhook PIX | ⏭️ Pendente | Crítica |
| Validar Atualizações no Banco | ⏭️ Pendente | Crítica |

---

## ✅ CHECKLIST DE TESTES FINANCEIROS

### PIX:
- [ ] Criar pagamento PIX real
- [ ] Consultar status do pagamento
- [ ] Validar webhook do Mercado Pago
- [ ] Validar crédito de saldo

### Chutes:
- [ ] Criar chute real
- [ ] Validar débito de saldo
- [ ] Validar processamento de lote
- [ ] Validar crédito de recompensa

### Saques:
- [ ] Solicitar saque real (valor baixo)
- [ ] Validar débito de saldo
- [ ] Validar histórico

### Banco de Dados:
- [ ] Validar transações salvas
- [ ] Validar saldo atualizado
- [ ] Validar histórico atualizado
- [ ] Validar ACID

---

## ✅ CONCLUSÃO

### Status: ⏭️ **TESTES FINANCEIROS PENDENTES**

**Recomendações:**
- ⚠️ Executar todos os testes antes do GO-LIVE oficial
- ⚠️ Começar com valores baixos (R$ 1,00)
- ⚠️ Validar cada etapa antes de prosseguir
- ⚠️ Monitorar logs durante os testes
- ⚠️ Validar banco de dados após cada operação

**Próxima Etapa:** GO-LIVE - Monitoramento e Observabilidade

---

**Data:** 17/11/2025  
**Versão:** v1.2.1  
**Status:** ⏭️ **TESTES FINANCEIROS PENDENTES**

