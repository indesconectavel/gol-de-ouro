# ✅ CHECKLIST: Implementação de Expiração de PIX

## 📋 ORDEM DE EXECUÇÃO

### **FASE 1: Banco de Dados** (15 minutos)

#### **1.1 Corrigir Constraint de Status** ⏳

**Arquivo:** `database/corrigir-constraint-status-expired.sql`

**Ação:**
1. Abrir Supabase Dashboard → SQL Editor
2. Copiar conteúdo do arquivo
3. Executar script
4. Verificar resultado:
   ```sql
   SELECT con.conname, pg_get_constraintdef(con.oid)
   FROM pg_constraint con
   JOIN pg_class rel ON rel.oid = con.conrelid
   WHERE rel.relname = 'pagamentos_pix' AND con.conname LIKE '%status%';
   ```

**Validação:**
- ✅ Constraint deve incluir `'expired'` na lista de valores permitidos
- ✅ Query de verificação deve retornar constraint atualizada

---

#### **1.2 Criar Função RPC** ⏳

**Arquivo:** `database/rpc-expire-stale-pix.sql`

**Ação:**
1. Abrir Supabase Dashboard → SQL Editor
2. Copiar conteúdo do arquivo
3. Executar script
4. Verificar função criada:
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'expire_stale_pix';
   ```

**Validação:**
- ✅ Função `expire_stale_pix()` deve existir
- ✅ Função deve ter `SECURITY DEFINER`
- ✅ Função deve retornar JSON

**Teste Manual:**
```sql
SELECT * FROM expire_stale_pix();
```

---

#### **1.3 Verificar RLS Policies** ⏳

**Arquivo:** `database/rls-policy-expired-pix.sql`

**Ação:**
1. Abrir Supabase Dashboard → SQL Editor
2. Copiar conteúdo do arquivo
3. Executar script
4. Verificar políticas existentes

**Validação:**
- ✅ Função usa `SECURITY DEFINER` → bypassa RLS automaticamente
- ✅ Nenhuma política adicional necessária

---

### **FASE 2: Edge Function** (20 minutos)

#### **2.1 Criar Edge Function** ⏳

**Arquivo:** `supabase/functions/expire-stale-pix/index.ts`

**Ação:**
1. Abrir Supabase Dashboard → Edge Functions
2. Clicar em "Create a new function"
3. Nome: `expire-stale-pix`
4. Copiar conteúdo de `supabase/functions/expire-stale-pix/index.ts`
5. Salvar função

**Alternativa (CLI):**
```bash
cd supabase/functions/expire-stale-pix
supabase functions deploy expire-stale-pix
```

**Validação:**
- ✅ Função criada no Dashboard
- ✅ Código TypeScript copiado corretamente
- ✅ Variáveis de ambiente configuradas (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

---

#### **2.2 Testar Edge Function Manualmente** ⏳

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

### **FASE 3: Scheduler** (10 minutos)

#### **3.1 Configurar Scheduler** ⏳

**Arquivo:** `supabase/.github/workflows/scheduler.json`

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

#### **3.2 Aguardar Primeira Execução** ⏳

**Ação:**
1. Aguardar até 5 minutos após criação do scheduler
2. Verificar logs do scheduler
3. Verificar execução da Edge Function

**Validação:**
- ✅ Scheduler executa automaticamente
- ✅ Logs mostram execução bem-sucedida
- ✅ Pagamentos stale são marcados como expired

---

### **FASE 4: Backend** (10 minutos)

#### **4.1 Verificar Alterações** ✅

**Arquivos Modificados:**
- ✅ `controllers/adminController.js` - Método `fixExpiredPix()` adicionado
- ✅ `routes/adminRoutes.js` - Rotas `/admin/fix-expired-pix` adicionadas
- ✅ `server-fly.js` - Validação no boot adicionada

**Validação:**
- ✅ Código modificado corretamente
- ✅ Sem erros de sintaxe

---

#### **4.2 Fazer Deploy** ⏳

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

### **FASE 5: Validação Completa** (30 minutos)

#### **5.1 Testar Constraint** ⏳

**Ação:**
```sql
-- Deve funcionar sem erro
UPDATE pagamentos_pix 
SET status = 'expired' 
WHERE id = (SELECT id FROM pagamentos_pix LIMIT 1);
```

**Validação:**
- ✅ UPDATE executa sem erro
- ✅ Status é atualizado para `'expired'`

---

#### **5.2 Testar Função RPC** ⏳

**Ação:**
```sql
SELECT * FROM expire_stale_pix();
```

**Validação:**
- ✅ Função retorna JSON
- ✅ JSON contém `success: true`
- ✅ JSON contém `expired_count`

---

#### **5.3 Testar Edge Function** ⏳

**Ação:**
1. Executar via Dashboard
2. Verificar logs
3. Verificar resultado

**Validação:**
- ✅ Função executa sem erros
- ✅ Logs mostram execução bem-sucedida
- ✅ Pagamentos stale são marcados como expired

---

#### **5.4 Testar Endpoint Admin** ⏳

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

#### **5.5 Verificar Validação no Boot** ⏳

**Ação:**
1. Verificar logs do servidor ao iniciar
2. Procurar por: `[BOOT] Validando pagamentos PIX stale...`

**Validação:**
- ✅ Logs mostram validação no boot
- ✅ Pagamentos stale são marcados como expired no boot

---

#### **5.6 Verificar Execução do Cron Job** ⏳

**Ação:**
1. Aguardar 5 minutos após configuração do scheduler
2. Verificar logs do scheduler
3. Verificar pagamentos expirados

**Validação:**
- ✅ Scheduler executa automaticamente
- ✅ Logs mostram execução bem-sucedida
- ✅ Pagamentos stale são marcados como expired

---

## 📊 RESUMO DE VALIDAÇÃO

### **Checklist Final:**

- [ ] Constraint corrigida (permite `'expired'`)
- [ ] Função RPC criada e funcionando
- [ ] Edge Function criada e funcionando
- [ ] Scheduler configurado e executando
- [ ] Endpoint admin funcionando
- [ ] Validação no boot funcionando
- [ ] Cron job executando automaticamente

---

## 🎯 CRITÉRIOS DE SUCESSO

### **Técnico:**
- ✅ Todos os scripts SQL executados sem erros
- ✅ Função RPC retorna JSON válido
- ✅ Edge Function executa sem erros
- ✅ Scheduler executa automaticamente
- ✅ Endpoint admin retorna 200 OK
- ✅ Validação no boot funciona

### **Funcional:**
- ✅ Pagamentos pending > 24h são marcados como expired
- ✅ Pagamentos com `expires_at` passado são marcados como expired
- ✅ Cron job executa a cada 5 minutos
- ✅ Admin pode forçar expiração manualmente
- ✅ Sistema expira stale no boot

---

## 📄 DOCUMENTAÇÃO

- `docs/AUDITORIA-COMPLETA-EXPIRACAO-PIX.md` - Auditoria completa
- `docs/CHECKLIST-IMPLEMENTACAO-EXPIRACAO-PIX.md` - Este arquivo

---

**Status:** ⏳ **AGUARDANDO EXECUÇÃO DOS SCRIPTS SQL**

**Próxima Ação:** Executar Fase 1 (Banco de Dados)

