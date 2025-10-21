# 🔧 GUIA DE CONFIGURAÇÃO REAL - GOL DE OURO v2.0

## 📋 **CONFIGURAÇÃO OBRIGATÓRIA PARA PRODUÇÃO REAL**

**Data:** 16 de Outubro de 2025  
**Status:** ⚠️ **CONFIGURAÇÃO NECESSÁRIA**  
**Versão:** v2.0-real  

---

## 🚨 **AÇÕES CRÍTICAS NECESSÁRIAS**

### **1. CONFIGURAR SUPABASE REAL**

#### **Passo 1: Acessar Supabase Dashboard**
1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto "Gol de Ouro" ou crie um novo

#### **Passo 2: Obter Credenciais**
1. Vá em **Settings** → **API**
2. Copie as seguintes informações:
   - **Project URL** (SUPABASE_URL)
   - **Service Role Key** (SUPABASE_SERVICE_ROLE_KEY)
   - **Anon Key** (SUPABASE_ANON_KEY)

#### **Passo 3: Configurar .env**
```env
# Supabase REAL
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **2. CONFIGURAR MERCADO PAGO REAL**

#### **Passo 1: Acessar Mercado Pago Developers**
1. Acesse: https://www.mercadopago.com.br/developers
2. Faça login na sua conta
3. Vá em **Suas integrações**

#### **Passo 2: Criar Aplicação**
1. Clique em **Criar aplicação**
2. Nome: "Gol de Ouro"
3. Descrição: "Sistema de jogos com PIX"
4. Selecione **Produção**

#### **Passo 3: Obter Credenciais**
1. Copie as seguintes informações:
   - **Access Token** (MERCADO_PAGO_ACCESS_TOKEN)
   - **Public Key** (MERCADO_PAGO_PUBLIC_KEY)

#### **Passo 4: Configurar Webhook**
1. Vá em **Webhooks**
2. URL: `https://goldeouro-backend.fly.dev/api/payments/pix/webhook`
3. Eventos: `payment`
4. Copie o **Webhook Secret**

#### **Passo 5: Configurar .env**
```env
# Mercado Pago REAL
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-1234567890...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-1234567890...
MERCADO_PAGO_WEBHOOK_SECRET=1234567890abcdef...
```

---

## 🗄️ **CONFIGURAÇÃO DO BANCO DE DADOS**

### **Executar Schema no Supabase**

#### **Passo 1: Acessar SQL Editor**
1. No Supabase Dashboard
2. Vá em **SQL Editor**
3. Clique em **New Query**

#### **Passo 2: Executar Schema**
Copie e execute o seguinte SQL:

```sql
-- Schema completo para Gol de Ouro
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
```

---

## 🔒 **CONFIGURAÇÃO DE SEGURANÇA**

### **Row Level Security (RLS)**

Execute o seguinte SQL para habilitar RLS:

```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
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

## 🧪 **TESTE DE CONFIGURAÇÃO**

### **Script de Teste**

Crie um arquivo `test-config.js`:

```javascript
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testConfig() {
  console.log('🧪 Testando configuração...');
  
  // Teste Supabase
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Supabase:', error.message);
    } else {
      console.log('✅ Supabase: Conectado');
    }
  } catch (error) {
    console.error('❌ Supabase:', error.message);
  }
  
  // Teste Mercado Pago
  try {
    const axios = require('axios');
    const response = await axios.get(
      'https://api.mercadopago.com/v1/payment_methods',
      {
        headers: {
          'Authorization': `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`
        }
      }
    );
    
    console.log('✅ Mercado Pago: Conectado');
  } catch (error) {
    console.error('❌ Mercado Pago:', error.message);
  }
}

testConfig();
```

---

## 🚀 **DEPLOY PARA PRODUÇÃO**

### **Passo 1: Testar Localmente**
```bash
# Instalar dependências
npm install

# Testar configuração
node test-config.js

# Testar servidor
node server-final-unified.js
```

### **Passo 2: Deploy no Fly.io**
```bash
# Fazer login no Fly.io
fly auth login

# Deploy
fly deploy
```

### **Passo 3: Verificar Deploy**
```bash
# Verificar status
fly status

# Ver logs
fly logs

# Testar health check
curl https://goldeouro-backend.fly.dev/health
```

---

## 📊 **CHECKLIST DE CONFIGURAÇÃO**

### **✅ Supabase**
- [ ] Projeto criado
- [ ] Credenciais copiadas
- [ ] Schema executado
- [ ] RLS habilitado
- [ ] Teste de conexão OK

### **✅ Mercado Pago**
- [ ] Aplicação criada
- [ ] Credenciais copiadas
- [ ] Webhook configurado
- [ ] Teste de conexão OK

### **✅ Servidor**
- [ ] .env configurado
- [ ] Dependências instaladas
- [ ] Teste local OK
- [ ] Deploy realizado
- [ ] Health check OK

---

## 🎯 **PRÓXIMOS PASSOS**

1. **Configurar credenciais** seguindo este guia
2. **Executar schema** no Supabase
3. **Testar configuração** localmente
4. **Fazer deploy** para produção
5. **Realizar auditoria** completa

---

**⚠️ IMPORTANTE:** Sem essas configurações, o sistema continuará usando fallbacks simulados!
