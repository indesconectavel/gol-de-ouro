#!/usr/bin/env node
/**
 * Script para testar conexão direta com Supabase
 */

const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔍 TESTANDO CONEXÃO DIRETA COM SUPABASE');
  console.log('=====================================\n');

  // Configurações do Supabase
  const supabaseUrl = 'https://gayopagjdrkcmkirmfvy.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjA2NjksImV4cCI6MjA3NTU5NjY2OX0.iiCn8Ygm98bR9HzNgVucafON0KzUQDN2lHNiX_rVhvI';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OTksImV4cCI6MjA3NTU5NjY2OTl9.BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU';

  const supabase = createClient(supabaseUrl, supabaseKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Teste 1: Verificar se a tabela usuarios existe
    console.log('1. 🔍 Verificando tabela usuarios...');
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .limit(5);

    if (usuariosError) {
      console.log('❌ Erro ao buscar usuários:', usuariosError.message);
    } else {
      console.log('✅ Tabela usuarios encontrada');
      console.log(`📊 Total de usuários: ${usuarios.length}`);
      usuarios.forEach(user => {
        console.log(`   👤 ${user.email} (ID: ${user.id})`);
      });
    }

    // Teste 2: Buscar usuário específico
    console.log('\n2. 🔍 Buscando usuário free10signer@gmail.com...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', 'free10signer@gmail.com')
      .single();

    if (userError) {
      console.log('❌ Usuário não encontrado:', userError.message);
    } else {
      console.log('✅ Usuário encontrado:');
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   👤 Username: ${user.username}`);
      console.log(`   💰 Saldo: ${user.saldo}`);
    }

    // Teste 3: Criar usuário de teste se não existir
    console.log('\n3. 🔍 Criando usuário de teste se necessário...');
    const { data: newUser, error: createError } = await supabaseAdmin
      .from('usuarios')
      .insert([{
        email: 'teste@exemplo.com',
        username: 'TesteUser',
        senha: 'test123',
        saldo: 50,
        role: 'player',
        account_status: 'active'
      }])
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        console.log('⚠️ Usuário já existe (erro esperado)');
      } else {
        console.log('❌ Erro ao criar usuário:', createError.message);
      }
    } else {
      console.log('✅ Usuário criado com sucesso:');
      console.log(`   📧 Email: ${newUser.email}`);
      console.log(`   🆔 ID: ${newUser.id}`);
    }

    // Teste 4: Verificar estrutura da tabela
    console.log('\n4. 🔍 Verificando estrutura da tabela...');
    const { data: structure, error: structureError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .limit(1);

    if (structureError) {
      console.log('❌ Erro ao verificar estrutura:', structureError.message);
    } else if (structure.length > 0) {
      console.log('✅ Estrutura da tabela:');
      const columns = Object.keys(structure[0]);
      columns.forEach(col => {
        console.log(`   📋 ${col}: ${typeof structure[0][col]}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testSupabaseConnection().catch(console.error);
}

module.exports = testSupabaseConnection;
