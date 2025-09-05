# 🚨 GUIA DE CORREÇÃO - PROBLEMAS DE PRODUÇÃO

## Problema Identificado
O deploy no Render.com está falhando devido a variáveis de ambiente ausentes:
- MERCADOPAGO_ACCESS_TOKEN
- MERCADOPAGO_WEBHOOK_SECRET

## Solução Passo a Passo

### 1. Acessar Render.com
1. Ir para https://dashboard.render.com
2. Fazer login na sua conta
3. Selecionar o serviço "goldeouro-backend"

### 2. Configurar Variáveis de Ambiente
1. Ir em "Environment" no menu lateral
2. Adicionar as seguintes variáveis:

```
MERCADOPAGO_ACCESS_TOKEN=APP_USR-7954357605868928-090204-e9f5fb668c0f91f6b729328b1e14adf5-468718642
MERCADOPAGO_WEBHOOK_SECRET=157e633722bf94eb817dcd66d6e13c08425517779a7962feb034ddd26671f9bf
```

### 3. Fazer Novo Deploy
1. Ir em "Deploys" no menu lateral
2. Clicar em "Manual Deploy"
3. Selecionar "Deploy latest commit"
4. Aguardar o deploy completar

### 4. Verificar Deploy
1. Verificar logs de deploy
2. Testar endpoints:
   - https://goldeouro-backend.onrender.com/health
   - https://goldeouro-backend.onrender.com/api/test
   - https://goldeouro-backend.onrender.com/api/public/dashboard

### 5. Testar Sistema Completo
1. Executar: node check-production.js
2. Verificar se todos os endpoints respondem
3. Testar funcionalidades de pagamento

## Comandos Úteis

```bash
# Verificar produção
node check-production.js

# Verificar variáveis locais
Get-Content .env | Select-String "MERCADOPAGO"

# Testar API local
node test-api.js
```

## Status Esperado Após Correção
- ✅ Deploy bem-sucedido
- ✅ Healthcheck respondendo
- ✅ API dashboard funcionando
- ✅ Sistema de pagamentos ativo
- ✅ Frontend conectando ao backend

## Próximos Passos
1. Corrigir problemas locais
2. Validar integração completa
3. Continuar desenvolvimento (ETAPA 6)
