-- =====================================================
-- CORRIGIR LOGIN - free10signer@gmail.com
-- =====================================================
-- Execute este SQL no Supabase SQL Editor (PRODUÇÃO)
-- Data: 2025-12-13
-- =====================================================

-- 1. Verificar usuário atual
SELECT 
  id, 
  email, 
  username, 
  ativo, 
  saldo,
  senha_hash IS NOT NULL as tem_senha_hash,
  updated_at,
  last_login
FROM usuarios 
WHERE email = 'free10signer@gmail.com';

-- 2. Garantir que conta está ativa
UPDATE usuarios
SET 
  ativo = true,
  updated_at = NOW()
WHERE email = 'free10signer@gmail.com'
  AND ativo = false;

-- 3. IMPORTANTE: A senha precisa ser atualizada usando bcrypt
-- Como o Supabase não tem função bcrypt nativa, você precisa:
-- 
-- OPÇÃO A: Usar o script Node.js (RECOMENDADO)
--   node scripts/alterar-senha-usuario.js free10signer@gmail.com Free10signer
--
-- OPÇÃO B: Usar a extensão pgcrypto (se disponível)
--   UPDATE usuarios
--   SET senha_hash = crypt('Free10signer', gen_salt('bf', 10))
--   WHERE email = 'free10signer@gmail.com';
--
-- OPÇÃO C: Usar hash pré-gerado (NÃO RECOMENDADO, mas funciona)
--   UPDATE usuarios
--   SET senha_hash = '$2b$10$WFyA2yQB8NRw0MqUmirG2.qqqh.Ykw70l9McGRPYvDVN16gpleQRa'
--   WHERE email = 'free10signer@gmail.com';

-- 4. Verificar após correção
SELECT 
  id, 
  email, 
  username, 
  ativo, 
  saldo,
  updated_at
FROM usuarios 
WHERE email = 'free10signer@gmail.com';

-- =====================================================
-- NOTA: O hash da senha precisa ser gerado com bcrypt
-- Use o script Node.js para garantir compatibilidade
-- =====================================================

