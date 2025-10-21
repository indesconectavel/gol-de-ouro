// VERIFICAÇÃO ESTRUTURA TABELA USUARIOS
// =====================================================
// Data: 17/10/2025
// Status: VERIFICAÇÃO ESTRUTURA TABELA
// Versão: v4.5-verificacao-estrutura

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verificarEstruturaUsuarios() {
    console.log('🔍 === VERIFICAÇÃO ESTRUTURA TABELA USUARIOS ===');
    console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
    console.log('');

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Tentar consultar a tabela usuarios sem especificar colunas
        console.log('1️⃣ Testando consulta básica...');
        const { data: usuarios, error: usuariosError } = await supabase
            .from('usuarios')
            .select('*')
            .limit(1);

        if (usuariosError) {
            console.log('❌ Erro ao consultar usuarios:', usuariosError.message);
            return;
        }

        console.log('✅ Consulta básica funcionando');
        console.log(`📊 Usuários encontrados: ${usuarios.length}`);

        if (usuarios.length > 0) {
            console.log('📋 Estrutura do primeiro usuário:');
            const usuario = usuarios[0];
            Object.keys(usuario).forEach(key => {
                console.log(`  - ${key}: ${typeof usuario[key]} = ${usuario[key]}`);
            });
        }

        // Tentar consultar colunas específicas
        console.log('');
        console.log('2️⃣ Testando colunas específicas...');
        
        const colunas = ['id', 'username', 'email', 'password', 'senha', 'password_hash', 'created_at', 'saldo'];
        
        for (const coluna of colunas) {
            try {
                const { data, error } = await supabase
                    .from('usuarios')
                    .select(coluna)
                    .limit(1);

                if (error) {
                    console.log(`❌ Coluna ${coluna}: ${error.message}`);
                } else {
                    console.log(`✅ Coluna ${coluna}: Existe`);
                }
            } catch (error) {
                console.log(`❌ Coluna ${coluna}: Erro de teste`);
            }
        }

        // Tentar inserir um usuário de teste
        console.log('');
        console.log('3️⃣ Testando inserção de usuário...');
        
        const usuarioTeste = {
            username: `teste_estrutura_${Date.now()}`,
            email: `teste_estrutura_${Date.now()}@goldeouro.com`,
            password: '123456',
            saldo: 0
        };

        const { data: novoUsuario, error: insertError } = await supabase
            .from('usuarios')
            .insert(usuarioTeste)
            .select();

        if (insertError) {
            console.log('❌ Erro ao inserir usuário:', insertError.message);
            console.log('📋 Detalhes do erro:', insertError);
        } else {
            console.log('✅ Usuário inserido com sucesso');
            console.log('📊 Dados inseridos:', novoUsuario);
        }

        // Verificar se o usuário foi inserido
        console.log('');
        console.log('4️⃣ Verificando usuário inserido...');
        
        const { data: usuarioInserido, error: selectError } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', usuarioTeste.email)
            .single();

        if (selectError) {
            console.log('❌ Erro ao consultar usuário inserido:', selectError.message);
        } else {
            console.log('✅ Usuário inserido encontrado');
            console.log('📊 Dados completos:', usuarioInserido);
        }

    } catch (error) {
        console.log('❌ Erro geral:', error.message);
    }
}

// Executar verificação
verificarEstruturaUsuarios().catch(console.error);
