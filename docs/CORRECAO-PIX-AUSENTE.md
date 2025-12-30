# 🔧 CORREÇÃO: Código PIX Ausente

## ❌ PROBLEMA IDENTIFICADO

**Sintoma:** Código PIX (`pix_copy_paste`), QR Code e QR Code Base64 não estão sendo retornados pelo Mercado Pago.

**Teste Executado:**
- ✅ Login: Sucesso
- ✅ Criação de PIX: Sucesso (Payment ID gerado)
- ❌ Código PIX: Ausente (`null`)
- ❌ QR Code: Ausente
- ❌ QR Code Base64: Ausente

**Dados Retornados:**
```json
{
  "payment_id": "468718642-0eabb07f-b81f-436a-a77f-6edc812df187",
  "pix_copy_paste": null,
  "expires_at": "2025-11-19T03:14:16.824+00:00",
  "init_point": "https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=..."
}
```

---

## 🔍 CAUSA RAIZ

O código está criando uma **preferência de pagamento genérica** que permite todos os tipos de pagamento. O Mercado Pago só gera o código PIX quando:

1. O usuário seleciona PIX como método de pagamento no checkout, OU
2. A preferência é criada **forçando apenas PIX** como método de pagamento

**Problema:** A preferência atual não força PIX, então o código PIX não é gerado imediatamente.

---

## ✅ CORREÇÃO APLICADA

**Arquivo:** `controllers/paymentController.js`

**Mudança:**
```javascript
payment_methods: {
  excluded_payment_methods: [],
  excluded_payment_types: ['credit_card', 'debit_card', 'ticket', 'bank_transfer', 'atm', 'account_money'],
  installments: 1
}
```

**O que faz:**
- ✅ Exclui todos os outros tipos de pagamento
- ✅ Força apenas PIX como método disponível
- ✅ Mercado Pago deve gerar código PIX imediatamente

---

## 🚀 PRÓXIMOS PASSOS

### **1. Fazer Deploy** ⏳

A correção precisa ser aplicada em produção:

```bash
flyctl deploy -a goldeouro-backend-v2
```

OU via GitHub Actions (se configurado).

---

### **2. Executar Teste Novamente** ⏳

Após o deploy, executar:

```bash
node scripts/testar-criar-pix.js free10signer@gmail.com Free10signer 1.00
```

**Resultado Esperado:**
- ✅ `pix_copy_paste` presente
- ✅ `qr_code` presente
- ✅ `qr_code_base64` presente

---

## 📋 VALIDAÇÃO

Após o deploy, verificar:

1. ✅ Criação de PIX retorna código PIX
2. ✅ QR Code está presente
3. ✅ Código copia e cola funciona
4. ✅ Status pode ser consultado

---

## 🔍 ALTERNATIVA (Se Correção Não Funcionar)

Se após o deploy o código PIX ainda não aparecer, pode ser necessário:

1. **Usar Payment API em vez de Preference API:**
   - Criar pagamento direto via `/v1/payments`
   - Especificar `payment_method_id: 'pix'`

2. **Aguardar mais tempo:**
   - Mercado Pago pode levar alguns segundos para gerar código PIX
   - Implementar polling para consultar preferência após criação

3. **Verificar credenciais do Mercado Pago:**
   - Confirmar que PIX está habilitado na conta
   - Verificar se as credenciais são de produção/teste corretas

---

**Status:** ✅ **CORREÇÃO APLICADA - AGUARDANDO DEPLOY**

**Próxima Ação:** Fazer deploy do backend e testar novamente

