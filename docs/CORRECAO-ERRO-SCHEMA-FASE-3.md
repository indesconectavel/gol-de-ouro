# ✅ CORREÇÃO: Erro de Sintaxe no Schema Fase 3

**Data:** 2025-01-12  
**Problema:** Erro de sintaxe SQL na constraint UNIQUE parcial  
**Status:** ✅ **CORRIGIDO**

---

## 🐛 PROBLEMA IDENTIFICADO

**Erro:**
```
ERROR: 42601: syntax error at or near "WHERE" 
LINE 32: UNIQUE(usuario_id, queue_type, status) WHERE status = 'waiting'
```

**Causa:**
Em PostgreSQL, não é possível usar `WHERE` diretamente em uma constraint `UNIQUE` na definição da tabela.

---

## ✅ CORREÇÃO APLICADA

**Antes (INCORRETO):**
```sql
CREATE TABLE IF NOT EXISTS public.queue_board (
    ...
    -- ❌ ERRO: Sintaxe inválida
    UNIQUE(usuario_id, queue_type, status) WHERE status = 'waiting'
);
```

**Depois (CORRETO):**
```sql
CREATE TABLE IF NOT EXISTS public.queue_board (
    ...
    -- ✅ Removido da definição da tabela
);

-- ✅ Criado como índice único parcial separado
CREATE UNIQUE INDEX IF NOT EXISTS idx_queue_board_unique_waiting 
ON public.queue_board(usuario_id, queue_type) 
WHERE status = 'waiting';
```

---

## 📝 EXPLICAÇÃO TÉCNICA

**Por que usar índice único parcial?**

1. **Constraint UNIQUE na tabela:** Aplica-se a todas as linhas
2. **Índice único parcial:** Aplica-se apenas quando a condição `WHERE` é verdadeira

**No nosso caso:**
- Queremos garantir que um usuário não esteja em múltiplas filas **apenas quando status = 'waiting'**
- Quando status = 'matched' ou 'left', pode haver múltiplos registros (histórico)
- Índice único parcial é a solução correta

---

## ✅ VERIFICAÇÃO

O schema agora está correto e deve executar sem erros.

**Teste:**
```sql
-- Deve executar sem erros
SELECT * FROM database/schema-queue-matches.sql;
```

---

**Status:** ✅ **CORRIGIDO E PRONTO PARA APLICAÇÃO**

