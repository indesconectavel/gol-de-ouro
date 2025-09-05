const pool = require('../db');

async function auditoriaUsuarios() {
  console.log('🔍 INICIANDO AUDITORIA COMPLETA DE USUÁRIOS');
  console.log('=' .repeat(60));

  try {
    // 1. Contar total de usuários
    const totalUsuarios = await pool.query('SELECT COUNT(*) FROM users');
    console.log(`📊 Total de usuários: ${totalUsuarios.rows[0].count}`);

    // 2. Usuários com saldo
    const usuariosComSaldo = await pool.query('SELECT COUNT(*) FROM users WHERE balance > 0');
    console.log(`💰 Usuários com saldo: ${usuariosComSaldo.rows[0].count}`);

    // 3. Usuários sem saldo
    const usuariosSemSaldo = await pool.query('SELECT COUNT(*) FROM users WHERE balance = 0');
    console.log(`💸 Usuários sem saldo: ${usuariosSemSaldo.rows[0].count}`);

    // 4. Usuários com saldo negativo (problema)
    const usuariosSaldoNegativo = await pool.query('SELECT COUNT(*) FROM users WHERE balance < 0');
    console.log(`⚠️  Usuários com saldo negativo: ${usuariosSaldoNegativo.rows[0].count}`);

    // 5. Listar usuários com dados fictícios
    const usuariosFicticios = await pool.query(`
      SELECT id, name, email, balance, created_at 
      FROM users 
      WHERE name LIKE '%test%' 
         OR name LIKE '%exemplo%' 
         OR name LIKE '%admin%'
         OR email LIKE '%test%'
         OR email LIKE '%exemplo%'
         OR email LIKE '%@test.com'
         OR email LIKE '%@example.com'
      ORDER BY created_at DESC
    `);
    
    console.log(`\n🎭 Usuários com dados fictícios: ${usuariosFicticios.rows.length}`);
    if (usuariosFicticios.rows.length > 0) {
      console.log('   Detalhes:');
      usuariosFicticios.rows.forEach(user => {
        console.log(`   - ID: ${user.id} | Nome: ${user.name} | Email: ${user.email} | Saldo: R$ ${user.balance}`);
      });
    }

    // 6. Usuários criados hoje
    const usuariosHoje = await pool.query(`
      SELECT COUNT(*) FROM users 
      WHERE DATE(created_at) = CURRENT_DATE
    `);
    console.log(`\n📅 Usuários criados hoje: ${usuariosHoje.rows[0].count}`);

    // 7. Usuários ativos (com transações recentes)
    const usuariosAtivos = await pool.query(`
      SELECT COUNT(DISTINCT u.id) 
      FROM users u 
      INNER JOIN transactions t ON u.id = t.user_id 
      WHERE t.transaction_date >= NOW() - INTERVAL '7 days'
    `);
    console.log(`🟢 Usuários ativos (últimos 7 dias): ${usuariosAtivos.rows[0].count}`);

    // 8. Top 10 usuários por saldo
    const topUsuarios = await pool.query(`
      SELECT id, name, email, balance, created_at 
      FROM users 
      ORDER BY balance DESC 
      LIMIT 10
    `);
    
    console.log('\n🏆 TOP 10 USUÁRIOS POR SALDO:');
    topUsuarios.rows.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} - R$ ${user.balance} (${user.email})`);
    });

    // 9. Estatísticas de transações
    const statsTransacoes = await pool.query(`
      SELECT 
        COUNT(*) as total_transacoes,
        SUM(amount) as valor_total,
        AVG(amount) as valor_medio,
        COUNT(DISTINCT user_id) as usuarios_com_transacoes
      FROM transactions
    `);
    
    const stats = statsTransacoes.rows[0];
    console.log('\n💳 ESTATÍSTICAS DE TRANSAÇÕES:');
    console.log(`   Total de transações: ${stats.total_transacoes}`);
    console.log(`   Valor total movimentado: R$ ${parseFloat(stats.valor_total || 0).toFixed(2)}`);
    console.log(`   Valor médio por transação: R$ ${parseFloat(stats.valor_medio || 0).toFixed(2)}`);
    console.log(`   Usuários com transações: ${stats.usuarios_com_transacoes}`);

    // 10. Verificar pagamentos PIX
    const statsPix = await pool.query(`
      SELECT 
        COUNT(*) as total_pagamentos,
        SUM(amount) as valor_total_pix,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as pagamentos_aprovados,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pagamentos_pendentes,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as pagamentos_rejeitados
      FROM pix_payments
    `);
    
    const pixStats = statsPix.rows[0];
    console.log('\n💳 ESTATÍSTICAS PIX:');
    console.log(`   Total de pagamentos PIX: ${pixStats.total_pagamentos}`);
    console.log(`   Valor total PIX: R$ ${parseFloat(pixStats.valor_total_pix || 0).toFixed(2)}`);
    console.log(`   Pagamentos aprovados: ${pixStats.pagamentos_aprovados}`);
    console.log(`   Pagamentos pendentes: ${pixStats.pagamentos_pendentes}`);
    console.log(`   Pagamentos rejeitados: ${pixStats.pagamentos_rejeitados}`);

    // 11. Verificar apostas
    const statsApostas = await pool.query(`
      SELECT 
        COUNT(*) as total_apostas,
        SUM(amount) as valor_total_apostas,
        COUNT(CASE WHEN result = 'win' THEN 1 END) as apostas_ganhas,
        COUNT(CASE WHEN result = 'lose' THEN 1 END) as apostas_perdidas
      FROM bets
    `);
    
    const apostaStats = statsApostas.rows[0];
    console.log('\n⚽ ESTATÍSTICAS DE APOSTAS:');
    console.log(`   Total de apostas: ${apostaStats.total_apostas}`);
    console.log(`   Valor total apostado: R$ ${parseFloat(apostaStats.valor_total_apostas || 0).toFixed(2)}`);
    console.log(`   Apostas ganhas: ${apostaStats.apostas_ganhas}`);
    console.log(`   Apostas perdidas: ${apostaStats.apostas_perdidas}`);

    // 12. Verificar problemas críticos
    console.log('\n🚨 VERIFICAÇÃO DE PROBLEMAS CRÍTICOS:');
    
    // Usuários com saldo negativo
    if (usuariosSaldoNegativo.rows[0].count > 0) {
      console.log('   ❌ PROBLEMA: Existem usuários com saldo negativo!');
      const negativos = await pool.query('SELECT id, name, email, balance FROM users WHERE balance < 0');
      negativos.rows.forEach(user => {
        console.log(`      - ${user.name} (${user.email}): R$ ${user.balance}`);
      });
    } else {
      console.log('   ✅ Nenhum usuário com saldo negativo');
    }

    // Usuários sem email válido
    const emailsInvalidos = await pool.query(`
      SELECT COUNT(*) FROM users 
      WHERE email NOT LIKE '%@%' OR email = '' OR email IS NULL
    `);
    if (emailsInvalidos.rows[0].count > 0) {
      console.log(`   ❌ PROBLEMA: ${emailsInvalidos.rows[0].count} usuários com email inválido`);
    } else {
      console.log('   ✅ Todos os usuários têm email válido');
    }

    // Usuários duplicados por email
    const emailsDuplicados = await pool.query(`
      SELECT email, COUNT(*) as count 
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);
    if (emailsDuplicados.rows.length > 0) {
      console.log('   ❌ PROBLEMA: Emails duplicados encontrados:');
      emailsDuplicados.rows.forEach(dup => {
        console.log(`      - ${dup.email}: ${dup.count} ocorrências`);
      });
    } else {
      console.log('   ✅ Nenhum email duplicado');
    }

    console.log('\n✅ AUDITORIA CONCLUÍDA COM SUCESSO!');
    console.log('=' .repeat(60));

  } catch (error) {
    console.error('❌ ERRO NA AUDITORIA:', error);
  } finally {
    await pool.end();
  }
}

// Executar auditoria
auditoriaUsuarios();
