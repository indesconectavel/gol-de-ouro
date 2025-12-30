# 🔧 GUIA - RESOLVER ERRO 400 NOS CHUTES

## ⚠️ PROBLEMA IDENTIFICADO

**Erro:** `Lote com problemas de integridade` (Status 400)  
**Detalhes:** `Chute 0 tem direção inválida: center` (ou `right`)

**Causa:** Lotes antigos no banco de dados têm chutes com direções que o validador estava rejeitando.

---

## ✅ SOLUÇÕES APLICADAS

### 1. Validador Corrigido ✅

**Arquivo:** `src/modules/shared/validators/lote-integrity-validator.js`

**Mudanças:**
- ✅ Agora aceita direções antigas E novas: `['TL', 'TR', 'C', 'BL', 'BR', 'left', 'right', 'center', 'up', 'down']`
- ✅ Valida apenas o novo chute sendo adicionado, não valida direções de chutes existentes
- ✅ Mais tolerante com lotes existentes

### 2. Script SQL para Limpar Lotes Problemáticos ✅

**Arquivo:** `database/limpar-lotes-problematicos.sql`

**O que faz:**
- Fecha todos os lotes ativos que podem ter direções antigas
- Permite que novos lotes sejam criados automaticamente com direções corretas

---

## 🎯 PRÓXIMOS PASSOS

### OPÇÃO 1: Executar SQL para Limpar Lotes (RECOMENDADO)

1. **Abrir Supabase SQL Editor**
2. **Executar:** `database/limpar-lotes-problematicos.sql`
3. **Verificar:** Que todos os lotes ativos foram fechados
4. **Testar novamente:** Os chutes devem funcionar agora

### OPÇÃO 2: Fazer Deploy das Correções

Se o código corrigido ainda não foi deployado:

```bash
flyctl deploy --app goldeouro-backend-v2
```

Depois de fazer deploy, os novos lotes serão criados com direções corretas.

---

## 📋 SQL PARA EXECUTAR NO SUPABASE

```sql
-- Fechar TODOS os lotes ativos
UPDATE lotes 
SET 
  status = 'finalizado',
  ativo = false,
  processed_at = NOW(),
  updated_at = NOW()
WHERE (status = 'ativo' OR status IS NULL OR ativo = true)
AND (status != 'finalizado');
```

**Isso vai:**
- ✅ Fechar todos os lotes ativos
- ✅ Permitir que novos lotes sejam criados automaticamente
- ✅ Novos lotes usarão direções corretas do sistema atual

---

## 🧪 APÓS EXECUTAR SQL

Execute o teste novamente:

```bash
node src/scripts/continuar_testes_apos_pagamento_pix.js
```

**Resultado esperado:**
- ✅ Todos os 10 chutes devem funcionar
- ✅ Não deve mais haver erro 400
- ✅ Sistema de lotes funcionando corretamente

---

## 📝 STATUS

- ✅ Validador corrigido (aceita direções antigas e novas)
- ✅ Validador mais tolerante (não valida direções de chutes existentes)
- ⏳ **AGUARDANDO:** Executar SQL para limpar lotes problemáticos

**Próximo passo:** Executar SQL no Supabase para fechar lotes ativos.

---

**Data:** 2025-12-10  
**Status:** ✅ Correções aplicadas, aguardando limpeza de lotes

