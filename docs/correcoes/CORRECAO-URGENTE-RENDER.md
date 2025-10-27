# 🚨 CORREÇÃO URGENTE - ERRO NO RENDER.COM

## 📋 Problema Identificado

**Erro:** Deploy falhando no Render.com
```
ERROR: Missing environment variables:
- MERCADOPAGO_ACCESS_TOKEN: Access Token do Mercado Pago
- MERCADOPAGO_WEBHOOK_SECRET: Secret para validação de webhooks do Mercado Pago
Exiting with error code 1
```

## 🔧 SOLUÇÃO IMEDIATA (5 MINUTOS)

### **1. Acessar Render.com**
1. Ir para: https://dashboard.render.com
2. Fazer login na sua conta
3. Selecionar o serviço **"goldeouro-backend"**

### **2. Configurar Variáveis de Ambiente**
1. No menu lateral, clicar em **"Environment"**
2. Adicionar as seguintes variáveis:

```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7954357605868928-090204-e9f5fb668c0f91f6b729328b1e14adf5-468718642
```

```
MERCADOPAGO_WEBHOOK_SECRET=157e633722bf94eb817dcd66d6e13c08425517779a7962feb034ddd26671f9bf
```

### **3. Fazer Novo Deploy**
1. Ir em **"Deploys"** no menu lateral
2. Clicar em **"Manual Deploy"**
3. Selecionar **"Deploy latest commit"**
4. Aguardar o deploy completar

### **4. Verificar Deploy**
1. Verificar logs de deploy
2. Testar endpoints:
   - https://goldeouro-backend.onrender.com/health
   - https://goldeouro-backend.onrender.com/api/test
   - https://goldeouro-backend.onrender.com/api/public/dashboard

## 🎯 COMANDOS PARA VERIFICAR

### **Testar Produção:**
```bash
# Verificar se produção está funcionando
node check-production.js
```

### **Verificar Variáveis Locais:**
```bash
# Verificar se variáveis estão no .env local
Get-Content .env | Select-String "MERCADOPAGO"
```

## ✅ RESULTADO ESPERADO

Após a correção:
- ✅ Deploy bem-sucedido
- ✅ Healthcheck respondendo
- ✅ API dashboard funcionando
- ✅ Sistema de pagamentos ativo
- ✅ Frontend conectando ao backend

## 🚀 PRÓXIMOS PASSOS

1. **Configurar variáveis no Render.com** (5 minutos)
2. **Fazer novo deploy** (2 minutos)
3. **Verificar produção** (1 minuto)
4. **Continuar desenvolvimento** (ETAPA 6)

---

**IMPORTANTE:** Este erro está impedindo o deploy. Após corrigir, o sistema funcionará perfeitamente em produção!
