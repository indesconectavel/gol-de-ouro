# 🕒 GUIA ALTERNATIVO: Configurar Scheduler (Cron Job)

## ⚠️ PROBLEMA

Não conseguiu encontrar "Create a new schedule" no Supabase Dashboard.

## ✅ SOLUÇÃO: Usar SQL Direto

O Supabase permite criar cron jobs diretamente via SQL usando a extensão `pg_cron`.

---

## 🎯 MÉTODO 1: Executar Função RPC Diretamente (MAIS SIMPLES)

### **Vantagens:**
- ✅ Mais simples
- ✅ Não precisa da Edge Function
- ✅ Executa direto no banco de dados
- ✅ Mais rápido

### **Como fazer:**

1. **Abrir Supabase SQL Editor**
   - Acesse: https://supabase.com/dashboard
   - Clique em "SQL Editor"

2. **Copiar e Executar Script**
   - Abra o arquivo: `database/criar-scheduler-via-sql.sql`
   - Copie a parte que diz "ALTERNATIVA MAIS SIMPLES" (linhas 60-75)
   - Ou copie este código:

```sql
-- Habilitar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remover job anterior (se existir)
SELECT cron.unschedule('expire-stale-pix-job-direct');

-- Criar job que executa a função RPC diretamente
SELECT cron.schedule(
  'expire-stale-pix-job-direct',    -- Nome do job
  '*/5 * * * *',                    -- Cron: a cada 5 minutos
  $$SELECT public.expire_stale_pix();$$  -- Executa função RPC diretamente
);

-- Verificar se o job foi criado
SELECT * FROM cron.job WHERE jobname = 'expire-stale-pix-job-direct';
```

3. **Executar**
   - Cole no SQL Editor
   - Clique em "Run"
   - Deve mostrar que o job foi criado

4. **Verificar**
   - Execute esta query para ver todos os jobs:
   ```sql
   SELECT * FROM cron.job;
   ```
   - Você deve ver `expire-stale-pix-job-direct` na lista

### ✅ **Pronto!**
O cron job está configurado e executará a função `expire_stale_pix()` a cada 5 minutos.

---

## 🎯 MÉTODO 2: Via Supabase Dashboard (Se Disponível)

### **Onde procurar:**

1. **Database → Extensions**
   - Verifique se `pg_cron` está habilitada
   - Se não estiver, habilite

2. **Database → Scheduler** (pode estar em locais diferentes)
   - Procure por "Scheduler", "Cron Jobs", "Scheduled Tasks"
   - Pode estar em "Database" → "Scheduler"
   - Ou em "Settings" → "Scheduler"

3. **Via Supabase CLI** (se tiver instalado)
   ```bash
   supabase db schedule create expire-stale-pix \
     --cron "*/5 * * * *" \
     --function expire-stale-pix
   ```

---

## 🎯 MÉTODO 3: Usar Edge Function + HTTP (Mais Complexo)

Se você quiser usar a Edge Function que já criou:

1. **Criar função que chama Edge Function via HTTP**
   - Use o script completo em `database/criar-scheduler-via-sql.sql`
   - Requer extensão `pg_net` habilitada

2. **Configurar variáveis de ambiente**
   - No Supabase Dashboard → Settings → API
   - Copie o "URL" e "service_role key"
   - Use no script SQL

---

## ✅ RECOMENDAÇÃO

**Use o MÉTODO 1** (executar função RPC diretamente):
- ✅ Mais simples
- ✅ Não precisa de Edge Function
- ✅ Funciona direto no banco
- ✅ Mais rápido e confiável

---

## 🧪 TESTAR SE ESTÁ FUNCIONANDO

1. **Verificar jobs criados:**
   ```sql
   SELECT * FROM cron.job;
   ```

2. **Ver histórico de execuções:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'expire-stale-pix-job-direct')
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

3. **Aguardar 5 minutos**
   - Aguarde até 5 minutos
   - Execute a query acima novamente
   - Deve mostrar execuções do job

4. **Verificar pagamentos expirados:**
   ```sql
   SELECT COUNT(*) as total_expired
   FROM pagamentos_pix
   WHERE status = 'expired'
   AND updated_at > NOW() - INTERVAL '10 minutes';
   ```

---

## 🆘 TROUBLESHOOTING

### **Erro: "extension pg_cron does not exist"**
- **Solução:** O Supabase pode não ter `pg_cron` habilitado
- **Alternativa:** Use o backend para executar a função periodicamente (já implementado no `server-fly.js`)

### **Erro: "permission denied"**
- **Solução:** Verifique se está usando a role `postgres` ou `service_role`

### **Job não executa**
- **Solução:** Verifique se `pg_cron` está habilitado nas extensões
- **Alternativa:** Use o backend que já tem validação no boot e reconciliação periódica

---

## 📋 RESUMO

**Opção Recomendada:**
1. Execute o script SQL do MÉTODO 1
2. Verifique se o job foi criado
3. Aguarde 5 minutos e verifique se está executando

**Se não funcionar:**
- O backend já tem validação no boot e reconciliação periódica
- Isso já expira pagamentos stale automaticamente
- O cron job é apenas uma camada extra de segurança

---

**Boa sorte! 🚀**

