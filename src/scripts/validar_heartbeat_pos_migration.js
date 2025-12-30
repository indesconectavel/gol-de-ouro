/**
 * VALIDAR HEARTBEAT V19 PÓS-MIGRATION
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validarHeartbeat() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DE HEARTBEAT V19');
  console.log('============================================================\n');
  
  try {
    const { data, error } = await supabase
      .from('system_heartbeat')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(5);
    
    const resultado = {
      timestamp: new Date().toISOString(),
      data: data || [],
      error: error ? {
        message: error.message,
        code: error.code
      } : null,
      existe: !error || (error.code !== '42P01' && !error.message.includes('does not exist'))
    };
    
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        console.log('❌ Tabela system_heartbeat NÃO EXISTE');
        console.log(`   Erro: ${error.message}`);
      } else {
        console.log(`⚠️  Erro ao consultar: ${error.message}`);
      }
    } else {
      console.log(`✅ ${data.length} registro(s) de heartbeat encontrado(s)`);
      if (data.length > 0) {
        const agora = new Date();
        console.log('\n   📊 Últimos heartbeats:');
        data.forEach((hb, index) => {
          const lastSeen = new Date(hb.last_seen);
          const diffSegundos = (agora - lastSeen) / 1000;
          console.log(`      ${index + 1}. Instance: ${hb.instance_id}, Last Seen: ${diffSegundos.toFixed(1)}s atrás`);
        });
      } else {
        console.log('   ⚠️  Nenhum heartbeat registrado ainda');
      }
    }
    
    // Salvar resultado
    const reportPath = path.join(__dirname, '..', '..', 'logs', 'validacao_v19', 'heartbeat_rows.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(resultado, null, 2));
    
    console.log(`\n📄 Resultado salvo em: ${reportPath}`);
    
    return resultado;
  } catch (e) {
    console.error(`❌ Exceção: ${e.message}`);
    const resultado = {
      timestamp: new Date().toISOString(),
      data: [],
      error: { message: e.message },
      existe: false
    };
    
    const reportPath = path.join(__dirname, '..', '..', 'logs', 'validacao_v19', 'heartbeat_rows.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(resultado, null, 2));
    
    return resultado;
  }
}

if (require.main === module) {
  validarHeartbeat()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { validarHeartbeat };



