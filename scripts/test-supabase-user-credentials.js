#!/usr/bin/env node
/**
 * Script para testar com as credenciais fornecidas pelo usuário
 */

const { createClient } = require('@supabase/supabase-js');

async function testWithProvidedCredentials() {
  console.log('🔍 TESTANDO COM CREDENCIAIS FORNECIDAS PELO USUÁRIO');
  console.log('================================================\n');

  // Credenciais fornecidas pelo usuário
  const supabaseUrl = 'https://gayopagjdrkcmkirmfvy.supabase.co';
  const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwMjA2NjksImV4cCI6MjA3NTU5NjY2OX0.iiCn8Ygm98bR9HzNgVucafON0KzUQDN2lHNiX_rVhvI';
  const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OTksImV4cCI6MjA3NTU5NjY2OTl9.BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU';

  console.log('📋 Credenciais sendo usadas:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...\n`);

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Teste 1: Verificar conexão básica
    console.log('1. 🔍 Testando conexão básica...');
    const { data: testData, error: testError } = await supabaseAdmin
      .from('usuarios')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('❌ Erro de conexão:', testError.message);
      console.log('   Código:', testError.code);
      console.log('   Detalhes:', testError.details);
      return;
    }

    console.log('✅ Conexão estabelecida com sucesso!');

    // Teste 2: Listar usuários existentes
    console.log('\n2. 🔍 Listando usuários existentes...');
    const { data: usuarios, error: usuariosError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .limit(10);

    if (usuariosError) {
      console.log('❌ Erro ao listar usuários:', usuariosError.message);
    } else {
      console.log(`✅ Encontrados ${usuarios.length} usuários:`);
      usuarios.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id}, Saldo: R$ ${user.saldo || 0})`);
      });
    }

    // Teste 3: Buscar usuário específico
    console.log('\n3. 🔍 Buscando usuário free10signer@gmail.com...');
    const { data: user, error: userError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .eq('email', 'free10signer@gmail.com')
      .single();

    if (userError) {
      console.log('❌ Usuário não encontrado:', userError.message);
      
      // Tentar criar o usuário
      console.log('\n4. 🔍 Criando usuário free10signer@gmail.com...');
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('usuarios')
        .insert([{
          email: 'free10signer@gmail.com',
          username: 'TestUser',
          senha: 'test123',
          saldo: 100,
          role: 'player',
          account_status: 'active',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.log('❌ Erro ao criar usuário:', createError.message);
      } else {
        console.log('✅ Usuário criado com sucesso:');
        console.log(`   📧 Email: ${newUser.email}`);
        console.log(`   🆔 ID: ${newUser.id}`);
        console.log(`   💰 Saldo: R$ ${newUser.saldo}`);
      }
    } else {
      console.log('✅ Usuário encontrado:');
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   👤 Username: ${user.username}`);
      console.log(`   💰 Saldo: R$ ${user.saldo}`);
    }

    // Teste 4: Verificar estrutura da tabela
    console.log('\n5. 🔍 Verificando estrutura da tabela usuarios...');
    const { data: sampleUser, error: sampleError } = await supabaseAdmin
      .from('usuarios')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('❌ Erro ao verificar estrutura:', sampleError.message);
    } else if (sampleUser.length > 0) {
      console.log('✅ Estrutura da tabela usuarios:');
      const columns = Object.keys(sampleUser[0]);
      columns.forEach(col => {
        const value = sampleUser[0][col];
        console.log(`   📋 ${col}: ${typeof value} = ${value}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.error('   Stack:', error.stack);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  testWithProvidedCredentials().catch(console.error);
}

module.exports = testWithProvidedCredentials;
