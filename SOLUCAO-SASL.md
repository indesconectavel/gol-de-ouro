# 🚨 SOLUÇÃO PARA PROBLEMA SASL - Supabase

## Problema Identificado
```
SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing
```

## 🔧 Solução Passo a Passo

### 1. Acessar Dashboard do Supabase
- Vá para [https://supabase.com](https://supabase.com)
- Faça login na sua conta
- Acesse o projeto `goldeouro-backend`

### 2. Obter Nova DATABASE_URL
- No menu lateral, clique em **Settings**
- Clique em **Database**
- Role para baixo até **Connection string**
- **IMPORTANTE**: Use a URL **SEM** `?pgbouncer=true`
- Copie a URL que começa com `postgresql://`

### 3. Atualizar Arquivo .env
```bash
# Substitua a linha DATABASE_URL no arquivo .env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### 4. Testar Conexão
```bash
node test-db.js
```

### 5. Se Ainda Houver Problema
Tente esta configuração alternativa no arquivo `.env`:
```bash
# Configuração alternativa para Supabase
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

## 🗄️ Configurar Banco de Dados

### 1. Executar Schema
```bash
# No dashboard do Supabase, vá em SQL Editor
# Cole e execute o conteúdo de database-schema.sql
```

### 2. Verificar Tabelas
```sql
-- Execute esta query para verificar se as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 3. Tabelas Esperadas
- `users`
- `games` 
- `bets`
- `queue_board`
- `shot_attempts`
- `transactions`

## 🧪 Testar Sistema

### 1. Backend
```bash
npm start
```

### 2. Admin (em outro terminal)
```bash
cd goldeouro-admin
npm run dev
```

### 3. Smoke Tests
```bash
.\scripts\smoke.local.ps1
```

## ✅ Verificações Finais

- [ ] Conexão com banco funcionando
- [ ] Tabelas criadas corretamente
- [ ] Backend rodando na porta 3000
- [ ] Admin rodando na porta 5173/5174
- [ ] Smoke tests passando
- [ ] API respondendo corretamente

## 🆘 Se Ainda Houver Problemas

1. **Verifique logs do Supabase**:
   - Settings > Database > Logs

2. **Teste conexão direta**:
   ```bash
   psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
   ```

3. **Verifique configurações de rede**:
   - Firewall bloqueando conexão
   - IP não autorizado no Supabase

4. **Contate suporte Supabase**:
   - Dashboard > Support

## 📞 Suporte

Se precisar de ajuda adicional:
- Abra uma issue no GitHub
- Documente o erro completo
- Inclua logs de erro
- Descreva os passos executados
