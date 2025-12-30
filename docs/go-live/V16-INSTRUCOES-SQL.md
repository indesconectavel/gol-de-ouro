-- 🔒 V16 AJUSTE DE SALDO - SQL DEFINITIVO CORRIGIDO
-- Execute este SQL no Supabase Dashboard SQL Editor
-- Data: 2025-12-04
-- CORRIGIDO: Problema com constraint transacoes_tipo_check

-- ============================================
-- PRIMEIRO: Verificar valores permitidos (Execute separadamente)
-- ============================================
SELECT DISTINCT tipo FROM transacoes LIMIT 10;
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%transacoes%tipo%';

-- ============================================
-- SEGUNDO: Executar transação (Após verificar valores acima)
-- ============================================
-- ⚠️ IMPORTANTE: Substitua 'deposito' pelo valor correto encontrado acima
-- Valores possíveis: 'deposito', 'deposit', 'credito', 'credit'

BEGIN;

-- Atualizar saldo
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
-- ⚠️ ALTERE 'deposito' pelo valor correto encontrado na verificação acima
INSERT INTO transacoes(
  id, usuario_id, tipo, valor,
  saldo_anterior, saldo_posterior,
  descricao, created_at
)
SELECT
  gen_random_uuid(),
  u.id,
  'deposito',  -- ⚠️ ALTERE ESTE VALOR baseado na verificação acima
  50.00,
  u.saldo,
  (u.saldo + 50.00),
  'Saldo de teste V16+',
  now()
FROM usuarios u
WHERE u.email = 'test_v16_diag_1764865077736@example.com';

COMMIT;

-- ============================================
-- TERCEIRO: Verificar resultado
-- ============================================
SELECT id, email, saldo FROM usuarios WHERE email = 'test_v16_diag_1764865077736@example.com';
SELECT * FROM transacoes WHERE usuario_id = '8304f2d0-1195-4416-9f8f-d740380062ee' ORDER BY created_at DESC LIMIT 5;
