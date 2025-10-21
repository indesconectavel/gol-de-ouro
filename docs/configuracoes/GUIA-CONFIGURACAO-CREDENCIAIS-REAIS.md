# 🔐 CONFIGURAÇÃO DE CREDENCIAIS REAIS - GOL DE OURO v1.1.1

## 📋 INSTRUÇÕES PARA CONFIGURAR CREDENCIAIS REAIS

### 🗄️ SUPABASE - CONFIGURAÇÃO DO BANCO DE DADOS

1. **Acesse:** https://supabase.com/dashboard
2. **Crie um novo projeto** ou use um existente
3. **Copie as credenciais:**

```bash
# Substitua estas URLs pelas suas credenciais reais:
SUPABASE_URL=https://seu-projeto-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 💳 MERCADO PAGO - CONFIGURAÇÃO DO PIX

1. **Acesse:** https://www.mercadopago.com.br/developers
2. **Crie uma aplicação** ou use uma existente
3. **Copie as credenciais:**

```bash
# Substitua estas chaves pelas suas credenciais reais:
MERCADOPAGO_ACCESS_TOKEN=APP_USR-1234567890abcdef...
MERCADOPAGO_PUBLIC_KEY=APP_USR-1234567890abcdef...
```

### 🔧 COMO APLICAR AS CREDENCIAIS

#### Opção 1: Variáveis de Ambiente Locais
```bash
# No arquivo .env (criar se não existir)
SUPABASE_URL=https://seu-projeto-id.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
MERCADOPAGO_ACCESS_TOKEN=seu-access-token
MERCADOPAGO_PUBLIC_KEY=sua-chave-publica
```

#### Opção 2: Variáveis de Ambiente no Fly.io
```bash
# Configure no Fly.io
fly secrets set SUPABASE_URL="https://seu-projeto-id.supabase.co"
fly secrets set SUPABASE_ANON_KEY="sua-chave-anonima"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-role"
fly secrets set MERCADOPAGO_ACCESS_TOKEN="seu-access-token"
fly secrets set MERCADOPAGO_PUBLIC_KEY="sua-chave-publica"
```

### 📊 ESTRUTURA DO BANCO DE DADOS SUPABASE

Execute este SQL no Supabase para criar as tabelas necessárias:

```sql
-- Tabela de usuários
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  username VARCHAR(100) NOT NULL,
  saldo DECIMAL(10,2) DEFAULT 0.00,
  role VARCHAR(20) DEFAULT 'player',
  account_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de chutes
CREATE TABLE chutes (
  id SERIAL PRIMARY KEY,
  lote_id VARCHAR(100) NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id),
  zona VARCHAR(20) NOT NULL,
  potencia INTEGER NOT NULL,
  angulo INTEGER NOT NULL,
  valor_aposta DECIMAL(10,2) NOT NULL,
  resultado VARCHAR(20),
  gol_marcado BOOLEAN DEFAULT FALSE,
  premio DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de pagamentos PIX
CREATE TABLE pagamentos_pix (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  qr_code TEXT,
  qr_code_base64 TEXT,
  pix_copy_paste TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de transações
CREATE TABLE transacoes (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  tipo VARCHAR(20) NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  saldo_anterior DECIMAL(10,2) NOT NULL,
  saldo_posterior DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  referencia VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pendente',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_chutes_usuario ON chutes(usuario_id);
CREATE INDEX idx_chutes_lote ON chutes(lote_id);
CREATE INDEX idx_pagamentos_usuario ON pagamentos_pix(usuario_id);
CREATE INDEX idx_transacoes_usuario ON transacoes(usuario_id);
```

### 🚀 DEPLOY COM CREDENCIAIS REAIS

Após configurar as credenciais:

```bash
# 1. Configure as variáveis de ambiente no Fly.io
fly secrets set SUPABASE_URL="sua-url-real"
fly secrets set SUPABASE_ANON_KEY="sua-chave-real"
fly secrets set SUPABASE_SERVICE_ROLE_KEY="sua-chave-service-real"
fly secrets set MERCADOPAGO_ACCESS_TOKEN="seu-token-real"
fly secrets set MERCADOPAGO_PUBLIC_KEY="sua-chave-publica-real"

# 2. Faça o deploy
fly deploy

# 3. Teste o sistema
curl https://goldeouro-backend.fly.dev/health
```

### ✅ VERIFICAÇÃO DO SISTEMA

Após configurar as credenciais, o sistema deve:

1. **✅ Conectar ao Supabase** - Salvar chutes e transações
2. **✅ Processar PIX real** - Criar pagamentos no Mercado Pago
3. **✅ Webhook funcionando** - Confirmar pagamentos automaticamente
4. **✅ Saldo atualizado** - Creditar saldo após pagamento aprovado

### 🔍 TESTES DE VALIDAÇÃO

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
```

### 🎯 PRÓXIMOS PASSOS

1. **Configure as credenciais** seguindo as instruções acima
2. **Execute o SQL** no Supabase para criar as tabelas
3. **Configure as variáveis** no Fly.io
4. **Faça o deploy** com as credenciais reais
5. **Teste o sistema** completo

### 📞 SUPORTE

Se precisar de ajuda:
- **Supabase:** https://supabase.com/docs
- **Mercado Pago:** https://www.mercadopago.com.br/developers
- **Fly.io:** https://fly.io/docs

---

**🎮 GOL DE OURO v1.1.1 - SISTEMA REAL ATIVADO!**
