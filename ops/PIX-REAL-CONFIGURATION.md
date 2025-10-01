# 💳 PIX REAL - CONFIGURAÇÃO COMPLETA

**Data:** 2025-10-01  
**Versão:** v1.1.1  
**Status:** Implementado com Fallback

---

## 🎯 **STATUS ATUAL**

### **✅ Implementado**
- Serviço PIX Mercado Pago (`services/pix-mercado-pago.js`)
- Rotas PIX com fallback real/simulação
- Webhook PIX funcional
- Testes automatizados

### **⚠️ Pendente**
- Configuração do token Mercado Pago
- Teste com PIX real
- Integração com banco de dados

---

## 🔧 **CONFIGURAÇÃO NECESSÁRIA**

### **1. Token Mercado Pago**
```env
# Adicionar ao .env do backend
MP_ACCESS_TOKEN=APP_USR-seu_token_aqui
PIX_WEBHOOK_URL=https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook
```

### **2. Configurar Webhook no Mercado Pago**
1. Acesse: https://www.mercadopago.com.br/developers
2. Vá para sua aplicação
3. Configure webhook:
   - **URL:** `https://goldeouro-backend-v2.fly.dev/api/payments/pix/webhook`
   - **Eventos:** `payment`

---

## 🧪 **TESTES REALIZADOS**

### **✅ Teste Backend**
- Backend online e respondendo
- Health check funcionando
- Memória: 74MB (normal)

### **✅ Teste Criação PIX**
- PIX criado com sucesso
- QR Code gerado
- Status: pending
- **Modo:** Simulação (sem token MP)

### **❌ Teste Status PIX**
- Erro 401: Token de acesso necessário
- **Causa:** Rota protegida por JWT
- **Solução:** Implementar rota pública ou usar token

### **✅ Teste Webhook**
- Webhook processado com sucesso
- Resposta: `{ received: true }`

---

## 🔄 **FLUXO PIX IMPLEMENTADO**

### **1. Criação de PIX**
```
POST /api/payments/pix/criar
{
  "amount": 10.00,
  "description": "Depósito Gol de Ouro",
  "user_id": "user_123"
}
```

**Resposta (Simulação):**
```json
{
  "id": "pix_1759337361968",
  "amount": 10.00,
  "qr_code": "00020126580014br.gov.bcb.pix...",
  "copy_paste_key": "00020126580014br.gov.bcb.pix...",
  "status": "pending",
  "message": "PIX criado com sucesso (Simulação)"
}
```

**Resposta (Mercado Pago):**
```json
{
  "id": "1234567890",
  "amount": 10.00,
  "qr_code": "00020126580014br.gov.bcb.pix...",
  "qr_code_base64": "data:image/png;base64...",
  "external_reference": "goldeouro_user_123_1759337361968",
  "status": "pending",
  "message": "PIX criado com sucesso (Mercado Pago)"
}
```

### **2. Webhook PIX**
```
POST /api/payments/pix/webhook
{
  "type": "payment",
  "data": {
    "id": "1234567890"
  }
}
```

**Processamento:**
1. Recebe webhook do Mercado Pago
2. Busca dados do pagamento
3. Verifica se foi aprovado
4. Extrai userId do external_reference
5. Credita saldo (TODO)

---

## 🚀 **ATIVAÇÃO PIX REAL**

### **Passo 1: Obter Token Mercado Pago**
1. Acesse https://www.mercadopago.com.br/developers
2. Crie uma aplicação
3. Copie o Access Token (APP_USR-...)

### **Passo 2: Configurar Variáveis**
```bash
# No Fly.io
fly secrets set MP_ACCESS_TOKEN=APP_USR-seu_token_aqui

# Ou no .env local
echo "MP_ACCESS_TOKEN=APP_USR-seu_token_aqui" >> .env
```

### **Passo 3: Deploy Backend**
```bash
fly deploy --app goldeouro-backend-v2
```

### **Passo 4: Testar**
```bash
node test-pix-real.cjs
```

---

## 📊 **MONITORAMENTO**

### **Logs Importantes**
```bash
# Ver logs do backend
fly logs --app goldeouro-backend-v2

# Filtrar logs PIX
fly logs --app goldeouro-backend-v2 | grep -i pix
```

### **Métricas a Acompanhar**
- Taxa de sucesso PIX
- Tempo de resposta
- Erros de webhook
- Saldo creditado

---

## 🔧 **TROUBLESHOOTING**

### **Problema: PIX não cria**
- Verificar se MP_ACCESS_TOKEN está configurado
- Verificar logs do backend
- Testar conectividade com Mercado Pago

### **Problema: Webhook não recebe**
- Verificar URL do webhook no Mercado Pago
- Verificar se backend está acessível
- Verificar logs do webhook

### **Problema: Saldo não credita**
- Implementar lógica de crédito no webhook
- Verificar banco de dados
- Verificar external_reference

---

## 📋 **PRÓXIMOS PASSOS**

1. **Configurar token Mercado Pago** ⏳
2. **Testar PIX real** ⏳
3. **Implementar crédito de saldo** ⏳
4. **Configurar webhook no MP** ⏳
5. **Testar fluxo completo** ⏳

---

**Status:** ✅ **PIX IMPLEMENTADO COM FALLBACK**  
**Próximo:** Configurar token e testar PIX real
