/**
 * Script para alterar senha de usuário diretamente no banco
 * Uso: node scripts/alterar-senha-usuario.js [email] [novaSenha]
 */

const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase Admin (usar service role key)
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uatszaqzdqcwnfbipoxg.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não configurada');
  console.log('');
  console.log('Configure a variável de ambiente:');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"');
  console.log('');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function alterarSenhaUsuario(email, novaSenha) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔐 ALTERANDO SENHA DE USUÁRIO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  console.log(`👤 Email: ${email}`);
  console.log('');

  try {
    // 1. Buscar usuário
    console.log('1️⃣  Buscando usuário no banco...');
    const { data: usuario, error: buscaError } = await supabaseAdmin
      .from('usuarios')
      .select('id, email, username')
      .eq('email', email)
      .single();

    if (buscaError || !usuario) {
      throw new Error(`Usuário não encontrado: ${email}`);
    }

    console.log('   ✅ Usuário encontrado');
    console.log(`   📝 ID: ${usuario.id}`);
    console.log(`   👤 Username: ${usuario.username}`);
    console.log('');

    // 2. Gerar hash da nova senha
    console.log('2️⃣  Gerando hash da nova senha...');
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(novaSenha, saltRounds);
    console.log('   ✅ Hash gerado com sucesso');
    console.log('');

    // 3. Atualizar senha no banco
    console.log('3️⃣  Atualizando senha no banco...');
    const { error: updateError } = await supabaseAdmin
      .from('usuarios')
      .update({ senha_hash: senhaHash })
      .eq('id', usuario.id);

    if (updateError) {
      throw new Error(`Erro ao atualizar senha: ${updateError.message}`);
    }

    console.log('   ✅ Senha atualizada com sucesso');
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ SENHA ALTERADA COM SUCESSO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`👤 Usuário: ${email}`);
    console.log(`🔐 Nova senha: ${novaSenha}`);
    console.log('');
    console.log('💡 Agora você pode fazer login com a nova senha');
    console.log('');

    return true;

  } catch (error) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('❌ ERRO AO ALTERAR SENHA');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`Erro: ${error.message}`);
    console.log('');
    process.exit(1);
  }
}

// Obter argumentos
const args = process.argv.slice(2);
const email = args[0];
const novaSenha = args[1];

if (!email || !novaSenha) {
  console.log('');
  console.log('❌ ERRO: Email e senha são obrigatórios');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/alterar-senha-usuario.js [email] [novaSenha]');
  console.log('');
  console.log('Exemplo:');
  console.log('  node scripts/alterar-senha-usuario.js usuario@email.com senha123');
  console.log('');
  process.exit(1);
}

// Executar
alterarSenhaUsuario(email, novaSenha);

