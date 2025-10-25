// CONSULTA LISTA DE USUÁRIOS CADASTRADOS
// =====================================================
// Data: 17/10/2025
// Status: CONSULTA USUÁRIOS
// Versão: v4.5-consulta-usuarios

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function consultarUsuariosCadastrados() {
    console.log('👥 === LISTA DE USUÁRIOS CADASTRADOS ===');
    console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
    console.log('🎯 Sistema: Gol de Ouro - Produção Real');
    console.log('');

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Consultar todos os usuários
        const { data: usuarios, error } = await supabase
            .from('usuarios')
            .select('id, username, email, saldo, tipo, ativo, email_verificado, created_at, last_login, total_apostas, total_ganhos, total_partidas, total_gols, ranking')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Erro ao consultar usuários:', error.message);
            return;
        }

        if (!usuarios || usuarios.length === 0) {
            console.log('⚠️ Nenhum usuário encontrado no banco de dados');
            return;
        }

        console.log(`📊 Total de usuários cadastrados: ${usuarios.length}`);
        console.log('');

        // Agrupar por status
        const usuariosAtivos = usuarios.filter(u => u.ativo);
        const usuariosInativos = usuarios.filter(u => !u.ativo);
        const usuariosVerificados = usuarios.filter(u => u.email_verificado);
        const usuariosNaoVerificados = usuarios.filter(u => !u.email_verificado);

        console.log('📈 ESTATÍSTICAS:');
        console.log(`   - Usuários ativos: ${usuariosAtivos.length}`);
        console.log(`   - Usuários inativos: ${usuariosInativos.length}`);
        console.log(`   - Emails verificados: ${usuariosVerificados.length}`);
        console.log(`   - Emails não verificados: ${usuariosNaoVerificados.length}`);
        console.log('');

        // Calcular estatísticas financeiras
        const saldoTotal = usuarios.reduce((sum, u) => sum + (u.saldo || 0), 0);
        const apostasTotal = usuarios.reduce((sum, u) => sum + (u.total_apostas || 0), 0);
        const ganhosTotal = usuarios.reduce((sum, u) => sum + (u.total_ganhos || 0), 0);

        console.log('💰 ESTATÍSTICAS FINANCEIRAS:');
        console.log(`   - Saldo total dos usuários: R$ ${saldoTotal.toFixed(2)}`);
        console.log(`   - Total apostado: R$ ${apostasTotal.toFixed(2)}`);
        console.log(`   - Total ganho: R$ ${ganhosTotal.toFixed(2)}`);
        console.log('');

        console.log('👥 LISTA COMPLETA DE USUÁRIOS:');
        console.log('');

        usuarios.forEach((usuario, index) => {
            const statusAtivo = usuario.ativo ? '✅ Ativo' : '❌ Inativo';
            const statusVerificado = usuario.email_verificado ? '✅ Verificado' : '⚠️ Não verificado';
            const ultimoLogin = usuario.last_login ? 
                new Date(usuario.last_login).toLocaleString('pt-BR') : 
                'Nunca logou';
            
            console.log(`${index + 1}. ${usuario.username || 'Sem username'}`);
            console.log(`   📧 Email: ${usuario.email}`);
            console.log(`   🆔 ID: ${usuario.id}`);
            console.log(`   💰 Saldo: R$ ${(usuario.saldo || 0).toFixed(2)}`);
            console.log(`   👤 Tipo: ${usuario.tipo || 'N/A'}`);
            console.log(`   📊 Status: ${statusAtivo}`);
            console.log(`   ✉️ Email: ${statusVerificado}`);
            console.log(`   📅 Cadastrado: ${new Date(usuario.created_at).toLocaleString('pt-BR')}`);
            console.log(`   🔐 Último login: ${ultimoLogin}`);
            console.log(`   🎮 Partidas: ${usuario.total_partidas || 0}`);
            console.log(`   ⚽ Gols: ${usuario.total_gols || 0}`);
            console.log(`   💵 Apostas: R$ ${(usuario.total_apostas || 0).toFixed(2)}`);
            console.log(`   🏆 Ganhos: R$ ${(usuario.total_ganhos || 0).toFixed(2)}`);
            console.log(`   🏅 Ranking: ${usuario.ranking || 0}`);
            console.log('');
        });

        // Usuários mais ativos
        console.log('🏆 TOP 5 USUÁRIOS MAIS ATIVOS (por partidas):');
        const usuariosMaisAtivos = usuarios
            .filter(u => u.total_partidas > 0)
            .sort((a, b) => (b.total_partidas || 0) - (a.total_partidas || 0))
            .slice(0, 5);

        if (usuariosMaisAtivos.length > 0) {
            usuariosMaisAtivos.forEach((usuario, index) => {
                console.log(`   ${index + 1}. ${usuario.username || 'Sem username'} - ${usuario.total_partidas} partidas`);
            });
        } else {
            console.log('   ⚠️ Nenhum usuário com partidas registradas');
        }

        console.log('');

        // Usuários com maior saldo
        console.log('💰 TOP 5 USUÁRIOS COM MAIOR SALDO:');
        const usuariosMaiorSaldo = usuarios
            .filter(u => (u.saldo || 0) > 0)
            .sort((a, b) => (b.saldo || 0) - (a.saldo || 0))
            .slice(0, 5);

        if (usuariosMaiorSaldo.length > 0) {
            usuariosMaiorSaldo.forEach((usuario, index) => {
                console.log(`   ${index + 1}. ${usuario.username || 'Sem username'} - R$ ${(usuario.saldo || 0).toFixed(2)}`);
            });
        } else {
            console.log('   ⚠️ Nenhum usuário com saldo positivo');
        }

        console.log('');

        // Usuários recentes (últimos 7 dias)
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
        
        const usuariosRecentes = usuarios.filter(u => 
            new Date(u.created_at) >= seteDiasAtras
        );

        console.log('🆕 USUÁRIOS CADASTRADOS NOS ÚLTIMOS 7 DIAS:');
        if (usuariosRecentes.length > 0) {
            usuariosRecentes.forEach((usuario, index) => {
                console.log(`   ${index + 1}. ${usuario.username || 'Sem username'} - ${new Date(usuario.created_at).toLocaleDateString('pt-BR')}`);
            });
        } else {
            console.log('   ⚠️ Nenhum usuário cadastrado nos últimos 7 dias');
        }

        console.log('');
        console.log('📊 RESUMO FINAL:');
        console.log(`   - Total de usuários: ${usuarios.length}`);
        console.log(`   - Usuários ativos: ${usuariosAtivos.length}`);
        console.log(`   - Saldo total: R$ ${saldoTotal.toFixed(2)}`);
        console.log(`   - Partidas totais: ${usuarios.reduce((sum, u) => sum + (u.total_partidas || 0), 0)}`);
        console.log(`   - Gols totais: ${usuarios.reduce((sum, u) => sum + (u.total_gols || 0), 0)}`);

        console.log('');
        console.log('🎉 CONSULTA DE USUÁRIOS CONCLUÍDA!');
        console.log(`📅 Relatório gerado em: ${new Date().toLocaleString('pt-BR')}`);

    } catch (error) {
        console.error('❌ Erro geral na consulta:', error.message);
    }
}

// Executar consulta
consultarUsuariosCadastrados().catch(console.error);




