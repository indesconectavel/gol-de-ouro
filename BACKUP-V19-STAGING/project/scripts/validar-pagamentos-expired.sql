-- Script SQL para validar pagamentos marcados como expired
-- Executar no Supabase SQL Editor

-- 1. Contar pagamentos expired
SELECT 
  COUNT(*) as total_expired,
  MIN(created_at) as oldest_expired,
  MAX(created_at) as newest_expired
FROM pagamentos_pix
WHERE status = 'expired';

-- 2. Listar pagamentos expired com detalhes
SELECT 
  id,
  payment_id,
  usuario_id,
  valor,
  status,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at))/86400 as age_days
FROM pagamentos_pix
WHERE status = 'expired'
ORDER BY updated_at DESC
LIMIT 20;

-- 3. Verificar pagamentos que deveriam ser expired (mais de 1 dia, status pending, não encontrados no MP)
SELECT 
  id,
  payment_id,
  usuario_id,
  valor,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/86400 as age_days
FROM pagamentos_pix
WHERE status = 'pending'
  AND EXTRACT(EPOCH FROM (NOW() - created_at))/86400 > 1
ORDER BY created_at ASC;

-- 4. Estatísticas gerais de status
SELECT 
  status,
  COUNT(*) as total,
  ROUND(AVG(EXTRACT(EPOCH FROM (COALESCE(updated_at, NOW()) - created_at))/86400), 2) as avg_age_days
FROM pagamentos_pix
GROUP BY status
ORDER BY total DESC;

-- 5. Verificar idade detalhada dos pagamentos pending (para validar quando serão marcados como expired)
SELECT 
  id,
  payment_id,
  usuario_id,
  valor,
  status,
  created_at,
  NOW() as agora,
  EXTRACT(EPOCH FROM (NOW() - created_at))/86400 as age_days,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as age_hours,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at))/86400 > 1 THEN 'DEVERIA SER EXPIRED'
    ELSE 'Ainda válido (< 1 dia)'
  END as status_esperado
FROM pagamentos_pix
WHERE status = 'pending'
ORDER BY created_at ASC;

