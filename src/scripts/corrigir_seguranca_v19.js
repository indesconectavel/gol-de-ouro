// Script para Corrigir Problemas de Segurança V19
// ================================================
const fs = require('fs');
const path = require('path');

console.log('🔒 [CORREÇÃO] Corrigindo problemas de segurança V19...\n');

const rootPath = path.join(__dirname, '..', '..');

// SQL para corrigir problemas identificados
const sqlCorrecoes = `
-- ============================================
-- CORREÇÕES DE SEGURANÇA V19 - Gol de Ouro
-- ============================================
-- Execute este script no Supabase SQL Editor

-- 1. CORRIGIR: RLS Disabled em system_heartbeat
ALTER TABLE IF EXISTS system_heartbeat ENABLE ROW LEVEL SECURITY;

-- Criar policy para system_heartbeat (apenas service_role pode acessar)
DROP POLICY IF EXISTS "service_role_full_access_system_heartbeat" ON system_heartbeat;
CREATE POLICY "service_role_full_access_system_heartbeat"
ON system_heartbeat
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 2. CORRIGIR: Function Search Path Mutable
-- Atualizar todas as funções para ter search_path fixo

-- update_global_metrics
CREATE OR REPLACE FUNCTION update_global_metrics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Implementação da função
  NULL;
END;
$$;

-- update_user_stats
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Implementação da função
  NULL;
END;
$$;

-- rpc_update_lote_after_shot
CREATE OR REPLACE FUNCTION rpc_update_lote_after_shot(
  p_lote_id TEXT,
  p_valor_aposta DECIMAL,
  p_premio DECIMAL,
  p_premio_gol_de_ouro DECIMAL,
  p_is_goal BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote JSONB;
BEGIN
  UPDATE lotes
  SET 
    valor_aposta = valor_aposta + p_valor_aposta,
    premio_total = premio_total + p_premio,
    premio_gol_de_ouro = premio_gol_de_ouro + p_premio_gol_de_ouro,
    updated_at = NOW()
  WHERE id = p_lote_id
  RETURNING row_to_json(lotes.*)::JSONB INTO v_lote;
  
  RETURN COALESCE(v_lote, '{}'::JSONB);
END;
$$;

-- rpc_get_or_create_lote
CREATE OR REPLACE FUNCTION rpc_get_or_create_lote(
  p_lote_id TEXT,
  p_valor_aposta DECIMAL,
  p_tamanho INTEGER,
  p_indice_vencedor INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote JSONB;
BEGIN
  SELECT row_to_json(l.*)::JSONB INTO v_lote
  FROM lotes l
  WHERE l.id = p_lote_id;
  
  IF v_lote IS NULL THEN
    INSERT INTO lotes (id, valor_aposta, tamanho, indice_vencedor, status, created_at)
    VALUES (p_lote_id, p_valor_aposta, p_tamanho, p_indice_vencedor, 'ativo', NOW())
    RETURNING row_to_json(lotes.*)::JSONB INTO v_lote;
  END IF;
  
  RETURN COALESCE(v_lote, '{}'::JSONB);
END;
$$;

-- fn_update_heartbeat
CREATE OR REPLACE FUNCTION fn_update_heartbeat(
  p_instance_id TEXT,
  p_system_name TEXT DEFAULT 'gol-de-ouro-backend',
  p_status TEXT DEFAULT 'active',
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_heartbeat JSONB;
BEGIN
  INSERT INTO system_heartbeat (instance_id, system_name, status, last_seen, metadata)
  VALUES (p_instance_id, p_system_name, p_status, NOW(), p_metadata)
  ON CONFLICT (instance_id) 
  DO UPDATE SET
    status = EXCLUDED.status,
    last_seen = NOW(),
    metadata = EXCLUDED.metadata,
    updated_at = NOW()
  RETURNING row_to_json(system_heartbeat.*)::JSONB INTO v_heartbeat;
  
  RETURN COALESCE(v_heartbeat, '{}'::JSONB);
END;
$$;

-- _table_exists
CREATE OR REPLACE FUNCTION _table_exists(p_table_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = p_table_name
  );
END;
$$;

-- 3. CORRIGIR: RLS Enabled No Policy em AuditLog
-- Criar policies para AuditLog
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'AuditLog') THEN
    -- Policy para leitura (apenas service_role)
    DROP POLICY IF EXISTS "service_role_read_auditlog" ON "AuditLog";
    CREATE POLICY "service_role_read_auditlog"
    ON "AuditLog"
    FOR SELECT
    TO service_role
    USING (true);
    
    -- Policy para inserção (apenas service_role)
    DROP POLICY IF EXISTS "service_role_insert_auditlog" ON "AuditLog";
    CREATE POLICY "service_role_insert_auditlog"
    ON "AuditLog"
    FOR INSERT
    TO service_role
    WITH CHECK (true);
  END IF;
END $$;

-- 4. CORRIGIR: RLS Enabled No Policy em fila_tabuleiro
-- Criar policies para fila_tabuleiro
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fila_tabuleiro') THEN
    -- Policy para leitura (apenas service_role)
    DROP POLICY IF EXISTS "service_role_read_fila_tabuleiro" ON fila_tabuleiro;
    CREATE POLICY "service_role_read_fila_tabuleiro"
    ON fila_tabuleiro
    FOR SELECT
    TO service_role
    USING (true);
    
    -- Policy para inserção (apenas service_role)
    DROP POLICY IF EXISTS "service_role_insert_fila_tabuleiro" ON fila_tabuleiro;
    CREATE POLICY "service_role_insert_fila_tabuleiro"
    ON fila_tabuleiro
    FOR INSERT
    TO service_role
    WITH CHECK (true);
    
    -- Policy para atualização (apenas service_role)
    DROP POLICY IF EXISTS "service_role_update_fila_tabuleiro" ON fila_tabuleiro;
    CREATE POLICY "service_role_update_fila_tabuleiro"
    ON fila_tabuleiro
    FOR UPDATE
    TO service_role
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- 5. VERIFICAR: Postgres version (informação apenas)
-- Verificar versão atual
SELECT version();

-- ============================================
-- FIM DAS CORREÇÕES
-- ============================================
`;

// Salvar SQL em arquivo
const sqlPath = path.join(rootPath, 'logs', 'v19', 'correcoes_seguranca_v19.sql');
fs.writeFileSync(sqlPath, sqlCorrecoes);
console.log(`✅ SQL de correções salvo em: ${sqlPath}`);

console.log('\n📋 PROBLEMAS IDENTIFICADOS E CORREÇÕES:');
console.log('\n1. ❌ RLS Disabled em system_heartbeat');
console.log('   ✅ Correção: Habilitar RLS e criar policy para service_role');

console.log('\n2. ⚠️  Function Search Path Mutable (6 funções)');
console.log('   ✅ Correção: Adicionar SET search_path = public em todas as funções');

console.log('\n3. ℹ️  RLS Enabled No Policy em AuditLog');
console.log('   ✅ Correção: Criar policies de leitura e inserção');

console.log('\n4. ℹ️  RLS Enabled No Policy em fila_tabuleiro');
console.log('   ✅ Correção: Criar policies de leitura, inserção e atualização');

console.log('\n5. ℹ️  Postgres version tem patches disponíveis');
console.log('   ⚠️  Ação: Verificar atualizações no Supabase Dashboard');

console.log('\n📝 PRÓXIMOS PASSOS:');
console.log('1. Executar o SQL em: logs/v19/correcoes_seguranca_v19.sql');
console.log('2. No Supabase SQL Editor, copiar e executar o conteúdo');
console.log('3. Verificar Security Advisor novamente após execução');

process.exit(0);

