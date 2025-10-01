#!/usr/bin/env node
// === VERIFICAR USUÁRIO NO BANCO ===

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  try {
    console.log('🔍 Verificando usuário free10signer@gmail.com no banco...');
    
    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', 'free10signer@gmail.com')
      .single();

    if (error) {
      console.log('❌ Erro ao buscar usuário:', error.message);
      return;
    }

    if (user) {
      console.log('✅ Usuário encontrado:');
      console.log('   ID:', user.id);
      console.log('   Email:', user.email);
      console.log('   Nome:', user.name);
      console.log('   Saldo:', user.balance);
      console.log('   Status:', user.accountStatus);
      console.log('   Criado em:', user.createdAt);
    } else {
      console.log('❌ Usuário não encontrado no banco');
      console.log('📝 Criando usuário...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Free10signer', 10);
      
      const { data: newUser, error: createError } = await supabase
        .from('User')
        .insert([{
          email: 'free10signer@gmail.com',
          passwordHash: hashedPassword,
          name: 'Usuário Teste',
          balance: 0.00,
          accountStatus: 'active',
          createdAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (createError) {
        console.log('❌ Erro ao criar usuário:', createError.message);
      } else {
        console.log('✅ Usuário criado com sucesso:');
        console.log('   ID:', newUser.id);
        console.log('   Email:', newUser.email);
        console.log('   Nome:', newUser.name);
        console.log('   Saldo:', newUser.balance);
      }
    }
  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }
}

checkUser();

