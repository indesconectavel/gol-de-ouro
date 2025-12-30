# 🔧 CORREÇÕES DOS SCRIPTS SUPABASE

## 📋 ERROS IDENTIFICADOS NOS PRINTS

### **1. Script `prevenir-pausa-supabase.sql`** ❌

**Erro:**
```
ERROR: 42703: column "tablename" does not exist
LINE 12: tablename,
```

**Causa:** A tabela `pg_stat_user_tables` usa `relname` em vez de `tablename`.

**Correção:** ✅ **CORRIGIDO**
- Alterado `tablename` para `relname as tablename`

---

### **2. Script `corrigir-search-path-funcoes-restantes.sql`** ❌

**Erro:**
```
ERROR: 42883: function public.update_global_metrics() does not exist
```

**Causa:** As funções `update_global_metrics()` e `update_user_stats()` não existem no banco.

**Correção:** ✅ **CORRIGIDO**
- Adicionada verificação de existência antes de alterar
- Usa `DO $$ ... END $$` para verificar e corrigir apenas funções existentes
- Adiciona mensagens informativas

---

### **3. Script `verificar-auditlog-rls.sql`** ❌

**Erro:**
```
ERROR: 42P01: relation "AuditLog" does not exist
```

**Causa:** A tabela `AuditLog` não existe no banco.

**Correção:** ✅ **CORRIGIDO**
- Adicionada verificação de existência da tabela
- Lista todas as tabelas com "audit" no nome
- Lista todas as tabelas com RLS habilitado mas sem políticas
- Usa `DO $$ ... END $$` para verificação segura

---

## ✅ SCRIPTS CORRIGIDOS

### **1. `scripts/prevenir-pausa-supabase.sql`**
- ✅ Corrigido `tablename` → `relname as tablename`
- ✅ Script funcional para gerar atividade no banco

### **2. `database/corrigir-search-path-funcoes-restantes.sql`**
- ✅ Adicionada verificação de existência das funções
- ✅ Usa `DO $$ ... END $$` para correção condicional
- ✅ Não falha se funções não existirem

### **3. `database/verificar-auditlog-rls.sql`**
- ✅ Adicionada verificação de existência da tabela
- ✅ Lista tabelas similares
- ✅ Lista tabelas com RLS sem políticas

### **4. `database/verificar-funcoes-existentes.sql`** (NOVO)
- ✅ Script para verificar quais funções realmente existem
- ✅ Lista funções sem search_path definido
- ✅ Útil para diagnóstico antes de corrigir

---

## 🚀 EXECUÇÃO CORRIGIDA

### **Passo 1: Verificar Funções Existentes**

```sql
-- Executar primeiro para ver quais funções existem
-- database/verificar-funcoes-existentes.sql
```

### **Passo 2: Prevenir Pausa do Supabase**

```sql
-- Executar para gerar atividade no banco
-- scripts/prevenir-pausa-supabase.sql
```

**Status:** ✅ **CORRIGIDO - PODE EXECUTAR**

### **Passo 3: Corrigir Search Path**

```sql
-- Executar para corrigir search_path nas funções existentes
-- database/corrigir-search-path-funcoes-restantes.sql
```

**Status:** ✅ **CORRIGIDO - NÃO FALHA SE FUNÇÕES NÃO EXISTIREM**

### **Passo 4: Verificar AuditLog**

```sql
-- Executar para verificar RLS na tabela AuditLog (se existir)
-- database/verificar-auditlog-rls.sql
```

**Status:** ✅ **CORRIGIDO - VERIFICA EXISTÊNCIA ANTES DE ACESSAR**

---

## 📊 ANÁLISE DOS ERROS

### **Por que as funções não existem?**

1. **`update_global_metrics()` e `update_user_stats()`:**
   - Podem ter sido removidas em refatorações anteriores
   - Podem nunca ter existido (warning do Security Advisor pode ser falso positivo)
   - Podem estar em outro schema

### **Por que a tabela AuditLog não existe?**

1. **Tabela nunca foi criada:**
   - O Security Advisor pode estar mostrando warning de uma tabela que nunca existiu
   - Ou foi removida em refatorações anteriores

2. **Nome diferente:**
   - Pode estar com nome diferente (ex: `audit_log`, `audit_logs`)
   - Script corrigido lista todas as tabelas com "audit" no nome

---

## ✅ PRÓXIMOS PASSOS

1. ✅ **Executar `verificar-funcoes-existentes.sql`** para diagnóstico
2. ✅ **Executar `prevenir-pausa-supabase.sql`** para gerar atividade
3. ✅ **Executar `corrigir-search-path-funcoes-restantes.sql`** (não falhará se funções não existirem)
4. ✅ **Executar `verificar-auditlog-rls.sql`** para verificar RLS

---

**Status:** ✅ **TODOS OS SCRIPTS CORRIGIDOS E PRONTOS PARA EXECUÇÃO**

