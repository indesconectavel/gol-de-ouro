# **🔧 INSTRUÇÕES - CONFIGURAÇÃO SUPABASE**

## **📋 PROBLEMA**
As credenciais atuais do Supabase estão inválidas, causando o sistema a rodar em modo fallback (dados fictícios).

## **🚀 SOLUÇÃO - CONFIGURAR NOVO PROJETO SUPABASE**

### **1. Criar Novo Projeto Supabase**

1. **Acesse:** https://supabase.com/dashboard
2. **Faça login** com sua conta
3. **Clique em "New Project"**
4. **Configure:**
   - **Name:** `goldeouro-prod`
   - **Database Password:** `GolDeOuro2025!` (anote esta senha)
   - **Region:** `South America (São Paulo)`
5. **Clique em "Create new project"**

### **2. Obter Credenciais**

Após criar o projeto:

1. **Vá para Settings > API**
2. **Copie as seguintes informações:**
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **3. Atualizar Credenciais no Fly.io**

```bash
# Substitua pelos valores reais do seu projeto
flyctl secrets set SUPABASE_URL="https://seu-projeto.supabase.co" --app goldeouro-backend-v2
flyctl secrets set SUPABASE_ANON_KEY="sua-chave-anonima-real" --app goldeouro-backend-v2
flyctl secrets set SUPABASE_SERVICE_KEY="sua-chave-de-servico-real" --app goldeouro-backend-v2
```

### **4. Configurar Banco de Dados**

1. **Acesse:** SQL Editor no Supabase
2. **Execute o seguinte SQL:**

```sql
-- Criar tabela de usuários
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  balance DECIMAL(10,2) DEFAULT 0.00,
  account_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de jogos
CREATE TABLE games (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  direction VARCHAR(50) NOT NULL,
  is_goal BOOLEAN DEFAULT FALSE,
  prize DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de transações
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'deposit', 'withdrawal', 'game_win', 'game_loss'
  amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  external_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_games_user_id ON games(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
```

### **5. Configurar Row Level Security (RLS)**

```sql
-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas para jogos
CREATE POLICY "Users can view own games" ON games
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own games" ON games
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Políticas para transações
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
```

### **6. Fazer Deploy e Testar**

```bash
# Fazer deploy com as novas credenciais
flyctl deploy --app goldeouro-backend-v2

# Verificar logs
flyctl logs --app goldeouro-backend-v2 --no-tail | Select-Object -Last 10

# Testar health check
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -UseBasicParsing
```

### **7. Verificar Funcionamento**

Após o deploy, verifique se:
- ✅ Health check retorna `"database":"connected"`
- ✅ Logs mostram `"✅ Supabase conectado"`
- ✅ Sistema não usa mais dados fictícios

## **🎯 RESULTADO ESPERADO**

Após seguir estas instruções:
1. ✅ Backend conectará com Supabase real
2. ✅ Dados de usuários serão persistidos
3. ✅ PIX funcionará corretamente
4. ✅ Jogo será acessível após login
5. ✅ Dados fictícios serão substituídos por dados reais

## **📞 SUPORTE**

Se encontrar problemas:
1. Verifique se as credenciais estão corretas
2. Confirme se o projeto Supabase está ativo
3. Verifique os logs do backend
4. Teste a conexão manualmente

**Status:** 🟡 **AGUARDANDO CONFIGURAÇÃO** - Siga as instruções acima para completar a configuração
