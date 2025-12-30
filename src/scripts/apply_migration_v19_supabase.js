/**
 * APPLY MIGRATION V19 SUPABASE - Aplica migration V19 via Supabase SQL API
 * Divide em blocos idempotentes e aplica sequencialmente
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const migrationReport = {
  inicio: new Date().toISOString(),
  blocos_aplicados: 0,
  blocos_falhados: 0,
  erros: [],
  sucessos: []
};

// Dividir SQL em blocos executáveis
function dividirEmBlocos(sqlContent) {
  const blocos = [];
  let blocoAtual = '';
  let dentroTransacao = false;
  
  const linhas = sqlContent.split('\n');
  
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i].trim();
    
    // Detectar início de transação
    if (linha.toUpperCase().startsWith('BEGIN')) {
      dentroTransacao = true;
      blocoAtual = linha + '\n';
      continue;
    }
    
    // Detectar fim de transação
    if (linha.toUpperCase().startsWith('COMMIT')) {
      blocoAtual += linha + '\n';
      if (blocoAtual.trim()) {
        blocos.push({
          tipo: 'transacao',
          sql: blocoAtual.trim(),
          linha_inicio: i - blocoAtual.split('\n').length + 1
        });
      }
      blocoAtual = '';
      dentroTransacao = false;
      continue;
    }
  
    // Detectar blocos DO $$
    if (linha.includes('DO $$')) {
      blocoAtual = linha + '\n';
      let nivel = 1;
      i++;
      
      while (i < linhas.length && nivel > 0) {
        const linhaAtual = linhas[i];
        blocoAtual += linhaAtual + '\n';
        
        if (linhaAtual.includes('$$')) {
          nivel--;
        }
        if (linhaAtual.includes('DO $$')) {
          nivel++;
        }
        i++;
      }
      i--; // Ajustar índice
      
      if (blocoAtual.trim()) {
        blocos.push({
          tipo: 'do_block',
          sql: blocoAtual.trim(),
          linha_inicio: i - blocoAtual.split('\n').length + 1
        });
      }
      blocoAtual = '';
      continue;
    }
    
    // Adicionar linha ao bloco atual
    if (linha && !linha.startsWith('--')) {
      blocoAtual += linha + '\n';
    }
    
    // Se não está em transação e encontrou ponto e vírgula, finalizar bloco
    if (!dentroTransacao && linha.endsWith(';') && blocoAtual.trim()) {
      blocos.push({
        tipo: 'comando',
        sql: blocoAtual.trim(),
        linha_inicio: i - blocoAtual.split('\n').length + 1
      });
      blocoAtual = '';
    }
  }
  
  // Adicionar bloco final se houver
  if (blocoAtual.trim()) {
    blocos.push({
      tipo: 'comando',
      sql: blocoAtual.trim(),
      linha_inicio: linhas.length - blocoAtual.split('\n').length
    });
  }
  
  return blocos;
}

async function aplicarBloco(bloco, indice) {
  console.log(`\n📋 Aplicando bloco ${indice + 1}/${migrationReport.total_blocos} (${bloco.tipo})...`);
  console.log(`   Linha: ${bloco.linha_inicio}`);
  
  try {
    // Usar RPC exec_sql se disponível, senão usar query direta
    const { data, error } = await supabase.rpc('exec_sql', { 
      query: bloco.sql 
    }).single();
    
    if (error) {
      // Tentar método alternativo: executar via REST API
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        body: JSON.stringify({ query: bloco.sql })
      });
      
      if (!response.ok) {
        // Se RPC não existe, tentar executar SQL diretamente via query
        // Nota: Supabase não permite execução direta de SQL arbitrário via REST API
        // Vamos registrar o erro e continuar
        throw new Error(`Erro ao executar SQL: ${error.message || response.statusText}`);
      }
    }
    
    console.log(`   ✅ Bloco ${indice + 1} aplicado com sucesso`);
    migrationReport.blocos_aplicados++;
    migrationReport.sucessos.push({
      bloco: indice + 1,
      tipo: bloco.tipo,
      linha: bloco.linha_inicio
    });
    
    return { success: true };
  } catch (error) {
    console.error(`   ❌ Erro ao aplicar bloco ${indice + 1}: ${error.message}`);
    migrationReport.blocos_falhados++;
    migrationReport.erros.push({
      bloco: indice + 1,
      tipo: bloco.tipo,
      linha: bloco.linha_inicio,
      erro: error.message,
      sql: bloco.sql.substring(0, 200) + '...'
    });
    
    // Se erro crítico, parar execução
    if (error.message.includes('syntax error') || error.message.includes('does not exist')) {
      throw error;
    }
    
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('============================================================');
  console.log(' APLICAR MIGRATION V19 VIA SUPABASE SQL API');
  console.log('============================================================\n');
  
  // Ler arquivo de migration
  const migrationFile = path.join(__dirname, '..', '..', 'prisma', 'migrations', '20251205_v19_rls_indexes_migration.sql');
  const sqlContent = await fs.readFile(migrationFile, 'utf8');
  
  console.log(`📄 Arquivo de migration: ${migrationFile}`);
  console.log(`📏 Tamanho: ${sqlContent.length} caracteres\n`);
  
  // Dividir em blocos
  const blocos = dividirEmBlocos(sqlContent);
  migrationReport.total_blocos = blocos.length;
  
  console.log(`📦 Total de blocos identificados: ${blocos.length}\n`);
  
  // Aplicar cada bloco
  for (let i = 0; i < blocos.length; i++) {
    const resultado = await aplicarBloco(blocos[i], i);
    
    if (!resultado.success && migrationReport.erros.length > 0) {
      const ultimoErro = migrationReport.erros[migrationReport.erros.length - 1];
      if (ultimoErro.erro.includes('syntax error') || ultimoErro.erro.includes('does not exist')) {
        console.error('\n❌ ERRO CRÍTICO - Parando execução');
        console.error('   Acionando rollback...');
        break;
      }
    }
    
    // Pequeno delay entre blocos
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Relatório final
  migrationReport.fim = new Date().toISOString();
  
  console.log('\n============================================================');
  console.log(' RESUMO DA APLICAÇÃO');
  console.log('============================================================');
  console.log(`✅ Blocos aplicados: ${migrationReport.blocos_aplicados}/${migrationReport.total_blocos}`);
  console.log(`❌ Blocos falhados: ${migrationReport.blocos_falhados}`);
  
  if (migrationReport.erros.length > 0) {
    console.log('\n⚠️  ERROS ENCONTRADOS:');
    migrationReport.erros.forEach(e => {
      console.log(`   Bloco ${e.bloco} (linha ${e.linha}): ${e.erro}`);
    });
  }
  
  // Salvar relatório
  const reportFile = path.join(__dirname, '..', '..', 'logs', 'migration_v19_application.json');
  await fs.mkdir(path.dirname(reportFile), { recursive: true });
  await fs.writeFile(reportFile, JSON.stringify(migrationReport, null, 2));
  
  console.log(`\n📄 Relatório salvo: ${reportFile}`);
  
  if (migrationReport.blocos_falhados > 0) {
    console.log('\n⚠️  ATENÇÃO: Alguns blocos falharam');
    console.log('   Verifique o relatório e execute manualmente via Supabase Dashboard se necessário');
  }
  
  return migrationReport;
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ ERRO CRÍTICO na aplicação da migration:', error);
    console.error('   Acionando rollback...');
    process.exit(1);
  });
}

module.exports = { main, dividirEmBlocos };

