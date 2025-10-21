# 🚀 SCRIPT DE CONFIGURAÇÃO AUTOMÁTICA - GOL DE OURO v1.1.1

## 📋 CONFIGURAÇÃO RÁPIDA DAS CREDENCIAIS

### 🔧 PASSO 1: CONFIGURAR SUPABASE

```bash
# 1. Acesse: https://supabase.com/dashboard
# 2. Crie um novo projeto
# 3. Execute o SQL do arquivo: database/schema-completo.sql
# 4. Copie suas credenciais:
```

**Substitua estas variáveis pelas suas credenciais reais:**

```bash
SUPABASE_URL="https://seu-projeto-id.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 💳 PASSO 2: CONFIGURAR MERCADO PAGO

```bash
# 1. Acesse: https://www.mercadopago.com.br/developers
# 2. Crie uma aplicação
# 3. Copie suas credenciais:
```

**Substitua estas variáveis pelas suas credenciais reais:**

```bash
MERCADOPAGO_ACCESS_TOKEN="APP_USR-1234567890abcdef..."
MERCADOPAGO_PUBLIC_KEY="APP_USR-1234567890abcdef..."
```

### 🚀 PASSO 3: CONFIGURAR NO FLY.IO

```bash
# Configure as variáveis de ambiente no Fly.io
fly secrets set SUPABASE_URL="https://seu-projeto-id.supabase.co"
fly secrets set SUPABASE_ANON_KEY="sua-chave-anonima"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role"
fly secrets set MERCADOPAGO_ACCESS_TOKEN="seu-access-token"
fly secrets set MERCADOPAGO_PUBLIC_KEY="sua-chave-publica"

# Faça o deploy
fly deploy

# Teste o sistema
curl https://goldeouro-backend.fly.dev/health
```

### 🧪 PASSO 4: TESTES DE VALIDAÇÃO

```bash
# Teste 1: Health check
curl https://goldeouro-backend.fly.dev/health

# Teste 2: Status do lote
curl https://goldeouro-backend.fly.dev/api/game/status-lote

# Teste 3: Chute (deve salvar no banco)
curl -X POST https://goldeouro-backend.fly.dev/api/game/chutar \
  -H "Content-Type: application/json" \
  -d '{"zona":"center","potencia":50,"angulo":0,"valor_aposta":10}'

# Teste 4: Criar pagamento PIX (deve criar no Mercado Pago)
curl -X POST https://goldeouro-backend.fly.dev/api/payments/pix/criar \
  -H "Content-Type: application/json" \
  -d '{"valor":10,"descricao":"Teste PIX"}'

# Teste 5: Login (deve funcionar com banco real)
curl -X POST https://goldeouro-backend.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@goldeouro.lol","password":"test123"}'
```

### ✅ VERIFICAÇÃO FINAL

Após configurar as credenciais, verifique se:

1. **✅ Supabase conectado** - Tabelas criadas e funcionando
2. **✅ Mercado Pago integrado** - PIX funcionando
3. **✅ Sistema de lotes** - Chutes salvando no banco
4. **✅ Autenticação real** - Login com banco de dados
5. **✅ Webhook PIX** - Pagamentos confirmando automaticamente

### 🎯 CREDENCIAIS DE TESTE

**Usuário Admin:**
- Email: `admin@goldeouro.lol`
- Senha: `admin123`

**Usuário Player:**
- Email: `test@goldeouro.lol`
- Senha: `test123`

### 🔍 MONITORAMENTO

```bash
# Ver logs do Fly.io
fly logs

# Ver status da aplicação
fly status

# Ver variáveis de ambiente
fly secrets list
```

### 🆘 SOLUÇÃO DE PROBLEMAS

**Erro de conexão Supabase:**
- Verifique se as URLs e chaves estão corretas
- Confirme se o projeto está ativo no Supabase

**Erro Mercado Pago:**
- Verifique se o Access Token está correto
- Confirme se a aplicação está ativa

**Erro de deploy:**
- Verifique se todas as variáveis foram configuradas
- Confirme se o Dockerfile está correto

---

**🎮 GOL DE OURO v1.1.1 - SISTEMA REAL CONFIGURADO!**
