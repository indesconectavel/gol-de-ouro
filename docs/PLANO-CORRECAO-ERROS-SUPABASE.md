# 🔧 PLANO DE CORREÇÃO - ERROS SUPABASE

## 🎯 PRIORIDADE CRÍTICA

### **1. Prevenir Pausa do Supabase** 🔴

**Status:** ⚠️ **CRÍTICO**

**Problema:**
- Projeto `goldeouro-db` identificado como inativo há mais de 7 dias
- Será pausado automaticamente se inatividade continuar
- Após 90 dias pausado, não pode ser des-pausado (apenas download de dados)

**Solução Imediata:**
1. Executar queries no banco para gerar atividade
2. Executar script: `scripts/prevenir-pausa-supabase.sql`
3. Fazer conexões ativas ao banco

**Solução Permanente:**
- Fazer upgrade para Pro (não pausa automaticamente)
- Ou manter atividade diária no banco

**Ação:** ⏳ **EXECUTAR IMEDIATAMENTE**

---

## 🎯 PRIORIDADE MÉDIA

### **2. Corrigir Search Path nas Funções** 🟡

**Status:** ⚠️ **MÉDIO**

**Funções Afetadas:**
- `public.update_global_metrics`
- `public.update_user_stats`

**Solução:**
1. Executar script: `database/corrigir-search-path-funcoes-restantes.sql`
2. Validar no Security Advisor

**Ação:** ⏳ **EXECUTAR APÓS PREVENIR PAUSA**

---

## 🎯 PRIORIDADE BAIXA

### **3. Verificar RLS na Tabela AuditLog** 🟢

**Status:** ℹ️ **INFO**

**Problema:**
- RLS habilitado mas sem políticas
- Tabela pode estar bloqueada

**Solução:**
1. Executar script: `database/verificar-auditlog-rls.sql`
2. Verificar se tabela está sendo usada
3. Criar políticas ou desabilitar RLS conforme necessário

**Ação:** ⏳ **EXECUTAR APÓS CORREÇÕES CRÍTICAS**

---

## 📋 ORDEM DE EXECUÇÃO

1. ✅ **CRÍTICO:** Prevenir pausa do Supabase
   - Executar `scripts/prevenir-pausa-supabase.sql`
   - Fazer atividade no banco

2. ⏳ **MÉDIO:** Corrigir search_path
   - Executar `database/corrigir-search-path-funcoes-restantes.sql`
   - Validar no Security Advisor

3. ⏳ **BAIXO:** Verificar AuditLog
   - Executar `database/verificar-auditlog-rls.sql`
   - Decidir se cria políticas ou desabilita RLS

---

## 🚀 EXECUTAR AGORA

### **Passo 1: Prevenir Pausa (CRÍTICO)**

No Supabase SQL Editor, executar:
```sql
-- Gerar atividade no banco
SELECT COUNT(*) FROM usuarios;
SELECT COUNT(*) FROM transacoes;
SELECT COUNT(*) FROM pagamentos_pix WHERE status = 'pending';
```

OU executar o script completo:
- `scripts/prevenir-pausa-supabase.sql`

---

### **Passo 2: Corrigir Search Path**

No Supabase SQL Editor, executar:
- `database/corrigir-search-path-funcoes-restantes.sql`

---

### **Passo 3: Verificar AuditLog**

No Supabase SQL Editor, executar:
- `database/verificar-auditlog-rls.sql`

---

## ✅ VALIDAÇÃO

Após executar correções:

1. Verificar Security Advisor:
   - Deve mostrar 0 warnings de search_path
   - Verificar se AuditLog está resolvido

2. Verificar atividade do projeto:
   - Supabase não deve mais avisar sobre pausa
   - Ou fazer upgrade para Pro

---

**Status:** ⚠️ **AÇÕES CRÍTICAS IDENTIFICADAS - EXECUTAR IMEDIATAMENTE**

