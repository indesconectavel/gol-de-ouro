# 🔧 V16 SQL FINAL CORRIGIDO - LIMPAR LOTES
## Data: 2025-12-04
## CORRIGIDO: Estrutura real das tabelas

## ⚠️ PROBLEMAS IDENTIFICADOS

1. ❌ Coluna `processed_at` não existe na tabela `lotes`
2. ❌ Coluna `lote_id` pode não existir na tabela `chutes` (ou tabela não existe)

## ✅ SOLUÇÃO SIMPLES (RECOMENDADA)

### Opção 1: Fechar todos os lotes ativos (SEM colunas extras)

```sql
-- Fechar todos os lotes ativos
UPDATE lotes 
SET status = 'finalizado', updated_at = now()
WHERE status = 'ativo';
```

### Opção 2: Verificar estrutura primeiro

```sql
-- Verificar estrutura da tabela lotes
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'lotes'
ORDER BY ordinal_position;
```

### Opção 3: Verificar se tabela chutes existe

```sql
-- Verificar se tabela chutes existe
SELECT table_name 
FROM information_schema.tables
WHERE table_schema = 'public' 
AND table_name IN ('chutes', 'shots');
```

### Opção 4: Verificar lotes ativos (simples)

```sql
-- Verificar lotes ativos
SELECT id, valor_aposta, status, created_at
FROM lotes
WHERE status = 'ativo';
```

### Opção 5: Verificar após fechar

```sql
-- Verificar se ainda há lotes ativos
SELECT COUNT(*) as lotes_ativos_restantes
FROM lotes
WHERE status = 'ativo';
```

## 📋 ESTRUTURA REAL (Baseada no Schema)

### Tabela `lotes`:
- `id` VARCHAR(100) PRIMARY KEY
- `valor_aposta` DECIMAL(10,2)
- `tamanho` INTEGER
- `posicao_atual` INTEGER
- `indice_vencedor` INTEGER
- `status` VARCHAR(20) - valores: 'ativo', 'finalizado', 'pausado'
- `total_arrecadado` DECIMAL(10,2)
- `premio_total` DECIMAL(10,2)
- `created_at` TIMESTAMP WITH TIME ZONE
- `updated_at` TIMESTAMP WITH TIME ZONE
- ❌ **NÃO TEM:** `processed_at`

### Tabela `chutes`:
- `id` SERIAL PRIMARY KEY
- `lote_id` VARCHAR(100) - **deveria existir**
- `usuario_id` UUID
- `direction` VARCHAR(20) - valores: 'left', 'center', 'right' (no schema consolidado)
- `amount` DECIMAL(10,2)
- `result` VARCHAR(20)
- `timestamp` TIMESTAMP WITH TIME ZONE

## ✅ RECOMENDAÇÃO FINAL

**Execute este SQL simples:**

```sql
-- Fechar todos os lotes ativos
UPDATE lotes 
SET status = 'finalizado', updated_at = now()
WHERE status = 'ativo';
```

**Depois verifique:**

```sql
SELECT COUNT(*) FROM lotes WHERE status = 'ativo';
```

Se retornar `0`, todos os lotes foram fechados com sucesso!

## 🔄 ALTERNATIVA: Reiniciar Backend

Se os lotes estão apenas em memória (não no banco), você pode simplesmente reiniciar:

```bash
flyctl restart --app goldeouro-backend-v2
```

Isso limpará todos os lotes em memória.

