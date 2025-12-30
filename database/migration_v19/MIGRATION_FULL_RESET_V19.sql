-- =====================================================
-- MIGRATION FULL RESET V19
-- Gol de Ouro Backend - Engine V19
-- =====================================================
-- Data: 2025-12-10
-- Versão: V19.0.0
-- Status: RESET COMPLETO (⚠️ APAGA DADOS EXISTENTES)
-- 
-- ⚠️ ATENÇÃO: Este arquivo recria toda a estrutura do zero.
-- Use apenas em ambiente de desenvolvimento ou após backup completo.
-- =====================================================

-- =====================================================
-- AVISO CRÍTICO
-- =====================================================
-- 
-- ⚠️ ESTE ARQUIVO APAGA TODOS OS DADOS EXISTENTES!
-- 
-- Execute apenas se:
-- 1. Estiver em ambiente de desenvolvimento
-- 2. Tiver feito backup completo do banco
-- 3. Estiver certo de que deseja apagar todos os dados
--
-- Para atualização segura, use: MIGRATION_FULL_ATUALIZACAO_V19.sql
--
-- =====================================================

-- =====================================================
-- PARTE 1: LIMPEZA (APENAS EM DESENVOLVIMENTO)
-- =====================================================

-- Descomente as linhas abaixo APENAS se quiser apagar tudo:
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO public;

-- =====================================================
-- PARTE 2: EXTENSÕES
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- PARTE 3: EXECUTAR SCHEMAS BASE
-- =====================================================

-- Execute o schema base completo:
-- \i database/schema.sql

-- =====================================================
-- PARTE 4: EXECUTAR SCHEMAS V19
-- =====================================================

-- Execute os schemas V19 na ordem:
-- 1. Schema de lotes (persistência)
-- \i database/schema-lotes-persistencia.sql

-- 2. Schema de recompensas
-- \i database/schema-rewards.sql

-- 3. Schema de webhook events
-- \i database/schema-webhook-events.sql

-- 4. Schema de heartbeat
-- \i database/criar-system-heartbeat-100-porcento.sql

-- =====================================================
-- PARTE 5: EXECUTAR RPCs
-- =====================================================

-- Execute as RPCs na ordem:
-- 1. RPCs financeiras ACID
-- \i database/rpc-financial-acid.sql

-- 2. RPCs de lotes (já incluídas em schema-lotes-persistencia.sql)

-- 3. RPCs de recompensas (já incluídas em schema-rewards.sql)

-- 4. RPCs de webhook (já incluídas em schema-webhook-events.sql)

-- 5. RPC expire_stale_pix
-- \i database/rpc-expire-stale-pix-CORRIGIDO.sql

-- =====================================================
-- PARTE 6: APLICAR CORREÇÕES
-- =====================================================

-- Execute correções de search_path:
-- \i database/corrigir-search-path-TODAS-FUNCOES.sql

-- Execute correções de constraints:
-- \i database/corrigir-constraint-status-transacoes.sql
-- \i database/corrigir-tabela-transacoes.sql

-- =====================================================
-- PARTE 7: VALIDAÇÃO
-- =====================================================

-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('lotes', 'rewards', 'webhook_events', 'system_heartbeat')
ORDER BY table_name;

-- Verificar RPCs criadas
SELECT proname 
FROM pg_proc 
WHERE proname LIKE 'rpc_%' 
ORDER BY proname;

-- =====================================================
-- INSTRUÇÕES DE USO
-- =====================================================
--
-- Para usar este arquivo de reset completo:
--
-- 1. Faça backup do banco atual:
--    pg_dump -h [host] -U [user] -d [database] > backup_antes_reset.sql
--
-- 2. Execute os arquivos na ordem:
--    psql -h [host] -U [user] -d [database] -f database/schema.sql
--    psql -h [host] -U [user] -d [database] -f database/schema-lotes-persistencia.sql
--    psql -h [host] -U [user] -d [database] -f database/schema-rewards.sql
--    psql -h [host] -U [user] -d [database] -f database/schema-webhook-events.sql
--    psql -h [host] -U [user] -d [database] -f database/criar-system-heartbeat-100-porcento.sql
--    psql -h [host] -U [user] -d [database] -f database/rpc-financial-acid.sql
--    psql -h [host] -U [user] -d [database] -f database/rpc-expire-stale-pix-CORRIGIDO.sql
--    psql -h [host] -U [user] -d [database] -f database/corrigir-search-path-TODAS-FUNCOES.sql
--
-- 3. Valide a estrutura:
--    Execute as queries de validação acima
--
-- =====================================================

