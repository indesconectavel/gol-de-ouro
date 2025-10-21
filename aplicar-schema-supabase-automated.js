// APLICAR SCHEMA SUPABASE AUTOMATIZADO - GOL DE OURO v4.5
// ========================================================
// Data: 19/10/2025
// Status: APLICAÇÃO AUTOMATIZADA DO SCHEMA
// Versão: v4.5-schema-automated

const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase - CREDENCIAIS REAIS VALIDADAS
const supabaseUrl = 'https://gayopagjdrkcmkirmfvy.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OSwiZXhwIjoyMDc1NTk2NjY5fQ.BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU';

// Schema consolidado
const SCHEMA_SQL = `
-- SCHEMA CONSOLIDADO FINAL - GOL DE OURO v4.5
-- =============================================
-- Data: 19/10/2025
-- Status: SCHEMA CONSOLIDADO PARA PRODUÇÃO 100%
-- Versão: v4.5-consolidado-final

-- 1. CRIAR TABELA MÉTRICAS GLOBAIS
CREATE TABLE IF NOT EXISTS public.metricas_globais (
    id SERIAL PRIMARY KEY,
    contador_chutes_global INTEGER DEFAULT 0 NOT NULL,
    ultimo_gol_de_ouro INTEGER DEFAULT 0 NOT NULL,
    total_usuarios INTEGER DEFAULT 0,
    total_jogos INTEGER DEFAULT 0,
    total_receita DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CRIAR TABELA USUÁRIOS
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    saldo DECIMAL(10,2) DEFAULT 0.00,
    tipo VARCHAR(50) DEFAULT 'jogador',
    ativo BOOLEAN DEFAULT true,
    email_verificado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRIAR TABELA PAGAMENTOS PIX
CREATE TABLE IF NOT EXISTS public.pagamentos_pix (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    qr_code TEXT,
    qr_code_base64 TEXT,
    pix_copy_paste TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CRIAR TABELA JOGOS
CREATE TABLE IF NOT EXISTS public.jogos (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    lote_id VARCHAR(255),
    direction VARCHAR(50),
    amount DECIMAL(10,2),
    result VARCHAR(50),
    premio DECIMAL(10,2) DEFAULT 0.00,
    premio_gol_de_ouro DECIMAL(10,2) DEFAULT 0.00,
    is_gol_de_ouro BOOLEAN DEFAULT false,
    contador_global INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR TABELA SAQUES
CREATE TABLE IF NOT EXISTS public.saques (
    id SERIAL PRIMARY KEY,
    usuario_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    pix_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. HABILITAR ROW LEVEL SECURITY
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos_pix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jogos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metricas_globais ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS DE SEGURANÇA
DROP POLICY IF EXISTS "Users can view own data" ON public.usuarios;
CREATE POLICY "Users can view own data" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);
    
DROP POLICY IF EXISTS "Users can update own data" ON public.usuarios;
CREATE POLICY "Users can update own data" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own games" ON public.jogos;
CREATE POLICY "Users can view own games" ON public.jogos
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can insert own games" ON public.jogos;
CREATE POLICY "Users can insert own games" ON public.jogos
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can view own payments" ON public.pagamentos_pix;
CREATE POLICY "Users can view own payments" ON public.pagamentos_pix
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Users can view own withdrawals" ON public.saques;
CREATE POLICY "Users can view own withdrawals" ON public.saques
    FOR SELECT USING (auth.uid() = usuario_id);

DROP POLICY IF EXISTS "Anyone can view global metrics" ON public.metricas_globais;
CREATE POLICY "Anyone can view global metrics" ON public.metricas_globais
    FOR SELECT USING (true);

-- 8. DADOS INICIAIS
INSERT INTO public.metricas_globais (contador_chutes_global, ultimo_gol_de_ouro)
SELECT 0, 0
WHERE NOT EXISTS (SELECT 1 FROM public.metricas_globais);

-- 9. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON public.usuarios(username);
CREATE INDEX IF NOT EXISTS idx_jogos_usuario_id ON public.jogos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_jogos_created_at ON public.jogos(created_at);
CREATE INDEX IF NOT EXISTS idx_pagamentos_usuario_id ON public.pagamentos_pix(usuario_id);
CREATE INDEX IF NOT EXISTS idx_saques_usuario_id ON public.saques(usuario_id);

-- 10. VERIFICAÇÃO FINAL
SELECT 'SCHEMA CONSOLIDADO FINAL v4.5 APLICADO COM SUCESSO' as status;
`;

async function aplicarSchemaSupabase() {
    console.log('🚀 === APLICANDO SCHEMA SUPABASE AUTOMATIZADO ===');
    console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
    console.log('');

    try {
        // Verificar se as credenciais estão configuradas
        if (!supabaseUrl || supabaseUrl.includes('your-project') || 
            !supabaseServiceKey || supabaseServiceKey.includes('your-service-role-key')) {
            
            console.log('⚠️ CREDENCIAIS SUPABASE NÃO CONFIGURADAS');
            console.log('');
            console.log('📋 Para configurar:');
            console.log('1. Execute: configurar-credenciais-supabase.ps1');
            console.log('2. Ou configure manualmente as variáveis:');
            console.log('   - SUPABASE_URL');
            console.log('   - SUPABASE_SERVICE_ROLE_KEY');
            console.log('');
            console.log('🔧 Após configurar, execute novamente este script');
            return;
        }

        // Criar cliente Supabase
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        console.log('🔗 Conectando ao Supabase...');
        console.log('   URL:', supabaseUrl);
        console.log('   Service Key:', supabaseServiceKey.substring(0, 20) + '...');
        console.log('');

        // Executar schema SQL
        console.log('📝 Aplicando schema consolidado...');
        const { data, error } = await supabase.rpc('exec_sql', { sql: SCHEMA_SQL });

        if (error) {
            console.log('❌ Erro ao aplicar schema:', error.message);
            console.log('');
            console.log('🔧 SOLUÇÃO ALTERNATIVA:');
            console.log('1. Acesse: https://supabase.com/dashboard');
            console.log('2. Vá para SQL Editor');
            console.log('3. Execute o arquivo: APLICAR-SCHEMA-SUPABASE-FINAL.sql');
            return;
        }

        console.log('✅ Schema aplicado com sucesso!');
        console.log('');

        // Verificar tabelas criadas
        console.log('🔍 Verificando tabelas criadas...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .in('table_name', ['usuarios', 'pagamentos_pix', 'jogos', 'saques', 'metricas_globais']);

        if (tablesError) {
            console.log('⚠️ Erro ao verificar tabelas:', tablesError.message);
        } else {
            console.log('📊 Tabelas encontradas:');
            tables.forEach(table => {
                console.log(`   ✅ ${table.table_name}`);
            });
        }

        console.log('');
        console.log('🎉 === SCHEMA APLICADO COM SUCESSO ===');
        console.log('✅ Banco de dados configurado');
        console.log('✅ Row Level Security habilitado');
        console.log('✅ Políticas de segurança criadas');
        console.log('✅ Índices de performance criados');
        console.log('✅ Dados iniciais inseridos');
        console.log('');
        console.log('🎯 Sistema pronto para dados 100% reais!');

    } catch (error) {
        console.log('❌ Erro geral:', error.message);
        console.log('');
        console.log('🔧 SOLUÇÃO MANUAL:');
        console.log('1. Acesse: https://supabase.com/dashboard');
        console.log('2. Vá para SQL Editor');
        console.log('3. Execute o arquivo: APLICAR-SCHEMA-SUPABASE-FINAL.sql');
    }
}

// Executar aplicação do schema
aplicarSchemaSupabase().catch(console.error);
