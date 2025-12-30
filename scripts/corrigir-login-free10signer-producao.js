/**
 * Script para corrigir login do usuário free10signer@gmail.com em PRODUÇÃO
 * Usa o cliente Supabase da automação
 */

const { getAdminClient } = require('../automation/lib/supabase-client');
const bcrypt = require('bcryptjs');

const EMAIL = 'free10signer@gmail.com';
const SENHA = 'Free10signer';

async function corrigirLogin() {
  console.log('🔧 Corrigindo login do usuário...\n');
  console.log(`📧 Email: ${EMAIL}`);
  console.log(`🔑 Senha: ${SENHA}\n`);

  try {
    // Obter cliente Supabase PROD
    const supabase = getAdminClient('PROD');

    // 1. Verificar se usuário existe
    console.log('1️⃣  Verificando usuário...');
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, email, username, ativo, senha_hash, saldo')
      .eq('email', EMAIL)
      .single();

    if (userError || !user) {
      console.error('❌ Usuário não encontrado:', userError?.message);
      process.exit(1);
    }

    console.log('✅ Usuário encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Ativo: ${user.ativo}`);
    console.log(`   Saldo: ${user.saldo || 0}\n`);

    // 2. Verificar senha atual
    console.log('2️⃣  Verificando senha atual...');
    const senhaValida = await bcrypt.compare(SENHA, user.senha_hash);
    
    if (senhaValida) {
      console.log('✅ Senha já está correta!');
      
      // Garantir que conta está ativa
      if (!user.ativo) {
        console.log('⚠️  Conta está inativa. Ativando...');
        const { error: updateError } = await supabase
          .from('usuarios')
          .update({ ativo: true, updated_at: new Date().toISOString() })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('❌ Erro ao ativar conta:', updateError.message);
          process.exit(1);
        }
        console.log('✅ Conta ativada!');
      }
      
      console.log('\n✅ Login deve funcionar corretamente agora!');
      return;
    }

    console.log('❌ Senha está incorreta. Corrigindo...\n');

    // 3. Gerar novo hash da senha
    console.log('3️⃣  Gerando novo hash da senha...');
    const senhaHash = await bcrypt.hash(SENHA, 10);
    console.log('✅ Hash gerado\n');

    // 4. Atualizar senha e garantir que conta está ativa
    console.log('4️⃣  Atualizando senha no banco...');
    const { error: updateError } = await supabase
      .from('usuarios')
      .update({
        senha_hash: senhaHash,
        ativo: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar senha:', updateError.message);
      process.exit(1);
    }

    console.log('✅ Senha atualizada com sucesso!\n');

    // 5. Verificar senha após atualização
    console.log('5️⃣  Verificando senha após atualização...');
    const { data: userUpdated } = await supabase
      .from('usuarios')
      .select('senha_hash')
      .eq('id', user.id)
      .single();

    const senhaValidaApos = await bcrypt.compare(SENHA, userUpdated.senha_hash);
    
    if (!senhaValidaApos) {
      console.error('❌ Senha ainda não funciona após atualização');
      process.exit(1);
    }

    console.log('✅ Senha verificada e funcionando!\n');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ LOGIN CORRIGIDO COM SUCESSO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log(`📧 Email: ${EMAIL}`);
    console.log(`🔑 Senha: ${SENHA}`);
    console.log('');
    console.log('💡 Agora você pode fazer login no app!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Erro durante correção:', error.message);
    console.error(error);
    process.exit(1);
  }
}

corrigirLogin();

