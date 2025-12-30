# 🔒 V16 SQL DEFINITIVO CORRIGIDO - AJUSTE DE SALDO
## Data: 2025-12-04
## CORRIGIDO: Problema com constraint `transacoes_tipo_check`

## ⚠️ PROBLEMA IDENTIFICADO

O erro `transacoes_tipo_check` indica que o valor `'credito'` não está na lista de valores permitidos para o campo `tipo`.

## 🔍 PASSO 1: VERIFICAR VALORES PERMITIDOS (Execute primeiro)

```sql
-- Verificar valores de tipo existentes na tabela
SELECT DISTINCT tipo FROM transacoes LIMIT 10;

-- Verificar constraint exata
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%transacoes%tipo%';
```

## ✅ SQL DEFINITIVO CORRIGIDO

Execute este SQL após verificar os valores permitidos:

```sql
BEGIN;

-- Pegar saldo atual e atualizar
WITH u AS (
  SELECT id, saldo 
  FROM usuarios 
  WHERE email = 'test_v16_diag_1764865077736@example.com' 
  FOR UPDATE
)
UPDATE usuarios
SET saldo = (u.saldo + 50.00)
FROM u
WHERE usuarios.id = u.id;

-- Inserir transação
-- IMPORTANTE: Substitua 'deposito' pelo valor correto encontrado no PASSO 1
-- Valores possíveis: 'deposito', 'deposit', 'credito', 'credit', etc.
INSERT INTO transacoes(
  id, usuario_id, tipo, valor,
  saldo_anterior, saldo_posterior,
  descricao, created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'deposito',  -- ⚠️ ALTERE ESTE VALOR baseado no resultado do PASSO 1
  50.00,
  u.saldo,
  (u.saldo + 50.00),
  'Saldo de teste V16+',
  now()
FROM usuarios u
WHERE u.email = 'test_v16_diag_1764865077736@example.com';

COMMIT;

-- Verificar resultado
SELECT id, email, saldo FROM usuarios WHERE email = 'test_v16_diag_1764865077736@example.com';
SELECT * FROM transacoes WHERE usuario_id = '8304f2d0-1195-4416-9f8f-d740380062ee' ORDER BY created_at DESC LIMIT 5;
```

## 🔄 ALTERNATIVA: SQL COM DETECÇÃO AUTOMÁTICA

Se preferir, use este SQL que tenta detectar automaticamente:

```sql
BEGIN;

WITH u AS (
  SELECT id, saldo 
  FROM usuarios 
  WHERE email = 'test_v16_diag_1764865077736@example.com' 
  FOR UPDATE
)
UPDATE usuarios
SET saldo = (u.saldo + 50.00)
FROM u
WHERE usuarios.id = u.id;

-- Inserir transação com detecção automática do tipo correto
INSERT INTO transacoes(
  id, usuario_id, tipo, valor,
  saldo_anterior, saldo_posterior,
  descricao, created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  CASE 
    -- Tentar valores comuns em ordem de probabilidade
    WHEN EXISTS (SELECT 1 FROM transacoes WHERE tipo = 'deposito' LIMIT 1) THEN 'deposito'
    WHEN EXISTS (SELECT 1 FROM transacoes WHERE tipo = 'deposit' LIMIT 1) THEN 'deposit'
    WHEN EXISTS (SELECT 1 FROM transacoes WHERE tipo = 'credito' LIMIT 1) THEN 'credito'
    WHEN EXISTS (SELECT 1 FROM transacoes WHERE tipo = 'credit' LIMIT 1) THEN 'credit'
    ELSE 'deposito'  -- Fallback
  END,
  50.00,
  u.saldo,
  (u.saldo + 50.00),
  'Saldo de teste V16+',
  now()
FROM usuarios u
WHERE u.email = 'test_v16_diag_1764865077736@example.com';

COMMIT;

-- Verificar resultado
SELECT id, email, saldo FROM usuarios WHERE email = 'test_v16_diag_1764865077736@example.com';
SELECT * FROM transacoes WHERE usuario_id = '8304f2d0-1195-4416-9f8f-d740380062ee' ORDER BY created_at DESC LIMIT 5;
```

## 📋 VALORES POSSÍVEIS PARA TIPO

Baseado nos schemas encontrados, os valores possíveis são:

1. **Schema Consolidado:** `('credito', 'debito')`
2. **Schema Final:** `('deposit', 'withdrawal', 'prize', 'bet')`
3. **Schema Guia:** `('deposito', 'saque', 'aposta', 'premio', 'bonus', 'cashback')`

**Execute o PASSO 1 primeiro para descobrir qual schema está em uso!**

## ✅ RECOMENDAÇÃO

1. Execute o PASSO 1 para verificar valores permitidos
2. Use o valor encontrado no SQL principal
3. Se não houver transações existentes, tente `'deposito'` primeiro (mais comum)

