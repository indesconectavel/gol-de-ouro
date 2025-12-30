# 🔒 V16 SQL CORRIGIDO - AJUSTE DE SALDO
## Data: 2025-12-04

## ⚠️ PROBLEMA IDENTIFICADO

O erro `transacoes_status_check` indica que o valor `'concluido'` não está passando na constraint.

## 🔍 VERIFICAÇÃO PRÉVIA (Execute primeiro)

Antes de executar o SQL principal, verifique os valores permitidos:

```sql
-- Verificar valores de status existentes na tabela
SELECT DISTINCT status FROM transacoes LIMIT 10;

-- Verificar constraint exata
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%transacoes%status%';
```

## ✅ SQL CORRIGIDO (Versão Segura)

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

-- Inserir transação com saldo_anterior e saldo_posterior
-- IMPORTANTE: Se 'concluido' falhar, tente 'processando' ou 'pendente'
INSERT INTO transacoes(
  id, usuario_id, tipo, valor,
  saldo_anterior, saldo_posterior,
  descricao, status, created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'credito',
  50.00,
  u.saldo,
  (u.saldo + 50.00),
  'Saldo de teste V16+',
  CASE 
    WHEN EXISTS (SELECT 1 FROM transacoes WHERE status = 'concluido' LIMIT 1) THEN 'concluido'
    WHEN EXISTS (SELECT 1 FROM transacoes WHERE status = 'processando' LIMIT 1) THEN 'processando'
    ELSE 'pendente'
  END,
  now()
FROM usuarios u
WHERE u.email = 'test_v16_diag_1764865077736@example.com';

COMMIT;

-- Verificar resultado
SELECT id, email, saldo FROM usuarios WHERE email = 'test_v16_diag_1764865077736@example.com';
SELECT * FROM transacoes WHERE usuario_id = '8304f2d0-1195-4416-9f8f-d740380062ee' ORDER BY created_at DESC LIMIT 5;
```

## 🔄 ALTERNATIVA SIMPLES (Se o CASE falhar)

Se o SQL acima ainda falhar, use esta versão mais simples que usa o valor padrão:

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

-- Inserir sem especificar status (usa DEFAULT)
INSERT INTO transacoes(
  id, usuario_id, tipo, valor,
  saldo_anterior, saldo_posterior,
  descricao, created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'credito',
  50.00,
  u.saldo,
  (u.saldo + 50.00),
  'Saldo de teste V16+',
  now()
FROM usuarios u
WHERE u.email = 'test_v16_diag_1764865077736@example.com';

COMMIT;
```

## 📋 VALORES POSSÍVEIS PARA STATUS

Baseado no schema encontrado, os valores possíveis são:
- `'pendente'` (padrão)
- `'processando'`
- `'concluido'` (sem 'a')
- `'falhou'`

**Se `'concluido'` falhar, tente `'processando'` ou deixe NULL para usar o DEFAULT.**

