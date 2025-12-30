# 🔒 V16 SQL AUTOMÁTICO FINAL - AJUSTE DE SALDO
## Data: 2025-12-04
## Versão: Automática com detecção de valores permitidos

## ⚠️ PROBLEMA IDENTIFICADO

O erro `transacoes_tipo_check` indica que o valor `'credito'` não está permitido.
O schema em produção pode usar valores diferentes como `'deposito'`, `'deposit'`, etc.

## ✅ SQL AUTOMÁTICO (Execute este)

Este SQL primeiro verifica os valores permitidos e depois usa o correto:

```sql
-- ============================================
-- V16 AJUSTE DE SALDO - SQL AUTOMÁTICO
-- ============================================

BEGIN;

-- PASSO 1: Atualizar saldo do usuário
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

-- PASSO 2: Inserir transação com detecção automática do tipo correto
INSERT INTO transacoes(
  id, usuario_id, tipo, valor,
  saldo_anterior, saldo_posterior,
  descricao, created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  -- Detectar automaticamente o tipo correto baseado em transações existentes
  COALESCE(
    (SELECT tipo FROM transacoes WHERE tipo IN ('deposito', 'deposit', 'credito', 'credit') LIMIT 1),
    'deposito'  -- Fallback se não houver transações existentes
  ),
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

## 🔄 ALTERNATIVA SIMPLES (Se o SQL acima falhar)

Se o SQL automático ainda falhar, use esta versão que tenta valores em ordem:

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

-- Tentar inserir com 'deposito' primeiro (mais comum)
DO $$
DECLARE
  tipo_valido VARCHAR(20);
BEGIN
  -- Tentar encontrar tipo válido
  SELECT tipo INTO tipo_valido 
  FROM transacoes 
  WHERE tipo IN ('deposito', 'deposit', 'credito', 'credit') 
  LIMIT 1;
  
  -- Se não encontrar, usar 'deposito' como padrão
  IF tipo_valido IS NULL THEN
    tipo_valido := 'deposito';
  END IF;
  
  -- Inserir transação
  INSERT INTO transacoes(
    id, usuario_id, tipo, valor,
    saldo_anterior, saldo_posterior,
    descricao, created_at
  )
  SELECT
    gen_random_uuid(),
    u.id,
    tipo_valido,
    50.00,
    u.saldo,
    (u.saldo + 50.00),
    'Saldo de teste V16+',
    now()
  FROM usuarios u
  WHERE u.email = 'test_v16_diag_1764865077736@example.com';
END $$;

COMMIT;

-- Verificar resultado
SELECT id, email, saldo FROM usuarios WHERE email = 'test_v16_diag_1764865077736@example.com';
SELECT * FROM transacoes WHERE usuario_id = '8304f2d0-1195-4416-9f8f-d740380062ee' ORDER BY created_at DESC LIMIT 5;
```

## 📋 VERIFICAÇÃO MANUAL (Recomendado primeiro)

Antes de executar, verifique manualmente:

```sql
-- Ver valores de tipo existentes
SELECT DISTINCT tipo FROM transacoes LIMIT 10;

-- Ver constraint
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%transacoes%tipo%';
```

Depois, use o valor encontrado no SQL principal substituindo `'deposito'`.

## ✅ VALORES POSSÍVEIS

Baseado nos schemas encontrados:
- `'deposito'` (mais provável - schema português)
- `'deposit'` (schema inglês)
- `'credito'` (schema alternativo)
- `'credit'` (schema alternativo inglês)

**Recomendação:** Tente `'deposito'` primeiro se não houver transações existentes.

