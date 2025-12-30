# 🔒 GUIA - APLICAR CORREÇÕES DE SEGURANÇA V19
## Data: 2025-12-09
## Status: ✅ **PRONTO PARA APLICAÇÃO**

---

## 📋 RESUMO

Foram identificados **5 problemas de segurança** no Supabase através do Security Advisor. Este guia fornece instruções passo a passo para aplicar todas as correções.

---

## 🎯 PROBLEMAS IDENTIFICADOS

### 1. ❌ **RLS Disabled em system_heartbeat** (CRÍTICO)
### 2. ⚠️ **Function Search Path Mutable** (6 funções) (ALTO)
### 3. ℹ️ **RLS Enabled No Policy em AuditLog** (MÉDIO)
### 4. ℹ️ **RLS Enabled No Policy em fila_tabuleiro** (MÉDIO)
### 5. ℹ️ **Postgres Version tem Patches** (INFO)

---

## 📝 PASSO A PASSO PARA APLICAÇÃO

### **PASSO 1: Acessar Supabase SQL Editor**

1. Abra o navegador e acesse: **https://supabase.com/dashboard**
2. Faça login com sua conta
3. Selecione o projeto: **goldeouro-db**
4. No menu lateral esquerdo, clique em **"SQL Editor"**
5. Clique em **"New query"** para criar uma nova query

---

### **PASSO 2: Copiar e Executar SQL de Correções**

1. **Abrir arquivo de correções:**
   - No projeto, abra: `logs/v19/correcoes_seguranca_v19.sql`
   - Ou copie o conteúdo abaixo

2. **Copiar todo o conteúdo do SQL**

3. **Colar no SQL Editor do Supabase**

4. **Executar:**
   - Clique em **"Run"** ou pressione `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
   - Aguarde a execução completa

5. **Verificar resultado:**
   - Deve aparecer: "Success. No rows returned"
   - Ou mensagens de sucesso para cada comando

---

### **PASSO 3: Verificar Correções no Security Advisor**

1. **Acessar Security Advisor:**
   - No menu lateral, clique em **"Advisors"**
   - Selecione **"Security Advisor"**

2. **Reexecutar análise:**
   - Clique no botão **"Rerun linter"**
   - Aguarde a análise completa (pode levar alguns minutos)

3. **Verificar resultados:**
   - ✅ **Errors:** Deve estar em 0
   - ✅ **Warnings:** Deve estar em 0 (ou reduzido)
   - ℹ️ **Info:** Pode ainda mostrar info sobre Postgres version

---

## 📄 SQL DE CORREÇÕES

O SQL completo está disponível em: `logs/v19/correcoes_seguranca_v19.sql`

**Principais correções:**

1. **Habilitar RLS em system_heartbeat:**
```sql
ALTER TABLE IF EXISTS system_heartbeat ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access_system_heartbeat" ON system_heartbeat FOR ALL TO service_role USING (true) WITH CHECK (true);
```

2. **Corrigir search_path em funções:**
```sql
CREATE OR REPLACE FUNCTION rpc_update_lote_after_shot(...)
SET search_path = public
...
```

3. **Criar policies para AuditLog e fila_tabuleiro:**
```sql
CREATE POLICY "service_role_read_auditlog" ON "AuditLog" FOR SELECT TO service_role USING (true);
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após executar o SQL, verifique:

- [ ] SQL executado sem erros
- [ ] RLS habilitado em `system_heartbeat`
- [ ] Policies criadas para `system_heartbeat`
- [ ] Policies criadas para `AuditLog`
- [ ] Policies criadas para `fila_tabuleiro`
- [ ] Funções atualizadas com `SET search_path = public`
- [ ] Security Advisor reexecutado
- [ ] Errors: 0
- [ ] Warnings: 0 (ou reduzido)

---

## 🔍 VERIFICAÇÃO MANUAL

### Verificar RLS em system_heartbeat:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'system_heartbeat';
```

**Resultado esperado:** `rowsecurity = true`

### Verificar Policies:
```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('system_heartbeat', 'AuditLog', 'fila_tabuleiro');
```

**Resultado esperado:** Policies listadas

### Verificar search_path em funções:
```sql
SELECT proname, prosecdef, proconfig 
FROM pg_proc 
WHERE proname IN (
  'rpc_update_lote_after_shot',
  'rpc_get_or_create_lote',
  'fn_update_heartbeat'
);
```

**Resultado esperado:** `proconfig` contém `search_path=public`

---

## ⚠️ PROBLEMAS COMUNS

### Problema 1: "permission denied"
**Solução:** Certifique-se de estar usando a conta de administrador do projeto

### Problema 2: "function does not exist"
**Solução:** A função pode não existir ainda. O SQL usa `CREATE OR REPLACE`, então criará se não existir

### Problema 3: "table does not exist"
**Solução:** Verifique se as tabelas existem. O SQL usa `IF EXISTS` para evitar erros

---

## 📊 RESULTADO ESPERADO

Após aplicar todas as correções:

- ✅ **Security Advisor:** 0 Errors, 0 Warnings
- ✅ **RLS:** Habilitado em todas as tabelas críticas
- ✅ **Policies:** Criadas para todas as tabelas
- ✅ **Funções:** Todas com `search_path` fixo
- ✅ **Sistema:** Seguro e pronto para produção

---

## 🎯 PRÓXIMOS PASSOS

Após aplicar as correções:

1. ✅ Validar Migration V19
2. ✅ Executar testes automatizados
3. ✅ Validar endpoints
4. ✅ Monitorar Security Advisor regularmente

---

**Guia criado em:** 2025-12-09  
**Versão:** V19.0.0  
**Status:** ✅ **PRONTO PARA APLICAÇÃO**

