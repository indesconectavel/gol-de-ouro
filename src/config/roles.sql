-- =====================================================
-- ROLES CONFIGURATION - Configuração de Roles do Sistema
-- =====================================================
-- Este arquivo documenta as roles criadas pela migration V19
-- e como utilizá-las
-- =====================================================

-- Roles Criadas:
-- 1. backend - Operações de escrita (INSERT, UPDATE, DELETE)
-- 2. observer - Apenas leitura de agregados (SELECT)
-- 3. admin - Acesso total

-- =====================================================
-- USO DAS ROLES
-- =====================================================

-- Definir role atual na sessão:
-- SET ROLE backend;
-- SET ROLE observer;
-- SET ROLE admin;

-- OU via app.role (recomendado):
-- SET LOCAL app.role = 'backend';
-- SET LOCAL app.current_user_id = 'user-uuid'::uuid;

-- =====================================================
-- PERMISSÕES POR ROLE
-- =====================================================

-- backend:
--   - INSERT em todas as tabelas
--   - UPDATE em todas as tabelas
--   - DELETE em todas as tabelas (se necessário)
--   - SELECT em todas as tabelas

-- observer:
--   - SELECT apenas em agregados e dados públicos
--   - Não pode INSERT/UPDATE/DELETE

-- admin:
--   - Acesso total a todas as operações

-- =====================================================
-- EXEMPLOS DE USO
-- =====================================================

-- Exemplo 1: Operação como backend
-- BEGIN;
-- SET LOCAL app.role = 'backend';
-- INSERT INTO chutes (...) VALUES (...);
-- COMMIT;

-- Exemplo 2: Leitura como observer
-- BEGIN;
-- SET LOCAL app.role = 'observer';
-- SELECT COUNT(*) FROM lotes WHERE status = 'ativo';
-- COMMIT;

-- Exemplo 3: Operação como usuário específico
-- BEGIN;
-- SET LOCAL app.current_user_id = 'user-uuid'::uuid;
-- SELECT * FROM usuarios WHERE id = current_setting('app.current_user_id', true)::uuid;
-- COMMIT;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

-- 1. As roles são aplicadas via RLS policies
-- 2. app.role e app.current_user_id são definidos por sessão
-- 3. RPC functions usam SECURITY DEFINER e bypassam RLS
-- 4. Sempre use RPC functions para operações críticas (rpc_add_balance, etc.)

