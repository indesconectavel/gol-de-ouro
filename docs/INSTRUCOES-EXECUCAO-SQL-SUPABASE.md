# 📋 INSTRUÇÕES: Execução de Scripts SQL no Supabase

## ⚠️ IMPORTANTE

**Por que não posso executar SQL diretamente:**
- Não tenho acesso direto ao banco de dados Supabase
- Preciso que você execute os scripts manualmente no SQL Editor
- Os scripts foram criados e estão prontos para execução

---

## 📊 STATUS ATUAL (Baseado nas Imagens)

### ✅ **CONCLUÍDO:**
- ✅ Constraint corrigida (14 pagamentos expired, 4 approved)
- ✅ Função `expire_stale_pix()` já existe no banco

### ⚠️ **PROBLEMA IDENTIFICADO:**
- ⚠️ Erro ao tentar recriar função: `cannot change return type of existing function`
- ⚠️ Solução: Usar script corrigido com `DROP FUNCTION` primeiro

---

## 🎯 PRÓXIMOS PASSOS (ORDEM DE EXECUÇÃO)

### **PASSO 1: Recriar Função RPC** ⏳

**Arquivo:** `database/rpc-expire-stale-pix-CORRIGIDO.sql`

**Ação:**
1. Abrir Supabase SQL Editor
2. Abrir nova query ou usar query existente
3. Copiar **TODO** o conteúdo de `database/rpc-expire-stale-pix-CORRIGIDO.sql`
4. Executar (Run ou CTRL+Enter)
5. Verificar resultado:
   - Deve mostrar função criada na query de verificação final
   - Não deve haver erros

**Validação:**
```sql
-- Executar esta query para verificar:
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'expire_stale_pix';
```

**Resultado Esperado:**
- `function_name`: `expire_stale_pix`
- `arguments`: (vazio)
- `return_type`: `json`

---

### **PASSO 2: Testar Função RPC Manualmente** ⏳

**Ação:**
1. No Supabase SQL Editor
2. Executar:
   ```sql
   SELECT * FROM expire_stale_pix();
   ```

**Validação:**
- ✅ Deve retornar JSON com `success: true`
- ✅ Deve conter `expired_count` e `pending_before`
- ✅ Não deve haver erros

**Exemplo de Resposta Esperada:**
```json
{
  "success": true,
  "expired_count": 0,
  "pending_before": 0,
  "timestamp": "2025-11-24T13:40:00.000Z",
  "message": "Expirou 0 pagamentos PIX stale"
}
```

---

### **PASSO 3: Criar Edge Function** ⏳

**Arquivo:** `supabase/functions/expire-stale-pix/index.ts`

**Ação:**
1. Abrir Supabase Dashboard → Edge Functions
2. Clicar em "Create a new function"
3. Nome: `expire-stale-pix`
4. Copiar **TODO** o conteúdo de `supabase/functions/expire-stale-pix/index.ts`
5. Salvar função

**Alternativa (CLI):**
```bash
cd supabase/functions/expire-stale-pix
supabase functions deploy expire-stale-pix
```

**Validação:**
- ✅ Função criada no Dashboard
- ✅ Código TypeScript copiado corretamente
- ✅ Variáveis de ambiente já configuradas (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

---

### **PASSO 4: Testar Edge Function Manualmente** ⏳

**Ação:**
1. No Supabase Dashboard → Edge Functions → `expire-stale-pix`
2. Clicar em "Invoke function"
3. Verificar logs
4. Verificar resultado

**Validação:**
- ✅ Função executa sem erros
- ✅ Logs mostram execução bem-sucedida
- ✅ Retorna JSON com `success: true` e `expired_count`

---

### **PASSO 5: Configurar Scheduler** ⏳

**Opção A: Via Dashboard**
1. Abrir Supabase Dashboard → Database → Scheduler
2. Clicar em "Create a new schedule"
3. Configurar:
   - **Name:** `expire-stale-pix`
   - **Cron:** `*/5 * * * *` (a cada 5 minutos)
   - **Function:** `expire-stale-pix`
   - **Verify JWT:** `false`
4. Salvar

**Opção B: Via CLI**
```bash
supabase db schedule create expire-stale-pix \
  --cron "*/5 * * * *" \
  --function expire-stale-pix
```

**Validação:**
- ✅ Scheduler criado no Dashboard
- ✅ Cron configurado: `*/5 * * * *`
- ✅ Function: `expire-stale-pix`
- ✅ Verify JWT: `false`

---

### **PASSO 6: Fazer Deploy do Backend** ⏳

**Ação:**
```bash
flyctl deploy -a goldeouro-backend-v2
```

**Validação:**
- ✅ Deploy executado com sucesso
- ✅ Servidor inicia sem erros
- ✅ Logs mostram validação no boot:
  ```
  ✅ [BOOT] X pagamentos PIX stale foram marcados como expired no boot
  ```

---

### **PASSO 7: Testar Endpoint Admin** ⏳

**Ação:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/admin/fix-expired-pix \
  -H "x-admin-token: goldeouro123" \
  -H "Content-Type: application/json"
```

**Validação:**
- ✅ Endpoint retorna 200 OK
- ✅ Resposta contém `expired_count`
- ✅ Pagamentos stale são marcados como expired

---

## 📋 CHECKLIST RESUMIDO

- [ ] **PASSO 1:** Executar `database/rpc-expire-stale-pix-CORRIGIDO.sql`
- [ ] **PASSO 2:** Testar função RPC: `SELECT * FROM expire_stale_pix();`
- [ ] **PASSO 3:** Criar Edge Function `expire-stale-pix` no Dashboard
- [ ] **PASSO 4:** Testar Edge Function manualmente
- [ ] **PASSO 5:** Configurar Scheduler (cron: `*/5 * * * *`)
- [ ] **PASSO 6:** Deploy backend: `flyctl deploy -a goldeouro-backend-v2`
- [ ] **PASSO 7:** Testar endpoint admin: `POST /admin/fix-expired-pix`

---

## 🚨 SOLUÇÃO PARA O ERRO ATUAL

**Erro:** `cannot change return type of existing function`

**Causa:** Função `expire_stale_pix()` já existe com tipo de retorno diferente

**Solução:** Usar script corrigido `database/rpc-expire-stale-pix-CORRIGIDO.sql` que faz `DROP FUNCTION` primeiro

---

## 📄 ARQUIVOS NECESSÁRIOS

1. **`database/rpc-expire-stale-pix-CORRIGIDO.sql`** - Script SQL corrigido
2. **`supabase/functions/expire-stale-pix/index.ts`** - Edge Function
3. **`docs/INSTRUCOES-EXECUCAO-SQL-SUPABASE.md`** - Este arquivo

---

**Status:** ⏳ **AGUARDANDO EXECUÇÃO MANUAL NO SUPABASE SQL EDITOR**

**Próxima Ação:** Executar PASSO 1 (recriar função RPC com script corrigido)

