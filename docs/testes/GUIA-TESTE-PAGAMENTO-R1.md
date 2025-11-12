# 💰 GUIA DE TESTE - PAGAMENTO R$ 1,00 END-TO-END
## Data: 27/10/2025

---

## 🎯 **OBJETIVO**

Testar o fluxo completo de pagamento PIX de **R$ 1,00** para validar:
- ✅ Criação de pagamento
- ✅ Geração de QR Code e PIX Copy Paste
- ✅ Pagamento real
- ✅ Recebimento de webhook
- ✅ Atualização de status
- ✅ Crédito de saldo

---

## 📋 **PRÉ-REQUISITOS**

1. ✅ Conta de usuário criada no sistema
2. ✅ Acesso ao app Mercado Pago
3. ✅ Acesso aos logs do backend
4. ✅ Acesso ao banco de dados (opcional)

---

## 🧪 **PASSO A PASSO DO TESTE**

### **PASSO 1: Fazer Login**

1. Acesse: https://www.goldeouro.lol
2. Faça login com seu usuário
3. Confirme que está autenticado (ver banner de logado)

---

### **PASSO 2: Ir para Página de Pagamentos**

1. Clique em **"Pagamentos"** ou **"Depósito"**
2. Ou acesse: https://www.goldeouro.lol/pagamentos

---

### **PASSO 3: Criar Pagamento PIX**

1. Selecione valor: **R$ 1,00**
2. Clique em **"Gerar PIX"**
3. Aguarde geração do QR Code

**Resultado Esperado:**
- ✅ QR Code exibido
- ✅ PIX Copy Paste gerado
- ✅ Código para copiar e colar disponível

---

### **PASSO 4: Pagar no Mercado Pago**

**OPÇÃO 1 - Usando o App Mercado Pago:**

1. Abra o app Mercado Pago
2. Clique em **"Pagar com código"**
3. Escaneie o QR Code OU cole o PIX Copy Paste
4. Confirme o valor: R$ 1,00
5. Escolha meio de pagamento (saldo, PIX, cartão)
6. Confirme o pagamento

**OPÇÃO 2 - Usando Pix Copia e Cola:**

1. Copie o código PIX (chave de pagamento)
2. Abra seu app bancário
3. Vá em "Pix" > "Pagar"
4. Cole o código
5. Confirme R$ 1,00
6. Confirme o pagamento

---

### **PASSO 5: Verificar Logs do Backend**

```bash
# No terminal, execute:
flyctl logs --app goldeouro-backend-v2
```

**Logs Esperados:**
```
📨 [WEBHOOK] PIX recebido: { type: 'payment', data: {...} }
📨 [WEBHOOK] Verificando pagamento: payment-XXXXX
📨 [WEBHOOK] Pagamento aprovado: payment-XXXXX
💰 [WEBHOOK] Pagamento aprovado: R$ 1.00 para usuário XXXXX
```

**Filtrar apenas webhooks:**
```bash
flyctl logs --app goldeouro-backend-v2 | grep "WEBHOOK"
```

---

### **PASSO 6: Verificar Atualização de Status**

1. Volte para a página de pagamentos
2. Recarregue a página (F5)
3. Verifique se o pagamento mudou para **"Aprovado"**

---

### **PASSO 7: Verificar Saldo**

1. Vá para o **Dashboard** ou **Perfil**
2. Verifique seu saldo
3. Confirme que foi creditado **R$ 1,00**

---

### **PASSO 8: Verificar Banco de Dados (Opcional)**

```sql
-- Ver pagamento criado
SELECT * FROM pagamentos_pix 
ORDER BY created_at DESC 
LIMIT 5;

-- Ver usuário e saldo
SELECT id, username, saldo FROM usuarios 
WHERE id = 'SEU_USER_ID';
```

---

## 🔍 **VERIFICAÇÕES OBRIGATÓRIAS**

### **Checklist de Validação:**

- [ ] QR Code foi gerado e exibido
- [ ] PIX Copy Paste foi gerado e funcionou
- [ ] Pagamento foi realizado no Mercado Pago
- [ ] Webhook foi recebido pelo backend (ver logs)
- [ ] Status mudou de "pending" para "approved"
- [ ] Saldo foi creditado corretamente
- [ ] Não houve duplicação de crédito
- [ ] Logs mostram processamento correto

---

## 🚨 **TROUBLESHOOTING**

### **PROBLEMA 1: QR Code não aparece**

**Verificar:**
- Token JWT válido
- Backend online
- Credenciais Mercado Pago configuradas

**Solução:**
```bash
# Verificar saúde do backend
curl https://goldeouro-backend-v2.fly.dev/health
```

### **PROBLEMA 2: Webhook não recebido**

**Verificar:**
- URL do webhook está correta no painel Mercado Pago
- Backend está acessível
- Eventos configurados: `payment`

**Ver logs:**
```bash
flyctl logs --app goldeouro-backend-v2
```

### **PROBLEMA 3: Saldo não creditado**

**Verificar:**
- Webhook foi processado (logs)
- Status mudou para "approved"
- Banco de dados atualizado

**Solução:**
```bash
# Ver logs detalhados
flyctl logs --app goldeouro-backend-v2 | grep "WEBHOOK"
```

---

## 📊 **RESULTADOS ESPERADOS**

### **Cenário 1: Sucesso Completo ✅**

```
1. Pagamento criado → ✅
2. QR Code gerado → ✅
3. Pagamento realizado → ✅
4. Webhook recebido → ✅
5. Status atualizado → ✅
6. Saldo creditado → ✅

Tempo Total: ~2-5 minutos
```

### **Cenário 2: Webhook Atrasado ⏳**

```
1. Pagamento criado → ✅
2. QR Code gerado → ✅
3. Pagamento realizado → ✅
4. Webhook recebido → ⏳ (pode levar alguns minutos)
5. Status atualizado → ⏳ (aguardar webhook)
6. Saldo creditado → ⏳ (aguardar webhook)

Solução: Aguardar webhook (pode levar até 10 minutos)
```

---

## ✅ **VALIDAÇÃO FINAL**

### **O teste foi bem-sucedido se:**

1. ✅ QR Code foi gerado
2. ✅ Pagamento foi realizado
3. ✅ Webhook foi recebido (ver logs)
4. ✅ Status mudou para "approved"
5. ✅ Saldo foi creditado com R$ 1,00
6. ✅ Não houve duplicação

### **Se tudo funcionou:**

**🎉 SISTEMA 100% FUNCIONAL!**

Próximos passos:
- Testar com valores maiores
- Testar múltiplos usuários
- Monitorar logs em produção
- Validar todos os endpoints

---

## 📝 **RELATÓRIO DO TESTE**

**Após realizar o teste, preencha:**

```
Data do Teste: __/__/____
Hora: __:__
Usuário: _______________
Valor testado: R$ _____,__
QR Code gerado: [ ] SIM [ ] NÃO
Pagamento realizado: [ ] SIM [ ] NÃO
Webhook recebido: [ ] SIM [ ] NÃO
Saldo creditado: [ ] SIM [ ] NÃO
Status: [ ] APROVADO [ ] REJEITADO
Observações: 
________________________________
________________________________
```

---

## 🎯 **APÓS O TESTE**

### **AÇÃO 1: Validar Pontuação Mercado Pago**

1. Acesse: https://www.mercadopago.com.br/developers
2. Suas integrações → Gol de Ouro
3. Avaliação → Qualidade da integração
4. Clique em **"Medir de novo"**
5. Verifique se pontuação melhorou

**Esperado:** 70+/100 pontos

### **AÇÃO 2: Monitorar Logs**

Continue monitorando logs por 24 horas:
```bash
# Ver logs em tempo real
flyctl logs --app goldeouro-backend-v2

# Filtrar webhooks
flyctl logs --app goldeouro-backend-v2 | grep "WEBHOOK"
```

### **AÇÃO 3: Testar Outros Cenários**

- Teste com valor maior (R$ 10,00)
- Teste com múltiplos pagamentos
- Teste com pagamentos rejeitados
- Teste com webhooks duplicados

---

## 🎉 **CONCLUSÃO**

Este teste valida:
- ✅ Fluxo completo end-to-end
- ✅ Webhooks funcionando
- ✅ Crédito de saldo automático
- ✅ Segurança (validação, idempotência)
- ✅ Performance (tempo de processamento)

**Status:** 🟢 **PRONTO PARA EXECUTAR**

**Tempo Estimado:** 5-10 minutos

**Próximo Passo:** Execute o teste e reporte os resultados!

