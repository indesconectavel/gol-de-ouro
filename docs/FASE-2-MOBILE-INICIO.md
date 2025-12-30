# 📱 FASE 2 MOBILE - INÍCIO: PIX e Saldo

**Data:** 17/11/2025  
**Status:** 🟡 **EM PROGRESSO**  
**Fase:** FASE 2 - Importante

---

## ✅ PROGRESSO

### Concluído:
- ✅ Métodos PIX adicionados ao GameService.js
- ✅ Métodos de saldo/extrato adicionados ao GameService.js

### Pendente:
- ⏭️ Criar tela de criar pagamento PIX
- ⏭️ Criar tela de status de pagamento PIX
- ⏭️ Criar tela de histórico de pagamentos PIX
- ⏭️ Criar tela de saldo e extrato
- ⏭️ Criar tela de histórico de partidas/chutes

---

## 📋 MÉTODOS IMPLEMENTADOS NO GAMESERVICE

### PIX Payments:
1. ✅ `createPixPayment(valor, descricao)` - POST `/api/payments/pix/criar`
2. ✅ `getPixPaymentStatus(paymentId)` - GET `/api/payments/pix/status/:payment_id`
3. ✅ `listPixPayments(userId, limit, offset)` - GET `/api/payments/pix/usuario/:user_id`
4. ✅ `cancelPixPayment(paymentId)` - POST `/api/payments/pix/cancelar/:payment_id`

### Saldo e Extrato:
5. ✅ `getBalance(userId)` - GET `/api/payments/saldo/:user_id`
6. ✅ `getStatement(userId, limit, offset)` - GET `/api/payments/extrato/:user_id`

---

## 🎯 PRÓXIMOS PASSOS

1. Criar telas de PIX
2. Criar tela de saldo/extrato
3. Integrar com navegação
4. Testar fluxo completo

---

**Status:** 🟡 **EM PROGRESSO**

