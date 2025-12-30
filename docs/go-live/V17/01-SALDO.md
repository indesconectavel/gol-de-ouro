# 🔧 V17 AJUSTE DE SALDO
## Data: 2025-12-05

## Usuário:
- Email: test_v16_diag_1764865077736@example.com
- ID: 8304f2d0-1195-4416-9f8f-d740380062ee
- Saldo Inicial: R$ 60

## SQL para Executar:

```sql
-- 🔧 V17 AJUSTE DE SALDO
-- Execute este SQL no Supabase Dashboard SQL Editor
-- Data: 2025-12-05

BEGIN;

WITH u AS (
  SELECT id, saldo
  FROM usuarios
  WHERE email = 'test_v16_diag_1764865077736@example.com'
  FOR UPDATE
)
UPDATE usuarios
SET saldo = (u.saldo + 50)
FROM u
WHERE usuarios.id = u.id;

INSERT INTO transacoes(
  id, usuario_id, tipo, valor,
  saldo_anterior, saldo_posterior,
  descricao, created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'credito',
  50,
  u.saldo,
  (u.saldo + 50),
  'Saldo de teste V17',
  now()
FROM usuarios u
WHERE u.email = 'test_v16_diag_1764865077736@example.com';

COMMIT;

-- Verificar resultado
SELECT id, email, saldo FROM usuarios WHERE email = 'test_v16_diag_1764865077736@example.com';
SELECT * FROM transacoes WHERE usuario_id = (SELECT id FROM usuarios WHERE email = 'test_v16_diag_1764865077736@example.com') ORDER BY created_at DESC LIMIT 5;

```

## Instruções:
1. Copie o SQL acima
2. Execute no Supabase Dashboard → SQL Editor
3. Verifique o resultado
4. Reexecute a auditoria V17

## Status: ✅ Usuário encontrado
