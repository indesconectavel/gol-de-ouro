-- ============================================
-- QUERY PARA EVITAR PAUSA DO SUPABASE
-- ============================================
-- Execute esta query no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/sql/new
-- ============================================

-- Query principal para evitar pausa
SELECT COUNT(*) FROM usuarios;

-- Queries adicionais para manter ativo
SELECT COUNT(*) AS total_usuarios FROM usuarios;
SELECT COUNT(*) AS total_lotes FROM lotes;
SELECT COUNT(*) AS total_chutes FROM chutes;
SELECT COUNT(*) AS total_pagamentos FROM pagamentos;

-- Verificar métricas globais
SELECT 
  contador_chutes_global,
  ultimo_gol_de_ouro,
  updated_at
FROM metricas_globais
WHERE id = 1;

-- ============================================
-- QUERIES DE OTIMIZAÇÃO (OPCIONAL)
-- ============================================

-- Criar função otimizada para RLS
CREATE OR REPLACE FUNCTION public.auth_user_id() 
RETURNS TEXT AS $$
  SELECT auth.uid()::TEXT;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Atualizar policies para usar função otimizada
-- (Apenas se necessário, comentar se não usar RLS)
-- CREATE POLICY "users_own_data" ON public.usuarios
--   FOR SELECT USING (id = public.auth_user_id());

-- ============================================
-- FIM DAS QUERIES
-- ============================================
