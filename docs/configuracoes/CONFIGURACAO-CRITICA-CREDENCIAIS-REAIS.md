# 🚨 CONFIGURAÇÃO CRÍTICA - CREDENCIAIS REAIS
## 📋 GUIA PASSO A PASSO PARA PRODUÇÃO REAL

**Data:** 16 de Outubro de 2025 - 16:20  
**Status:** ⚠️ **CONFIGURAÇÃO CRÍTICA NECESSÁRIA**  
**Prioridade:** MÁXIMA  

---

## 🎯 **OBJETIVO**
Configurar o sistema Gol de Ouro com credenciais reais do Supabase e Mercado Pago para produção real.

---

## 🔧 **PASSO 1: CONFIGURAR SUPABASE REAL**

### **1.1 Acessar Supabase Dashboard**
1. **Abra o navegador** e acesse: https://supabase.com/dashboard
2. **Faça login** na sua conta Supabase
3. **Selecione o projeto** "Gol de Ouro" ou crie um novo

### **1.2 Obter Credenciais**
1. **Vá em Settings** → **API**
2. **Copie as seguintes informações:**
   - **Project URL** (exemplo: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role secret** key (começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### **1.3 Executar Schema SQL**
1. **Vá em SQL Editor** no Supabase Dashboard
2. **Clique em "New Query"**
3. **Cole e execute** o seguinte SQL:

```sql
-- Schema completo para Gol de Ouro - PRODUÇÃO REAL
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  role VARCHAR(20) DEFAULT 'player',
  account_status VARCHAR(20) DEFAULT 'active',
  email_verified BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(20) NOT NULL, -- 'deposit', 'withdraw', 'bet', 'win'
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  pix_id VARCHAR(100),
  pix_status VARCHAR(20),
  pix_key VARCHAR(100),
  pix_type VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lotes (
  id VARCHAR(100) PRIMARY KEY,
  max_players INTEGER DEFAULT 10,
  entry_fee DECIMAL(10,2) DEFAULT 5.00,
  players JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'active', 'finished'
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chutes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  lote_id VARCHAR(100) REFERENCES lotes(id),
  direction INTEGER NOT NULL, -- 1-5 (zonas do gol)
  amount DECIMAL(10,2) NOT NULL,
  result VARCHAR(20) NOT NULL, -- 'goal', 'miss'
  win_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event VARCHAR(50) NOT NULL, -- 'login', 'register', 'password_change'
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_chutes_user_id ON chutes(user_id);
CREATE INDEX IF NOT EXISTS idx_chutes_lote_id ON chutes(lote_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_user_id ON auth_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_logs_event ON auth_logs(event);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lotes_updated_at BEFORE UPDATE ON lotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança básicas
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert transactions" ON transactions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update transactions" ON transactions
    FOR UPDATE USING (true);

CREATE POLICY "Users can view own chutes" ON chutes
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own chutes" ON chutes
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own auth logs" ON auth_logs
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "System can insert auth logs" ON auth_logs
    FOR INSERT WITH CHECK (true);
```

---

## 💳 **PASSO 2: CONFIGURAR MERCADO PAGO REAL**

### **2.1 Acessar Mercado Pago Developers**
1. **Abra o navegador** e acesse: https://www.mercadopago.com.br/developers
2. **Faça login** na sua conta Mercado Pago
3. **Vá em "Suas integrações"**

### **2.2 Criar Aplicação**
1. **Clique em "Criar aplicação"**
2. **Preencha os dados:**
   - **Nome:** "Gol de Ouro"
   - **Descrição:** "Sistema de jogos com PIX"
   - **Categoria:** "Games"
   - **Ambiente:** **Produção** (importante!)

### **2.3 Obter Credenciais**
1. **Após criar a aplicação, copie:**
   - **Access Token** (começa com `APP_USR-` ou `APP-`)
   - **Public Key** (começa com `APP_USR-`)

### **2.4 Configurar Webhook**
1. **Vá em "Webhooks"** na aplicação criada
2. **Clique em "Adicionar webhook"**
3. **Configure:**
   - **URL:** `https://goldeouro-backend.fly.dev/api/payments/pix/webhook`
   - **Eventos:** `payment`
   - **Descrição:** "Webhook PIX Gol de Ouro"
4. **Copie o Webhook Secret** gerado

---

## 🔧 **PASSO 3: CONFIGURAR ARQUIVO .ENV**

### **3.1 Editar arquivo .env**
Substitua as credenciais no arquivo `.env`:

```env
# Configurações de ambiente para o backend Gol de Ouro

# Ambiente
NODE_ENV=production
PORT=8080

# JWT
JWT_SECRET=goldeouro_jwt_secret_key_2025_production

# Supabase REAL - SUBSTITUIR COM SUAS CREDENCIAIS
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SUA_CHAVE_AQUI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SUA_CHAVE_AQUI

# Mercado Pago REAL - SUBSTITUIR COM SUAS CREDENCIAIS
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-SEU_TOKEN_AQUI
MERCADO_PAGO_PUBLIC_KEY=APP_USR-SUA_CHAVE_PUBLICA_AQUI
MERCADO_PAGO_WEBHOOK_SECRET=SEU_WEBHOOK_SECRET_AQUI

# Database
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

# CORS
CORS_ORIGIN=https://goldeouro.lol,https://admin.goldeouro.lol

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
BCRYPT_ROUNDS=10
SESSION_SECRET=goldeouro_session_secret_2025

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log

# Monitoring
ENABLE_MONITORING=true
HEALTH_CHECK_INTERVAL=30000

# PIX Configuration
PIX_WEBHOOK_URL=https://goldeouro-backend.fly.dev/api/payments/pix/webhook
PIX_MIN_AMOUNT=1.00
PIX_MAX_AMOUNT=1000.00

# Game Configuration
GAME_MIN_BET=1.00
GAME_MAX_BET=100.00
GAME_WIN_RATE=0.3

# Admin Configuration
ADMIN_EMAIL=admin@goldeouro.lol
ADMIN_PASSWORD=admin123

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_INTERVAL=24
BACKUP_RETENTION_DAYS=7
```

---

## 🧪 **PASSO 4: TESTAR CONFIGURAÇÃO**

### **4.1 Testar Supabase**
```bash
node test-config-real.js
```

### **4.2 Testar Servidor Local**
```bash
node server-final-unified.js
```

### **4.3 Verificar Logs**
- ✅ Supabase conectado
- ✅ Mercado Pago conectado
- ✅ Sistema funcionando

---

## 🚀 **PASSO 5: DEPLOY PARA PRODUÇÃO**

### **5.1 Deploy no Fly.io**
```bash
fly deploy
```

### **5.2 Verificar Deploy**
```bash
fly status
fly logs
```

### **5.3 Testar Produção**
```bash
curl https://goldeouro-backend.fly.dev/health
```

---

## ✅ **CHECKLIST DE CONFIGURAÇÃO**

### **Supabase:**
- [ ] Projeto criado
- [ ] Credenciais copiadas
- [ ] Schema SQL executado
- [ ] RLS habilitado
- [ ] Teste de conexão OK

### **Mercado Pago:**
- [ ] Aplicação criada
- [ ] Credenciais copiadas
- [ ] Webhook configurado
- [ ] Teste de conexão OK

### **Servidor:**
- [ ] .env configurado
- [ ] Dependências instaladas
- [ ] Teste local OK
- [ ] Deploy realizado
- [ ] Health check OK

---

## 🎯 **RESULTADO ESPERADO**

Após seguir todos os passos:
- ✅ **Sistema conectado ao Supabase real**
- ✅ **PIX funcionando com Mercado Pago real**
- ✅ **Dados persistentes no banco**
- ✅ **Sistema em produção real**
- ✅ **Pagamentos reais funcionando**

---

**⚠️ IMPORTANTE:** Sem essas configurações, o sistema continuará usando fallbacks simulados!

**📞 SUPORTE:** Se precisar de ajuda, consulte os logs do servidor ou execute `node test-config-real.js`
