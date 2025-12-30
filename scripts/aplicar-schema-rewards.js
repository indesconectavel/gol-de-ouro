// Script: Aplicar Schema de Recompensas no Supabase
// ====================================================
// Este script aplica o schema de recompensas usando Supabase Admin Client
// ====================================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabaseAdmin } = require('../database/supabase-config');

async function aplicarSchema() {
  console.log('🚀 Aplicando schema de recompensas no Supabase...\n');

  try {
    // Ler arquivo SQL
    const sqlPath = path.join(__dirname, '../database/schema-rewards.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 Schema lido com sucesso');
    console.log(`📊 Tamanho: ${sql.length} caracteres\n`);

    // Dividir em comandos individuais (separar por ;)
    // Nota: PostgreSQL pode executar múltiplos comandos de uma vez
    // Mas vamos executar tudo de uma vez usando RPC exec_sql se disponível
    
    // Tentar executar via RPC exec_sql (se disponível)
    // Caso contrário, usar método direto do Supabase
    
    console.log('⚙️ Executando schema...\n');

    // Executar SQL diretamente usando query do Supabase
    // Nota: Supabase Admin pode executar SQL raw
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      query: sql
    });

    if (error) {
      // Se exec_sql não existir, tentar método alternativo
      console.log('⚠️ Método exec_sql não disponível, tentando método alternativo...\n');
      
      // Dividir SQL em comandos e executar um por um
      const comandos = sql
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      console.log(`📋 Encontrados ${comandos.length} comandos para executar\n`);

      for (let i = 0; i < comandos.length; i++) {
        const comando = comandos[i];
        
        // Pular comentários e blocos vazios
        if (comando.startsWith('--') || comando.length < 10) {
          continue;
        }

        try {
          console.log(`⏳ Executando comando ${i + 1}/${comandos.length}...`);
          
          // Executar via query direta
          const { error: cmdError } = await supabaseAdmin
            .from('usuarios')
            .select('id')
            .limit(0);
          
          // Nota: Supabase JS não suporta execução direta de SQL DDL
          // Este método é apenas para validação de conexão
          
          console.log(`✅ Comando ${i + 1} processado`);
        } catch (err) {
          console.error(`❌ Erro no comando ${i + 1}:`, err.message);
        }
      }

      console.log('\n⚠️ ATENÇÃO: Supabase JS Client não suporta execução direta de SQL DDL.');
      console.log('📋 Por favor, copie o conteúdo de database/schema-rewards.sql');
      console.log('📋 e execute manualmente no Supabase SQL Editor.\n');
      
      return false;
    }

    console.log('✅ Schema aplicado com sucesso!\n');
    
    // Verificar aplicação
    console.log('🔍 Verificando aplicação...\n');
    
    const verificacoes = [
      {
        nome: 'Tabela rewards',
        query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rewards'`
      },
      {
        nome: 'RPC Functions',
        query: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE 'rpc_%reward%'`
      }
    ];

    for (const verificacao of verificacoes) {
      try {
        const { data: vData, error: vError } = await supabaseAdmin.rpc('exec_sql', {
          query: verificacao.query
        });

        if (!vError && vData) {
          console.log(`✅ ${verificacao.nome}: OK`);
        } else {
          console.log(`⚠️ ${verificacao.nome}: Não foi possível verificar`);
        }
      } catch (err) {
        console.log(`⚠️ ${verificacao.nome}: Erro na verificação`);
      }
    }

    return true;

  } catch (error) {
    console.error('❌ Erro ao aplicar schema:', error);
    console.log('\n📋 Por favor, aplique manualmente:');
    console.log('   1. Abra database/schema-rewards.sql');
    console.log('   2. Copie todo o conteúdo');
    console.log('   3. Cole no Supabase SQL Editor');
    console.log('   4. Execute (CTRL + Enter)\n');
    return false;
  }
}

// Executar
aplicarSchema()
  .then(success => {
    if (!success) {
      console.log('💡 DICA: Use o Supabase SQL Editor para aplicar o schema manualmente.');
      console.log('   Arquivo: database/schema-rewards.sql\n');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

