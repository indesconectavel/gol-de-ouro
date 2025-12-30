-- INSTRUÇÕES PARA BACKUP DO BANCO DE DADOS
-- Execute estes comandos para gerar o backup completo do banco

-- 1. BACKUP COMPLETO (FORMATO CUSTOM)
-- pg_dump -h [HOST] -U [USER] -d [DATABASE] -F c -f backup.dump

-- 2. BACKUP APENAS SCHEMA (ESTRUTURA)
-- pg_dump -h [HOST] -U [USER] -d [DATABASE] --schema-only > schema.sql

-- 3. BACKUP APENAS DADOS
-- pg_dump -h [HOST] -U [USER] -d [DATABASE] --data-only > data.sql

-- NOTA: Substitua [HOST], [USER] e [DATABASE] pelas credenciais do Supabase
-- As credenciais estão em: .env (SUPABASE_URL)
