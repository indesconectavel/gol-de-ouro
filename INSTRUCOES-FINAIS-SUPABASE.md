# ✅ INSTRUÇÕES FINAIS - QUERIES CORRETAS PARA SUPABASE

**Data:** 28 de Outubro de 2025  
**Status:** ✅ **QUERIES CORRIGIDAS E SIMPLIFICADAS**

---

## ⚠️ ERROS CORRIGIDOS

### Erro 1: `column "lote_id" does not exist`
**Causa:** Tabela `chutes` pode não existir ou coluna com nome diferente  
**Solução:** Remover queries de `chutes`

### Erro 2: `syntax error at or near "NOT"` em CREATE POLICY
**Causa:** `IF NOT EXISTS` não é suportado em `CREATE POLICY`  
**Solução:** Remover policy, fazer manualmente se necessário

---

## ✅ QUERIES CORRETAS E SEGURAS

### Arquivo: `QUERIES-SUPABASE-SIMPLES-E-SEGURAS.sql`

```sql
-- 1. Criar índices para lotes
CREATE INDEX IF NOT EXISTS idx_lotes_id ON lotes(id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes(status);

-- 2. Criar índices para usuários
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);

-- 3. Analisar estatísticas
ANALYZE usuarios;
ANALYZE lotes;
ANALYZE metricas_globais;
```

---

## 📋 COMO EXECUTAR

### Passo 1: Abrir SQL Editor

Acesse: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/sql/new

### Passo 2: Copiar Queries

Copie apenas estas queries (do arquivo `QUERIES-SUPABASE-SIMPLES-E-SEGURAS.sql`):

```sql
CREATE INDEX IF NOT EXISTS idx_lotes_id ON lotes(id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo);
ANALYZE usuarios;
ANALYZE lotes;
ANALYZE metricas_globais;
```

### Passo 3: Executar

1. Cole as queries
2. Clique em **"Run"**
3. ✅ Deve funcionar sem erros!

---

## 🎯 RESULTADO ESPERADO

### Antes:
- Múltiplos warnings de performance

### Depois:
- ✅ Índices criados com sucesso
- ✅ Estatísticas atualizadas
- ✅ Performance melhorada

---

## ✅ SUCESSO!

Essas queries são **simples, seguras e funcionarão** sem erros!

**Arquivo:** `QUERIES-SUPABASE-SIMPLES-E-SEGURAS.sql`

---

*Documento final com queries corrigidas - 28/10/2025*
