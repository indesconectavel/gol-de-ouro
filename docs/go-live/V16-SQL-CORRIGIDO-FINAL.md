-- 🔒 V16 AJUSTE DE SALDO - SQL CORRIGIDO
-- Execute este SQL no Supabase Dashboard SQL Editor
-- Data: 2025-12-04

-- PRIMEIRO: Verificar valores permitidos
SELECT DISTINCT status FROM transacoes LIMIT 10;

-- SEGUNDO: Executar transação
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

-- Inserir transação (sem status para usar DEFAULT se houver problema)
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
  'Saldo de teste V16+',
  now()
FROM usuarios u
WHERE u.email = 'test_v16_diag_1764865077736@example.com';

COMMIT;

-- Verificar resultado
SELECT id, email, saldo FROM usuarios WHERE email = 'test_v16_diag_1764865077736@example.com';
SELECT * FROM transacoes WHERE usuario_id = '8304f2d0-1195-4416-9f8f-d740380062ee' ORDER BY created_at DESC LIMIT 5;
