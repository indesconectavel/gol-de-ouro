-- CORREÇÃO FINAL - POLÍTICA PARA AUDITLOG
-- Data: 2025-01-07T23:55:00Z
-- Objetivo: Criar política RLS para tabela AuditLog

-- ===============================================
-- POLÍTICA PARA TABELA AUDITLOG
-- ===============================================

-- A tabela AuditLog deve ser acessível apenas por admins e sistema
-- pois contém logs de auditoria sensíveis

CREATE POLICY "AuditLog: admin and system only" ON public."AuditLog"
  FOR ALL
  USING (
    current_setting('jwt.claims.role', true) IN ('admin', 'service_role') OR
    current_setting('jwt.claims.role', true) = 'authenticated' -- Se necessário para consultas específicas
  );

-- Comentário da política
COMMENT ON POLICY "AuditLog: admin and system only" ON public."AuditLog" 
IS 'Apenas admins e sistema podem acessar logs de auditoria';

-- ===============================================
-- VERIFICAÇÃO FINAL
-- ===============================================

-- Verificar se a política foi criada
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'AuditLog';

-- Verificar status RLS da tabela AuditLog
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as "RLS Enabled",
    CASE 
        WHEN rowsecurity THEN '✅ RLS ATIVO' 
        ELSE '❌ RLS DESATIVO' 
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'AuditLog';

-- ===============================================
-- SCRIPT CONCLUÍDO
-- ===============================================
-- Execute este script para corrigir o último suggestion do Security Advisor
