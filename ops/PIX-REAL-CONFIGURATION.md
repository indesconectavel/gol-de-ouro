# 💳 PIX REAL - CONFIGURAÇÃO MERCADO PAGO

**Data:** 2025-01-27  
**Versão:** v1.1.1 + SIMPLE_MVP  
**Status:** Produção

---

## **🔧 CONFIGURAÇÃO MERCADO PAGO**

### **1️⃣ Tokens Necessários**

#### **Payments (Depósitos)**
```env
MP_ACCESS_TOKEN=APP_USR-<<seu_token_payments>>
```

#### **Payouts/Transfers (Saques) - Opcional**
```env
MP_PAYOUT_ACCESS_TOKEN=APP_USR-<<seu_token_payouts>>
```

### **2️⃣ Escopos Necessários**

#### **Payments (Obrigatório)**
- `payments:write` - Criar pagamentos PIX
- `payments:read` - Consultar status de pagamentos

#### **Payouts/Transfers (Opcional)**
- `transfers:write` - Criar transferências PIX
- `transfers:read` - Consultar status de transferências

---

## **🌐 WEBHOOKS CONFIGURADOS**

### **Depósito PIX**
```
URL: https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook
Eventos: payment
Método: POST
```

### **Saque PIX (se habilitado)**
```
URL: https://goldeouro-backend-v2.fly.dev/api/pix/withdraw/webhook
Eventos: transfer
Método: POST
```

---

## **🔒 SEGURANÇA IMPLEMENTADA**

### **Validações**
- ✅ Validação de valores (R$ 1,00 - R$ 1.000,00)
- ✅ Validação de chaves PIX (CPF, CNPJ, Email, Telefone)
- ✅ Validação de external_reference
- ✅ Prevenção de injection
- ✅ Idempotência com UUID

### **Logs de Segurança**
- ✅ Logs de pagamentos aprovados
- ✅ Logs de webhooks recebidos
- ✅ Logs de erros e falhas
- ✅ Logs de saques processados

### **Rate Limiting**
- ✅ Limite de 100 requisições/minuto por IP
- ✅ Timeout de 10 segundos para API MP
- ✅ Retry automático em falhas temporárias

---

## **📊 FLUXO DE DADOS**

### **Depósito PIX**
1. **Criação:** `POST /api/payments/pix/criar`
2. **Webhook:** `POST /api/payments/pix/webhook`
3. **Credito:** Saldo do usuário atualizado
4. **Log:** Transação registrada

### **Saque PIX**
1. **Solicitação:** `POST /api/withdraw/request`
2. **Validação:** Saldo e chave PIX
3. **Processamento:** Débito automático
4. **Transferência:** Via API MP (se habilitado)

---

## **⚠️ FALLBACK SEM PAYOUTS**

Se `MP_PAYOUT_ACCESS_TOKEN` não estiver configurado:

- ✅ Sistema **NÃO quebra**
- ✅ Retorna `status: "pending-auto"`
- ✅ Log de instruções para habilitação
- ✅ UI continua funcionando

### **Para Habilitar Payouts:**
1. Acesse [Mercado Pago Developers](https://developers.mercadopago.com)
2. Vá em "Suas integrações" → "Credenciais"
3. Solicite escopo de "Transfers/Payouts"
4. Configure `MP_PAYOUT_ACCESS_TOKEN`
5. Reinicie o backend

---

## **🧪 TESTES**

### **Teste de Depósito**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"amount": 10.00, "description": "Teste", "user_id": "test123"}'
```

### **Teste de Saque**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/withdraw/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"amount": 5.00, "pix_key": "12345678901", "pix_key_type": "cpf"}'
```

---

## **📈 MONITORAMENTO**

### **Métricas Importantes**
- Taxa de aprovação de pagamentos
- Tempo médio de processamento
- Erros de webhook
- Saques pendentes

### **Alertas Configurados**
- Pagamentos rejeitados > 10%
- Webhooks falhando > 5%
- Saques pendentes > 1 hora

---

## **🆘 SUPORTE**

### **Problemas Comuns**
1. **Webhook não recebido:** Verificar URL e eventos
2. **Pagamento não creditado:** Verificar external_reference
3. **Saque não processado:** Verificar MP_PAYOUT_ACCESS_TOKEN

### **Contato**
- **WhatsApp:** +55 11 99999-9999
- **Email:** suporte@goldeouro.lol
- **Discord:** #gol-de-ouro

---

**Configuração documentada em:** 2025-01-27 16:00 BRT  
**Próxima revisão:** Após 30 dias de produção