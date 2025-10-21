# 🔑 GUIA COMPLETO: COMO OBTER TOKEN MERCADO PAGO PARA PIX REAL

## 📅 **Data:** 11 de Outubro de 2025  
## 🎯 **Objetivo:** Obter Access Token de Produção do Mercado Pago

---

## 🚀 **PASSO A PASSO DETALHADO:**

### **1. 🌐 ACESSAR MERCADO PAGO DEVELOPERS:**
- **URL:** https://www.mercadopago.com.br/developers
- **Login:** Use sua conta Mercado Pago (`free10signer@gmail.com`)
- **Navegação:** Clique em "Suas integrações"

### **2. 📋 SELECIONAR PROJETO:**
- **Projeto:** "Gol de Ouro"
- **Integração:** "Checkout Transparente"
- **Status:** Verificar se está ativo

### **3. 🔑 OBTER CREDENCIAIS DE PRODUÇÃO:**
- **Menu:** Clique em "PRODUÇÃO"
- **Seção:** "Credenciais de produção"
- **Token:** Copie o "Access Token" (não o Public Key)

### **4. 📝 FORMATO DO TOKEN:**
- **Início:** `APP_USR_` ou `TEST_`
- **Comprimento:** Aproximadamente 100+ caracteres
- **Exemplo:** `APP_USR_1234567890abcdef...`

---

## 🔧 **CONFIGURAR NO FLY.IO:**

### **1. 📤 DEFINIR SECRET:**
```bash
fly secrets set MERCADOPAGO_ACCESS_TOKEN="SEU_TOKEN_AQUI"
```

### **2. 🔄 REDEPLOYAR:**
```bash
fly deploy
```

### **3. ✅ VERIFICAR:**
```bash
fly secrets list
```

---

## 🎯 **INFORMAÇÕES IMPORTANTES:**

### **✅ CHAVE PIX REAL:**
- **Chave:** `b3ada08e-945f-4143-a369-3a8c44dbd87f`
- **Tipo:** Chave aleatória
- **Status:** Ativa no Mercado Pago
- **QR Code:** Disponível e funcional

### **✅ WEBHOOK CONFIGURADO:**
- **URL:** `https://goldeouro-backend.fly.dev/api/payments/webhook`
- **Secret:** `157e633722bf94eb817dcd66d6e13c08425517779a7962feb034ddd26671f9bf`
- **Eventos:** Pagamentos
- **Status:** Funcionando

### **✅ CONTA MERCADO PAGO:**
- **Email:** `free10signer@gmail.com`
- **CNPJ:** `48.487173/0001-02`
- **Banco:** `323 Mercado Pago`
- **Conta:** `2721395787-2`

---

## 🚨 **PROBLEMAS COMUNS:**

### **❌ TOKEN DE TESTE:**
- **Problema:** Usar token que começa com `TEST_`
- **Solução:** Usar token de produção (`APP_USR_`)

### **❌ TOKEN INVÁLIDO:**
- **Problema:** Token expirado ou incorreto
- **Solução:** Gerar novo token no Mercado Pago

### **❌ PERMISSÕES:**
- **Problema:** Token sem permissões de PIX
- **Solução:** Verificar permissões no projeto

---

## 📊 **TESTE APÓS CONFIGURAÇÃO:**

### **1. 🔍 VERIFICAR LOGS:**
```bash
fly logs -a goldeouro-backend
```

### **2. 💳 TESTAR PIX:**
```bash
curl -X POST https://goldeouro-backend.fly.dev/api/payments/pix/criar \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}'
```

### **3. ✅ VALIDAR RESPOSTA:**
- **QR Code:** Deve ser real (não simulado)
- **PIX Code:** Deve funcionar em apps bancários
- **Status:** Deve ser "Pagamento PIX criado com sucesso!"

---

## 🎊 **RESULTADO ESPERADO:**

### **✅ PIX REAL FUNCIONAL:**
- **QR Code:** Escaneável por apps bancários
- **PIX Code:** Funcional para pagamentos
- **Webhook:** Processamento automático
- **Crédito:** Automático após pagamento

### **✅ LOGS CORRETOS:**
```
💳 Criando PIX real via Mercado Pago API...
✅ PIX criado via Mercado Pago: 1234567890
```

---

## 🏆 **CONCLUSÃO:**

**Para ativar o PIX real, você precisa:**

1. **✅ Obter** Access Token de produção do Mercado Pago
2. **✅ Configurar** como secret no Fly.io
3. **✅ Redepoyar** o backend
4. **✅ Testar** o PIX em apps bancários

**🎯 Com o token correto, o PIX funcionará perfeitamente para jogadores reais!**

---

**📞 Suporte:** Sistema monitorado 24/7  
**🔄 Atualizações:** Automáticas via CI/CD  
**📊 Monitoramento:** Logs em tempo real  
**🎯 Status:** AGUARDANDO TOKEN MERCADO PAGO PARA ATIVAR PIX REAL
