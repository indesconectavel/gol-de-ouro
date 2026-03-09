/**
 * READ-ONLY: Documentação e sugestões para auditoria RLS da tabela saques.
 * Não executa SQL; Supabase REST API não expõe pg_policies.
 * Uso: conferir no Dashboard ou SQL Editor as políticas listadas abaixo.
 */
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, '..', 'docs', 'relatorios');

const doc = {
  timestamp_utc: new Date().toISOString(),
  tabela: 'saques',
  instrucoes_dashboard: [
    '1. Abrir Supabase Dashboard > Table Editor > saques',
    '2. Aba "RLS" ou "Policies": verificar se RLS está enabled',
    '3. Listar políticas: quais roles têm SELECT/UPDATE',
    '4. service_role em Supabase bypassa RLS por padrão'
  ],
  sql_sugerido_readonly: [
    "SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'saques';",
    "SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'saques';"
  ],
  resultado_esperado: 'Se RLS estiver ativo e service_role bypassar, o worker (que usa service_role) deve ver todas as linhas. Se count=0 com service_role, a causa não é RLS.'
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'payout-count0-rls-check.json'), JSON.stringify(doc, null, 2), 'utf8');
