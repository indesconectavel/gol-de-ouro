# ❌ ERRO: Mercado Pago - excluded_payment_types

## 🔍 ERRO IDENTIFICADO NOS LOGS

**Erro:**
```
message: 'invalid type (string) for field: payment_methods.excluded_payment_types',
error: 'invalid_payment_methods.excluded_payment_types',
status: 400
```

**Causa:**
A API do Mercado Pago não aceita array de strings diretamente em `excluded_payment_types`. O formato correto requer objetos com `id` e `type`.

---

## ✅ CORREÇÃO APLICADA

**Mudança:**
- Removida a exclusão de tipos de pagamento
- Mantido `excluded_payment_types: []` (vazio)
- O Mercado Pago gerará o código PIX quando o usuário selecionar PIX no checkout

**Arquivo:** `controllers/paymentController.js`

---

## 🔍 PROBLEMA ORIGINAL

O código PIX não estava sendo retornado porque:
1. A preferência permite todos os tipos de pagamento
2. O código PIX só é gerado quando o usuário seleciona PIX no checkout
3. Para gerar código PIX imediatamente, precisamos usar Payment API em vez de Preference API

---

## 🚀 SOLUÇÃO ALTERNATIVA (FUTURO)

Para gerar código PIX imediatamente sem checkout:

1. **Usar Payment API diretamente:**
   - Criar pagamento via `/v1/payments`
   - Especificar `payment_method_id: 'pix'`
   - Obter código PIX imediatamente

2. **Ou aguardar seleção do usuário:**
   - Manter Preference API atual
   - Código PIX será gerado quando usuário selecionar PIX
   - Consultar preferência após seleção

---

**Status:** ✅ **CORRIGIDO - REVERTIDO PARA ESTADO ORIGINAL**

**Próxima Ação:** Fazer deploy e testar novamente

