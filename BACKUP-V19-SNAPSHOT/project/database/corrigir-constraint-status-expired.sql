-- ============================================================================
-- CORREÇÃO CRÍTICA: Adicionar status 'expired' à constraint de pagamentos_pix
-- ============================================================================
-- Data: 2025-11-24
-- Problema: A constraint atual não permite status 'expired', mas o backend tenta
--           marcar pagamentos como expired durante a reconciliação.
-- Solução: Alterar constraint para incluir 'expired' como status válido.
-- ============================================================================

-- 1. Remover constraint antiga (se existir)
ALTER TABLE pagamentos_pix 
DROP CONSTRAINT IF EXISTS pagamentos_pix_status_check;

-- 2. Adicionar nova constraint incluindo 'expired'
ALTER TABLE pagamentos_pix 
ADD CONSTRAINT pagamentos_pix_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'expired'));

-- 3. Verificar constraint aplicada
SELECT 
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'pagamentos_pix'
  AND con.conname LIKE '%status%';

-- 4. Verificar se há pagamentos que precisam ser atualizados
SELECT 
  status,
  COUNT(*) as total
FROM pagamentos_pix
GROUP BY status
ORDER BY total DESC;

-- ✅ Constraint corrigida: status 'expired' agora é permitido

