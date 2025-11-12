# 🔔 CONFIGURAR WEBHOOKS MERCADO PAGO - PRODUÇÃO
## Data: 27/10/2025

---

## 📋 **INFORMAÇÕES NECESSÁRIAS**

### **URL do Webhook:**
```
https://goldeouro-backend-v2.fly.dev/api/payments/webhook
```

### **Webhook Secret (já configurado):**
```
157e633722bf94eb817dcd66d6e13c08425517779a7962feb034ddd26671f9bf
```

### **Eventos a configurar:**
- ✅ `payment` (pagamentos)

---

## 🚀 **PASSO A PASSO**

### **PASSO 1: ACESSAR PAINEL MERCADO PAGO**

1. **Abra:** https://www.mercadopago.com.br/developers
2. **Faça login** na sua conta
3. **Clique em "Suas integrações"**
4. **Selecione sua aplicação** (Gol de Ouro)

### **PASSO 2: CONFIGURAR WEBHOOKS**

1. **No menu lateral, clique em "Webhooks"**
2. **Clique em "Configurar webhook" ou "Adicionar URL"**
3. **Preencha os dados:**

   **URL do webhook:**
   ```
   https://goldeouro-backend-v2.fly.dev/api/payments/webhook
   ```

   **Eventos:**
   - ✅ Marque apenas: `payment`

   **Método HTTP:**
   - ✅ POST (padrão)

4. **Clique em "Salvar" ou "Confirmar"**

### **PASSO 3: VERIFICAR CONFIGURAÇÃO**

Após salvar, você deve ver:
- ✅ URL configurada
- ✅ Eventos: `payment`
- ✅ Status: Ativo

---

## 🧪 **TESTAR WEBHOOK**

### **Opção 1: Teste Manual**

```bash
# Testar se endpoint responde
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "data": {
      "id": "test-123"
    }
  }'
```

**Resposta esperada:**
```json
{
  "received": true
}
```

### **Opção 2: Criar Pagamento de Teste**

1. **Criar pagamento PIX real (valor pequeno)**
2. **Verificar logs do backend:**
   ```bash
   flyctl logs --app goldeouro-backend-v2
   ```
3. **Verificar se webhook foi recebido:**
   - Procure por: `📨 [WEBHOOK] PIX recebido`
4. **Verificar banco de dados:**
   - Status deve mudar para `approved`

---

## 📊 **COMO FUNCIONA O WEBHOOK**

### **Fluxo Completo:**

1. **Usuário cria pagamento PIX**
2. **Usuário paga via Mercado Pago**
3. **Mercado Pago envia webhook**
4. **Backend recebe no `/api/payments/webhook`**
5. **Backend verifica pagamento no Mercado Pago**
6. **Backend atualiza status no banco:**
   - `pending` → `approved`
7. **Backend credita saldo do usuário**

### **Segurança:**

✅ **Validação de Signature:**
```javascript
// webhookSignatureValidator.createValidationMiddleware()
// Valida assinatura com o Webhook Secret
```

✅ **Idempotência:**
```javascript
// Verifica se evento já foi processado
// Evita duplicação
```

✅ **Timeout:**
```javascript
// Responde imediatamente (200 OK)
// Processa assincronamente
```

---

## 🔍 **LOGS DO WEBHOOK**

### **Logs Esperados no Backend:**

```log
📨 [WEBHOOK] PIX recebido: { type: 'payment', data: {...} }
📨 [WEBHOOK] Verificando pagamento: payment-123
📨 [WEBHOOK] Pagamento aprovado: payment-123
📨 [WEBHOOK] Atualizando saldo do usuário: user-456
```

### **Como Ver Logs:**

```bash
# Ver logs em tempo real
flyctl logs --app goldeouro-backend-v2

# Filtrar apenas webhooks
flyctl logs --app goldeouro-backend-v2 | grep "WEBHOOK"
```

---

## ✅ **CHECKLIST DE CONFIGURAÇÃO**

- [x] URL do webhook definida
- [x] Webhook Secret configurado no Fly.io
- [x] Endpoint implementado no backend
- [ ] Webhook configurado no painel Mercado Pago (PENDENTE)
- [ ] Teste realizado (PENDENTE)
- [ ] Logs verificados (PENDENTE)

---

## 🚨 **TROUBLESHOOTING**

### **PROBLEMA 1: Webhook não recebido**

**Verifique:**
1. ✅ URL está correta no painel
2. ✅ Backend está online
3. ✅ Endpoint está acessível
4. ✅ Eventos estão configurados

**Solução:**
```bash
# Testar endpoint
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "payment", "data": {"id": "test"}}'
```

### **PROBLEMA 2: Webhook recebido mas pagamento não atualizado**

**Verifique:**
1. ✅ Credenciais Mercado Pago corretas
2. ✅ Status do pagamento no Mercado Pago
3. ✅ Logs do backend para erros

**Solução:**
```bash
# Ver logs detalhados
flyctl logs --app goldeouro-backend-v2 | grep "WEBHOOK"
```

### **PROBLEMA 3: Duplicação de eventos**

**Verifique:**
1. ✅ Idempotência implementada
2. ✅ Verificação de eventos já processados

**Status:** ✅ Já implementado no código

---

## 🎯 **PRÓXIMOS PASSOS APÓS CONFIGURAR**

1. **✅ Webhook configurado no painel**
2. **⏳ Testar com pagamento real pequeno**
3. **⏳ Verificar logs do backend**
4. **⏳ Validar atualização no banco**
5. **⏳ Monitorar webhooks em produção**

---

## 📝 **RESUMO**

**URL do Webhook:**
```
https://goldeouro-backend-v2.fly.dev/api/payments/webhook
```

**Para configurar:**
1. Acesse: https://www.mercadopago.com.br/developers
2. Suas integrações → Sua aplicação
3. Webhooks → Configurar webhook
4. URL: `https://goldeouro-backend-v2.fly.dev/api/payments/webhook`
5. Eventos: `payment`
6. Salvar

**Testar:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": "payment", "data": {"id": "test"}}'
```

---

**STATUS:** 🟡 **Aguardando configuração no painel Mercado Pago**

