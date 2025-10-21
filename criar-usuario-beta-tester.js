// CRIAR USUÁRIO BETA TESTER - GOL DE OURO v4.5
// =============================================
// Data: 19/10/2025
// Status: CRIAÇÃO DE USUÁRIO PARA BETA TESTER

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  'https://gayopagjdrkcmkirmfvy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdheW9wYWdqZHJrY21raXJtZnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDAyMDY2OSwiZXhwIjoyMDc1NTk2NjY5fQ.BjmwUSoKDksHybO9pta71F4E5RyILNeuK_FRzxkPnqU'
);

async function criarUsuarioBetaTester() {
  console.log('🔧 === CRIANDO USUÁRIO BETA TESTER ===');
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('');

  const usuario = {
    email: 'mixicaaguiar18@gmail.com.br',
    username: 'mixicaaguiar18',
    password: '181818'
  };

  try {
    console.log('🔍 Verificando se usuário já existe...');
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('email', usuario.email)
      .single();

    if (existingUser) {
      console.log('⚠️ Usuário já existe:', usuario.email);
      console.log('🔧 Atualizando senha...');
      
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(usuario.password, saltRounds);
      
      const { data: updateData, error: updateError } = await supabase
        .from('usuarios')
        .update({ senha_hash: passwordHash })
        .eq('email', usuario.email)
        .select();

      if (updateError) {
        console.log('❌ Erro ao atualizar senha:', updateError.message);
        return;
      }

      console.log('✅ Senha atualizada com sucesso!');
      console.log('📧 Email:', usuario.email);
      console.log('🔑 Senha:', usuario.password);
      
    } else {
      console.log('👤 Criando novo usuário...');
      
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(usuario.password, saltRounds);
      
      const { data: newUser, error: insertError } = await supabase
        .from('usuarios')
        .insert([{
          email: usuario.email,
          username: usuario.username,
          senha_hash: passwordHash,
          saldo: 0.00,
          tipo: 'jogador',
          ativo: true,
          email_verificado: false
        }])
        .select()
        .single();

      if (insertError) {
        console.log('❌ Erro ao criar usuário:', insertError.message);
        return;
      }

      console.log('✅ Usuário criado com sucesso!');
      console.log('📧 Email:', usuario.email);
      console.log('👤 Username:', usuario.username);
      console.log('🔑 Senha:', usuario.password);
      console.log('🆔 ID:', newUser.id);
    }

    console.log('');
    console.log('🎯 CREDENCIAIS PARA BETA TESTER:');
    console.log('   Email:', usuario.email);
    console.log('   Senha:', usuario.password);
    console.log('');
    console.log('✅ Beta tester pode fazer login agora!');

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

criarUsuarioBetaTester();

