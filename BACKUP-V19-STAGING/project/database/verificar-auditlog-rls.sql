-- Verificar RLS na tabela AuditLog
-- Executar no Supabase SQL Editor

-- 1. Verificar se a tabela existe
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE LOWER(tablename) = 'auditlog';

-- 2. Se tabela não existir, verificar todas as tabelas com "audit" no nome
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE LOWER(tablename) LIKE '%audit%'
ORDER BY tablename;

-- 3. Verificar políticas existentes (apenas se tabela existir)
DO $$
DECLARE
    table_exists BOOLEAN;
    table_name TEXT;
BEGIN
    -- Verificar se existe tabela com nome similar
    SELECT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE LOWER(tablename) = 'auditlog'
    ) INTO table_exists;
    
    IF table_exists THEN
        SELECT tablename INTO table_name
        FROM pg_tables
        WHERE LOWER(tablename) = 'auditlog'
        LIMIT 1;
        
        RAISE NOTICE 'Tabela encontrada: %', table_name;
        
        -- Verificar políticas
        PERFORM 1 FROM pg_policies WHERE LOWER(tablename) = 'auditlog';
        
        IF FOUND THEN
            RAISE NOTICE 'Políticas encontradas para %', table_name;
        ELSE
            RAISE NOTICE 'Nenhuma política encontrada para %', table_name;
        END IF;
    ELSE
        RAISE NOTICE 'Tabela AuditLog não existe no banco de dados';
        RAISE NOTICE 'O warning do Security Advisor pode ser de uma tabela que foi removida ou nunca existiu';
    END IF;
END $$;

-- 4. Listar todas as tabelas com RLS habilitado mas sem políticas
SELECT 
    t.schemaname,
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON LOWER(t.tablename) = LOWER(p.tablename)
WHERE t.rowsecurity = true
    AND t.schemaname = 'public'
GROUP BY t.schemaname, t.tablename, t.rowsecurity
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;

-- 4. Opções:
-- A) Se tabela não é usada: Desabilitar RLS
--    ALTER TABLE "AuditLog" DISABLE ROW LEVEL SECURITY;

-- B) Se tabela é usada: Criar políticas RLS
--    CREATE POLICY "Backend can insert audit logs"
--    ON "AuditLog" FOR INSERT
--    TO authenticated
--    WITH CHECK (true);
--
--    CREATE POLICY "Backend can read audit logs"
--    ON "AuditLog" FOR SELECT
--    TO authenticated
--    USING (true);

