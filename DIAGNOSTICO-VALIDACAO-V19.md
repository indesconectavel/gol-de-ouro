# 🔍 DIAGNÓSTICO - VALIDAÇÃO ENGINE V19
## Data: 2025-12-05

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 1. ❌ Tabela system_heartbeat não existe

**Erro:** `Could not find the table 'public.system_heartbeat' in the schema cache`

**Causa:** Migration V19 não foi aplicada ainda no banco de dados

**Solução:** 
1. Acesse Supabase Dashboard → SQL Editor
2. Cole e execute o conteúdo de `prisma/migrations/20251205_v19_rls_indexes_migration.sql`
3. Aguarde confirmação de execução bem-sucedida

---

### 2. ❌ Coluna persisted_global_counter não existe

**Erro:** `column lotes.persisted_global_counter does not exist`

**Causa:** Migration V19 não foi aplicada (mesma causa do problema 1)

**Solução:** Aplicar migration V19 completa

---

### 3. ⚠️ Servidor não está rodando

**Erro:** `ECONNREFUSED` ao acessar `http://localhost:8080`

**Causa:** Servidor não foi iniciado ou falhou ao iniciar

**Solução:**
```bash
npm start
```

**Nota:** No Windows, pode ser necessário usar:
```powershell
node server-fly.js
```

---

## ✅ SOLUÇÃO AUTOMÁTICA

### Passo 1: Aplicar Migration V19

**INSTRUÇÕES CRÍTICAS:**

1. **Acesse:** https://supabase.com/dashboard/project/uatszaqzdqcwnfbipoxg/sql/new

2. **Abra o arquivo:** `prisma/migrations/20251205_v19_rls_indexes_migration.sql`

3. **Cole TODO o conteúdo** no SQL Editor do Supabase

4. **Clique em "Run"** para executar

5. **Aguarde confirmação** de execução bem-sucedida

### Passo 2: Iniciar Servidor

**Após aplicar a migration, execute:**

```bash
npm start
```

**OU no Windows PowerShell:**

```powershell
node server-fly.js
```

### Passo 3: Revalidar

**Após servidor iniciar, execute novamente:**

```bash
node src/scripts/validate_heartbeat_v19.js
node src/scripts/validate_monitor_endpoint.js
node src/scripts/validate_metrics_endpoint.js
node src/scripts/validate_engine_v19_final.js
```

---

## 📋 CHECKLIST DE CORREÇÃO

- [ ] Migration V19 aplicada no Supabase Dashboard
- [ ] Tabela system_heartbeat criada
- [ ] Coluna persisted_global_counter adicionada
- [ ] Servidor iniciado e rodando
- [ ] Heartbeat funcionando
- [ ] Endpoints /monitor e /metrics respondendo

---

## 🔄 PRÓXIMA EXECUÇÃO

Após corrigir os problemas acima, execute novamente:

```bash
node src/scripts/validate_engine_v19_final.js
```

---

**Gerado em:** 2025-12-05T20:57:00Z

