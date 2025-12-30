/**
 * Script para verificar e corrigir login do usuário free10signer@gmail.com
 * 
 * Este script:
 * 1. Verifica se o usuário existe
 * 2. Verifica se a senha está correta
 * 3. Corrige a senha se necessário
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuração Supabase Production
const SUPABASE_URL = process.env.SUPABASE_URL_PROD || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY_PROD || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const EMAIL = 'free10signer@gmail.com';
const SENHA_CORRETA = 'Free10signer';

async function verificarUsuario() {
  console.log('🔍 Verificando usuário...');
  
  const { data: user, error } = await supabase
    .from('usuarios')
    .select('id, email, username, senha_hash, ativo, saldo')
    .eq('email', EMAIL)
    .single();

  if (error || !user) {
    console.error('❌ Usuário não encontrado:', error?.message || 'Nenhum usuário encontrado');
    return null;
  }

  console.log('✅ Usuário encontrado:');
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Ativo: ${user.ativo}`);
  console.log(`   Saldo: ${user.saldo || 0}`);

  return user;
}

async function verificarSenha(user) {
  console.log('\n🔐 Verificando senha...');
  
  const senhaValida = await bcrypt.compare(SENHA_CORRETA, user.senha_hash);
  
  if (senhaValida) {
    console.log('✅ Senha está correta!');
    return true;
  } else {
    console.log('❌ Senha está incorreta!');
    return false;
  }
}

async function corrigirSenha(user) {
  console.log('\n🔧 Corrigindo senha...');
  
  const senhaHash = await bcrypt.hash(SENHA_CORRETA, 10);
  
  const { data, error } = await supabase
    .from('usuarios')
    .update({
      senha_hash: senhaHash,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select();

  if (error) {
    console.error('❌ Erro ao corrigir senha:', error.message);
    return false;
  }

  console.log('✅ Senha corrigida com sucesso!');
  return true;
}

async function testarLogin() {
  console.log('\n🧪 Testando login após correção...');
  
  const { data: user } = await supabase
    .from('usuarios')
    .select('id, email, senha_hash')
    .eq('email', EMAIL)
    .single();

  if (!user) {
    console.error('❌ Usuário não encontrado para teste');
    return false;
  }

  const senhaValida = await bcrypt.compare(SENHA_CORRETA, user.senha_hash);
  
  if (senhaValida) {
    console.log('✅ Login funcionando corretamente!');
    return true;
  } else {
    console.error('❌ Login ainda não funciona após correção');
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando verificação e correção de login...\n');
  console.log(`📧 Email: ${EMAIL}`);
  console.log(`🔑 Senha: ${SENHA_CORRETA}\n`);

  try {
    // 1. Verificar se usuário existe
    const user = await verificarUsuario();
    if (!user) {
      console.log('\n❌ Não é possível continuar sem o usuário');
      process.exit(1);
    }

    // 2. Verificar senha atual
    const senhaCorreta = await verificarSenha(user);

    // 3. Corrigir senha se necessário
    if (!senhaCorreta) {
      const corrigido = await corrigirSenha(user);
      if (!corrigido) {
        console.log('\n❌ Não foi possível corrigir a senha');
        process.exit(1);
      }

      // 4. Testar login após correção
      const loginOk = await testarLogin();
      if (!loginOk) {
        console.log('\n❌ Login ainda não funciona após correção');
        process.exit(1);
      }
    }

    console.log('\n✅ Tudo funcionando corretamente!');
    console.log('\n📋 Resumo:');
    console.log(`   Email: ${EMAIL}`);
    console.log(`   Senha: ${SENHA_CORRETA}`);
    console.log(`   Status: Pronto para uso`);

  } catch (error) {
    console.error('\n❌ Erro durante execução:', error.message);
    console.error(error);
    process.exit(1);
  }
}

main();

