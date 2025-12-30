# 🔧 Guia: Corrigir Tabela transacoes

## 🚨 Problema Identificado

**Erro nos logs:**
```
❌ [SHOOT] Erro ao debitar saldo: column "referencia_id" of relation "transacoes" does not exist
```

**Causa:**
A RPC `rpc_deduct_balance` está tentando inserir `referencia_id` e `referencia_tipo` na tabela `transacoes`, mas essas colunas não existem. A tabela atual só tem a coluna `referencia` (VARCHAR).

## ✅ Solução

### 1. Executar Script SQL no Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute o script: `database/corrigir-tabela-transacoes.sql`

O script irá:
- ✅ Adicionar coluna `referencia_id` (INTEGER)
- ✅ Adicionar coluna `referencia_tipo` (VARCHAR(50))
- ✅ Atualizar constraint da coluna `tipo` para aceitar 'debito' e 'credito'
- ✅ Adicionar comentários nas colunas

### 2. Verificar Estrutura da Tabela

Após executar o script, verifique se as colunas foram adicionadas:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'transacoes'
ORDER BY ordinal_position;
```

**Colunas esperadas:**
- `id` (UUID ou SERIAL)
- `usuario_id` (UUID)
- `tipo` (VARCHAR) - deve aceitar 'debito' e 'credito'
- `valor` (DECIMAL)
- `saldo_anterior` (DECIMAL)
- `saldo_posterior` (DECIMAL)
- `descricao` (TEXT)
- `referencia` (VARCHAR) - coluna antiga (mantida para compatibilidade)
- `referencia_id` (INTEGER) - **NOVA COLUNA**
- `referencia_tipo` (VARCHAR(50)) - **NOVA COLUNA**
- `status` (VARCHAR)
- `metadata` (JSONB)
- `created_at` (TIMESTAMP)
- `processed_at` (TIMESTAMP)

### 3. Retestar Funcionalidades

Após aplicar a correção:

```bash
node src/scripts/testar_funcionalidades_principais.js
```

**Verificar:**
- ✅ Jogo deve debitar saldo corretamente
- ✅ Transações devem ser registradas no banco
- ✅ `referencia_id` e `referencia_tipo` devem ser preenchidos

## 📝 Arquivos Relacionados

- `database/corrigir-tabela-transacoes.sql` - Script SQL de correção
- `database/rpc-financial-acid.sql` - RPC functions que usam essas colunas
- `src/modules/financial/services/financial.service.js` - Service que chama as RPCs

## 🎯 Próximos Passos

1. ✅ Executar script SQL no Supabase
2. ⏳ Verificar estrutura da tabela
3. ⏳ Retestar funcionalidades principais
4. ⏳ Validar que débito de saldo está funcionando

---

**Data:** 2025-12-10 10:55 UTC  
**Status:** ⚠️ AGUARDANDO CORREÇÃO NO SUPABASE  
**Próximo passo:** Executar script SQL no Supabase

