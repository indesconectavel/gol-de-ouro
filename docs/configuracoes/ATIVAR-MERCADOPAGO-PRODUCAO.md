# 💳 ATIVAÇÃO MERCADO PAGO - PRODUÇÃO REAL
## Data: 27/10/2025

---

## ⚠️ **IMPORTANTE - LEIA ANTES DE CONTINUAR**

**Ativar Mercado Pago em PRODUÇÃO significa:**
- ✅ Cobranças REAIS serão processadas
- ✅ Dinheiro REAL será movimentado
- ✅ Transações reais com cartões bancários
- ❌ Não é mais simulação

**Certifique-se de que:**
1. ✅ Você tem conta Mercado Pago verificada
2. ✅ Domínio configurado corretamente
3. ✅ Backend funcionando perfeitamente
4. ✅ Testes realizados em modo sandbox
5. ✅ Entende os custos do Mercado Pago

---

## 📋 **PRÉ-REQUISITOS**

### **1. Conta Mercado Pago:**
- ✅ Conta verificada
- ✅ Documentos enviados
- ✅ Conta ativa e habilitada
- ✅ Acesso às credenciais de PRODUÇÃO

### **2. Infraestrutura:**
- ✅ Backend funcionando: https://goldeouro-backend-v2.fly.dev
- ✅ Supabase conectado REAL
- ✅ Domain configurado: goldeouro.lol
- ✅ SSL funcionando

### **3. Testes Realizados:**
- ✅ Fluxo de pagamento testado (sandbox)
- ✅ Webhooks testados
- ✅ Banco de dados funcionando

---

## 🚀 **PASSO A PASSO - ATIVAR PRODUÇÃO**

### **PASSO 1: OBTER CREDENCIAIS REAIS**

1. **Acesse:** https://www.mercadopago.com.br/developers
2. **Faça login** na sua conta
3. **Vá em "Suas integrações"**
4. **Selecione seu aplicativo** ou crie um novo
5. **Vá em "Credenciais"** > **PRODUÇÃO** (não TESTE!)
6. **Copie as credenciais:**
   - **Access Token:** deve começar com `APP_USR-`
   - **Public Key:** deve começar com `APP_USR-`

### **PASSO 2: CONFIGURAR NO FLY.IO**

Execute os comandos abaixo substituindo pelas suas credenciais REAIS:

```bash
# Configurar Access Token de PRODUÇÃO
flyctl secrets set MERCADOPAGO_ACCESS_TOKEN="APP_USR-xxxxxxxxxxxx" --app goldeouro-backend-v2

# Configurar Public Key de PRODUÇÃO
flyctl secrets set MERCADOPAGO_PUBLIC_KEY="APP_USR-xxxxxxxxxxxx" --app goldeouro-backend-v2

# Configurar Webhook Secret (se configurado)
flyctl secrets set MERCADOPAGO_WEBHOOK_SECRET="seu-webhook-secret-2025-real" --app goldeouro-backend-v2
```

### **PASSO 3: CONFIGURAR WEBHOOKS**

1. **No painel Mercado Pago:**
   - Vá em "Notificações" > "Webhooks"
   - Adicione URL: `https://goldeouro-backend-v2.fly.dev/api/payments/webhook`
   - Configurar eventos: `payment`

### **PASSO 4: DEPLOY DO BACKEND**

```bash
cd E:\Chute de Ouro\goldeouro-backend
flyctl deploy --app goldeouro-backend-v2
```

### **PASSO 5: VERIFICAR HEALTH CHECK**

```bash
curl https://goldeouro-backend-v2.fly.dev/health
```

**Deve retornar:**
```json
{
  "pix": "REAL (produção)",
  ...
}
```

---

## 🧪 **TESTAR PAGAMENTOS REAIS**

### **TESTE 1: Criar Pagamento PIX**

**Endpoint:** `POST /api/payments/pix/create`

**Request:**
```json
{
  "amount": 10.00,
  "user_id": "seu-user-id"
}
```

**Response esperada:**
```json
{
  "success": true,
  "payment": {
    "id": "payment-id",
    "qr_code": "...",
    "pix_copy_paste": "...",
    "status": "pending"
  }
}
```

### **TESTE 2: Verificar Webhook**

- Faça um pagamento teste
- Verifique logs do webhook no Fly.io
- Verifique se status mudou para "approved"

### **TESTE 3: Verificar Banco de Dados**

```sql
SELECT * FROM pagamentos_pix ORDER BY created_at DESC LIMIT 5;
```

Deve mostrar:
- `real: true` (não mais false)
- Status atualizado
- Dados corretos

---

## 📊 **MONITORAMENTO**

### **1. Verificar Logs:**
```bash
flyctl logs --app goldeouro-backend-v2
```

### **2. Verificar Métricas:**
```bash
flyctl metrics --app goldeouro-backend-v2
```

### **3. Dashboard Mercado Pago:**
- https://www.mercadopago.com.br/developers
- Ver transações em tempo real
- Verificar status de pagamentos

---

## 🚨 **TROUBLESHOOTING**

### **ERRO 1: "Credenciais inválidas"**
- ✅ Verificar se credenciais são de PRODUÇÃO (APP_USR-)
- ✅ Verificar se não são de TESTE (sb_secret_)
- ✅ Verificar se conta está verificada

### **ERRO 2: "Webhook não recebe notificações"**
- ✅ Verificar URL do webhook
- ✅ Verificar se backend está acessível
- ✅ Verificar logs do backend

### **ERRO 3: "Pagamento não aprova"**
- ✅ Verificar status da conta Mercado Pago
- ✅ Verificar logs de erro
- ✅ Verificar configuração de webhook

---

## ⚠️ **AVISOS IMPORTANTES**

1. **Taxas do Mercado Pago:**
   - PIX: ~1.5% por transação
   - Cartão: ~2.5% por transação
   - Considere nos seus cálculos

2. **Segurança:**
   - ✅ Nunca exponha credenciais
   - ✅ Use apenas HTTPS
   - ✅ Valide webhooks

3. **Compliance:**
   - ✅ Siga LGPD
   - ✅ Proteja dados de pagamento
   - ✅ Documente transações

---

## ✅ **CHECKLIST DE ATIVAÇÃO**

Antes de ativar, confirme:
- [ ] Credenciais de PRODUÇÃO obtidas
- [ ] Backend testado em sandbox
- [ ] Webhooks configurados
- [ ] Domain SSL funcionando
- [ ] Conta Mercado Pago verificada
- [ ] Testes realizados com sucesso
- [ ] Monitoramento configurado
- [ ] Documentação atualizada

---

## 🎉 **APÓS ATIVAÇÃO**

1. ✅ Monitorar primeiras transações
2. ✅ Verificar webhooks funcionando
3. ✅ Validar saldo no Mercado Pago
4. ✅ Acompanhar logs diariamente

---

**🚀 Quando estiver pronto, execute os comandos acima para ativar PRODUÇÃO!**
