# 🔧 GUIA PRÁTICO PARA CONFIGURAÇÃO DE CREDENCIAIS REAIS

## 📊 STATUS ATUAL

**✅ INFRAESTRUTURA FUNCIONANDO:**
- **Fly.io Backend:** ✅ Online (https://goldeouro-backend.fly.dev)
- **Vercel Player:** ✅ Online (https://goldeouro.lol)
- **Vercel Admin:** ✅ Online (https://admin.goldeouro.lol)
- **Sistema de Fallbacks:** ✅ Funcionando perfeitamente

**⚠️ CREDENCIAIS PENDENTES:**
- **Supabase:** Credenciais são placeholders
- **Mercado Pago:** Credenciais são placeholders

---

## 🚀 CONFIGURAÇÃO RÁPIDA (15 MINUTOS)

### 1. SUPABASE (5 minutos)

#### Passo 1: Criar Projeto
1. Acesse: https://supabase.com
2. Clique em "New Project"
3. Escolha organização
4. Nome: `goldeouro-production`
5. Senha: `GolDeOuro2025!`
6. Região: `South America (São Paulo)`

#### Passo 2: Obter Credenciais
1. Vá em Settings > API
2. Copie:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

#### Passo 3: Executar Schema
1. Vá em SQL Editor
2. Cole o conteúdo de `database/schema.sql`
3. Execute o script

#### Passo 4: Configurar Secrets
```bash
fly secrets set SUPABASE_URL="https://xxxxx.supabase.co"
fly secrets set SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
fly secrets set SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 2. MERCADO PAGO (5 minutos)

#### Passo 1: Criar Aplicação
1. Acesse: https://www.mercadopago.com.br/developers
2. Clique em "Criar aplicação"
3. Nome: `Gol de Ouro`
4. Descrição: `Sistema de apostas esportivas`

#### Passo 2: Obter Credenciais
1. Vá em Credenciais
2. Copie:
   - **Access Token:** `APP_USR-xxxxx`
   - **Public Key:** `APP_USR-xxxxx`

#### Passo 3: Configurar Webhook
1. Vá em Webhooks
2. URL: `https://goldeouro-backend.fly.dev/api/payments/webhook`
3. Eventos: `payment`

#### Passo 4: Configurar Secrets
```bash
fly secrets set MERCADOPAGO_ACCESS_TOKEN="APP_USR-xxxxx"
fly secrets set MERCADOPAGO_PUBLIC_KEY="APP_USR-xxxxx"
```

### 3. DEPLOY E TESTE (5 minutos)

#### Deploy
```bash
fly deploy
```

#### Teste
```bash
# Health check
curl https://goldeouro-backend.fly.dev/health

# Login
curl -X POST https://goldeouro-backend.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@goldeouro.lol","password":"test123"}'

# PIX
curl -X POST https://goldeouro-backend.fly.dev/api/payments/pix/criar \
  -H "Content-Type: application/json" \
  -d '{"valor":50,"email_usuario":"test@goldeouro.lol","cpf_usuario":"12345678901"}'
```

---

## 🔍 VERIFICAÇÃO DE CONFIGURAÇÃO

### Script de Verificação
```bash
node scripts/configurar-credenciais-reais.js
```

### Resultados Esperados
```
✅ Supabase: Configurado e funcionando
✅ Mercado Pago: Configurado e funcionando
✅ Login: Banco real
✅ PIX: Real funcionando
✅ Chutes: Banco real
```

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### Supabase
- [ ] Projeto criado
- [ ] Schema executado
- [ ] Credenciais copiadas
- [ ] Secrets configurados
- [ ] Teste de conexão passou

### Mercado Pago
- [ ] Aplicação criada
- [ ] Credenciais copiadas
- [ ] Webhook configurado
- [ ] Secrets configurados
- [ ] Teste de API passou

### Deploy
- [ ] Deploy executado
- [ ] Health check OK
- [ ] Login funcionando
- [ ] PIX funcionando
- [ ] Sistema de chutes funcionando

---

## 🚨 TROUBLESHOOTING

### Problema: Supabase não conecta
**Solução:**
1. Verificar se URL está correta
2. Verificar se chaves não são placeholders
3. Verificar se schema foi executado
4. Verificar se RLS está configurado

### Problema: Mercado Pago não funciona
**Solução:**
1. Verificar se tokens são de produção
2. Verificar se webhook está configurado
3. Verificar se URL do webhook está correta
4. Verificar se eventos estão selecionados

### Problema: Deploy falha
**Solução:**
1. Verificar se secrets estão configurados
2. Verificar se Dockerfile está correto
3. Verificar logs: `fly logs`
4. Verificar status: `fly status`

---

## 📞 COMANDOS ÚTEIS

### Fly.io
```bash
# Status
fly status

# Logs
fly logs

# Secrets
fly secrets list

# Deploy
fly deploy

# SSH
fly ssh console
```

### Supabase
```bash
# Teste local
node -e "require('./database/supabase-config').testConnection()"

# Backup
node -e "require('./database/supabase-config').backupDatabase()"
```

### Mercado Pago
```bash
# Teste local
node scripts/test-mercadopago.js

# Verificar webhook
curl -X POST https://goldeouro-backend.fly.dev/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"123"}}'
```

---

## 🎯 RESULTADO FINAL

Após a configuração completa, o sistema terá:

### ✅ Funcionalidades Reais
- **Banco de Dados:** Supabase PostgreSQL
- **Pagamentos:** Mercado Pago PIX real
- **Autenticação:** JWT com Supabase Auth
- **Persistência:** Dados salvos no banco real
- **Webhooks:** Processamento automático

### ✅ Monitoramento
- **Health Check:** Status em tempo real
- **Logs:** Estruturados e detalhados
- **Métricas:** Performance e uso
- **Alertas:** Notificações de erro

### ✅ Segurança
- **HTTPS:** SSL em todos os endpoints
- **CORS:** Configurado corretamente
- **CSP:** Content Security Policy
- **RLS:** Row Level Security no Supabase

---

**🎉 Sistema 100% funcional com credenciais reais!**

**⏰ Tempo Total:** 15 minutos  
**🎯 Meta:** Sistema production-ready  
**📊 Status:** Pronto para usuários reais