# 🚨 URGENTE - CONFIGURAR PRODUÇÃO REAL

## ❌ PROBLEMA IDENTIFICADO
O backend está rodando com configurações de desenvolvimento, por isso:
- Dados fictícios aparecem no painel
- PIX não funciona
- Redirecionamento para login

## ✅ SOLUÇÃO IMEDIATA

### 1. Configurar Variáveis de Ambiente no Fly.io

Execute estes comandos com suas credenciais reais:

```bash
# 1) Configurar banco de dados Supabase
flyctl secrets set DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"

# 2) Configurar Mercado Pago (PRODUÇÃO)
flyctl secrets set MP_ACCESS_TOKEN="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
flyctl secrets set MP_PUBLIC_KEY="APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 3) Configurar ambiente
flyctl secrets set NODE_ENV=production
flyctl secrets set APP_VERSION=v1.1.1
```

### 2. Verificar Configuração

```bash
# Ver todas as variáveis configuradas
flyctl secrets list
```

### 3. Fazer Deploy

```bash
# Deploy com as novas configurações
flyctl deploy
```

### 4. Testar

Após o deploy, teste:
- ✅ Cadastro de usuário real
- ✅ PIX funcionando
- ✅ Jogo sem redirecionamento

## 🔑 ONDE ENCONTRAR AS CREDENCIAIS

### Supabase (DATABASE_URL)
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings → Database
4. Copie a "Connection string" (URI)

### Mercado Pago (MP_ACCESS_TOKEN e MP_PUBLIC_KEY)
1. Acesse: https://www.mercadopago.com.br/developers
2. Selecione sua aplicação
3. Vá em "Credenciais"
4. Copie:
   - Access Token (PRODUÇÃO)
   - Public Key (PRODUÇÃO)

## ⚠️ IMPORTANTE
- Use sempre as credenciais de **PRODUÇÃO**
- NÃO use credenciais de teste/sandbox
- Teste cada funcionalidade após o deploy

## 🚀 APÓS CONFIGURAR
O sistema estará pronto para usuários reais:
- Cadastro real
- PIX real
- Jogo funcional
- Dados reais no painel
