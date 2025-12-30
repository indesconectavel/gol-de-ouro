# 🔧 V16 SQL DEFINITIVO - LIMPAR LOTES PROBLEMÁTICOS
## Data: 2025-12-04
## CORRIGIDO: Tabela `chutes` e verificação de estrutura

## ⚠️ PROBLEMA IDENTIFICADO

1. Tabela correta: `chutes` (não `shots`)
2. Coluna pode ser `direction` ou `direcao` (dependendo do schema)
3. Valores podem variar entre schemas

## ✅ PASSO 1: Verificar estrutura da tabela

Execute primeiro para descobrir a estrutura real:

```sql
-- Verificar estrutura da tabela chutes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'chutes'
ORDER BY ordinal_position;
```

## ✅ PASSO 2: Verificar lotes ativos

```sql
-- Verificar lotes ativos e seus chutes
SELECT 
  l.id, 
  l.valor_aposta, 
  l.status, 
  COUNT(c.id) as chutes_count
FROM lotes l
LEFT JOIN chutes c ON c.lote_id = l.id
WHERE l.status = 'ativo'
GROUP BY l.id, l.valor_aposta, l.status
ORDER BY l.valor_aposta, l.id;
```

## ✅ PASSO 3: Verificar chutes problemáticos

### Se a coluna for `direction`:

```sql
-- Verificar chutes com direções inválidas (se coluna for 'direction')
SELECT 
  c.id,
  c.lote_id,
  c.direction,
  c.created_at,
  l.status as lote_status
FROM chutes c
JOIN lotes l ON l.id = c.lote_id
WHERE c.direction NOT IN ('TL', 'TR', 'C', 'BL', 'BR')
ORDER BY c.created_at DESC
LIMIT 50;
```

### Se a coluna for `direcao`:

```sql
-- Verificar chutes com direções inválidas (se coluna for 'direcao')
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

## ✅ PASSO 4: Fechar lotes problemáticos

### Opção A: Se coluna for `direction`:

```sql
-- Fechar lotes com chutes usando direções inválidas
UPDATE lotes 
SET status = 'finalizado', processed_at = now()
WHERE status = 'ativo' 
AND id IN (
  SELECT DISTINCT lote_id 
  FROM chutes 
  WHERE direction NOT IN ('TL', 'TR', 'C', 'BL', 'BR')
);
```

### Opção B: Se coluna for `direcao`:

```sql
-- Fechar lotes com chutes usando direções inválidas
UPDATE lotes 
SET status = 'finalizado', processed_at = now()
WHERE status = 'ativo' 
AND id IN (
  SELECT DISTINCT lote_id 
  FROM chutes 
  WHERE direcao NOT IN ('TL', 'TR', 'C', 'BL', 'BR')
);
```

## ✅ PASSO 5: Fechar TODOS os lotes ativos (mais seguro)

Se preferir fechar todos os lotes ativos para começar do zero:

```sql
-- Fechar todos os lotes ativos
UPDATE lotes 
SET status = 'finalizado', processed_at = now()
WHERE status = 'ativo';
```

## 🔍 VERIFICAÇÃO APÓS LIMPEZA

```sql
-- Verificar se ainda há lotes ativos
SELECT COUNT(*) as lotes_ativos_restantes
FROM lotes
WHERE status = 'ativo';
```

Se retornar `0`, todos os lotes foram fechados com sucesso!

## 📋 NOTAS IMPORTANTES

1. **Execute o PASSO 1 primeiro** para descobrir a estrutura real
2. **Execute o PASSO 2** para ver o que existe
3. **Execute o PASSO 3** (versão correta baseada no PASSO 1) para ver chutes problemáticos
4. **Execute o PASSO 4** (versão correta) ou **PASSO 5** para limpar
5. **Execute a verificação** para confirmar

## ⚠️ ALTERNATIVA: Limpar apenas lotes em memória

Se os lotes problemáticos estão apenas em memória (não no banco), você pode simplesmente reiniciar o backend:

```bash
flyctl restart --app goldeouro-backend-v2
```

Isso limpará todos os lotes em memória e criará novos lotes limpos.

