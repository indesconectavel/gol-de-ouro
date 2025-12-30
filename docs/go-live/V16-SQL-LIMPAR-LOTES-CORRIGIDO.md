# 🔧 V16 SQL CORRIGIDO - LIMPAR LOTES PROBLEMÁTICOS
## Data: 2025-12-04
## CORRIGIDO: Tabela correta é `chutes`, não `shots`

## ⚠️ PROBLEMA IDENTIFICADO

O SQL anterior usava `shots`, mas a tabela correta é `chutes`.

## ✅ SQL CORRIGIDO

### Opção 1: Verificar lotes problemáticos primeiro

```sql
-- Verificar lotes ativos e seus chutes
SELECT 
  l.id, 
  l.valor_aposta, 
  l.status, 
  COUNT(c.id) as chutes_count,
  STRING_AGG(DISTINCT c.direcao, ', ') as direcoes
FROM lotes l
LEFT JOIN chutes c ON c.lote_id = l.id
WHERE l.status = 'ativo'
GROUP BY l.id, l.valor_aposta, l.status
ORDER BY l.valor_aposta, l.id;
```

### Opção 2: Verificar chutes com direções inválidas

```sql
-- Verificar chutes com direções inválidas
SELECT 
  c.id,
  c.lote_id,
  c.direcao,
  c.created_at,
  l.status as lote_status
FROM chutes c
JOIN lotes l ON l.id = c.lote_id
WHERE c.direcao NOT IN ('TL', 'TR', 'C', 'BL', 'BR')
ORDER BY c.created_at DESC
LIMIT 50;
```

### Opção 3: Fechar lotes problemáticos (CORRIGIDO)

```sql
-- Fechar lotes que têm chutes com direções inválidas
UPDATE lotes 
SET status = 'finalizado', processed_at = now()
WHERE status = 'ativo' 
AND id IN (
  SELECT DISTINCT lote_id 
  FROM chutes 
  WHERE direcao NOT IN ('TL', 'TR', 'C', 'BL', 'BR')
);
```

### Opção 4: Fechar TODOS os lotes ativos (mais seguro)

Se preferir fechar todos os lotes ativos para começar do zero:

```sql
-- Fechar todos os lotes ativos
UPDATE lotes 
SET status = 'finalizado', processed_at = now()
WHERE status = 'ativo';
```

### Opção 5: Verificar estrutura da tabela chutes

Se ainda houver problemas, verifique a estrutura:

```sql
-- Verificar estrutura da tabela chutes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chutes'
ORDER BY ordinal_position;
```

## 📋 NOTAS IMPORTANTES

1. **Tabela correta:** `chutes` (não `shots`)
2. **Coluna de direção:** `direcao` (pode variar dependendo do schema)
3. **Valores válidos:** `'TL'`, `'TR'`, `'C'`, `'BL'`, `'BR'`
4. **Status do lote:** `'ativo'` ou `'finalizado'`

## ✅ RECOMENDAÇÃO

1. Execute a **Opção 1** primeiro para ver o que existe
2. Execute a **Opção 2** para ver chutes problemáticos
3. Execute a **Opção 3** para fechar apenas lotes problemáticos
   - OU execute a **Opção 4** para fechar todos os lotes ativos

## 🔍 VERIFICAÇÃO APÓS LIMPEZA

```sql
-- Verificar se ainda há lotes ativos problemáticos
SELECT COUNT(*) as lotes_ativos_problematicos
FROM lotes l
WHERE l.status = 'ativo'
AND EXISTS (
  SELECT 1 FROM chutes c 
  WHERE c.lote_id = l.id 
  AND c.direcao NOT IN ('TL', 'TR', 'C', 'BL', 'BR')
);
```

Se retornar `0`, os lotes problemáticos foram limpos com sucesso!

