/**
 * VALIDATE HEARTBEAT V19 - Valida heartbeat no Supabase
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function validarHeartbeat() {
  console.log('============================================================');
  console.log(' VALIDAÇÃO DE HEARTBEAT V19');
  console.log('============================================================\n');
  
  console.log('🔍 Consultando system_heartbeat...\n');
  
  try {
    const { data, error } = await supabase
      .from('system_heartbeat')
      .select('*')
      .order('last_seen', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Erro ao consultar heartbeat:', error.message);
      return { success: false, error: error.message };
    }
    
    if (!data || data.length === 0) {
      console.error('❌ Nenhum registro de heartbeat encontrado');
      console.error('   Diagnóstico:');
      console.error('   1. Verifique se o servidor está rodando');
      console.error('   2. Verifique se USE_DB_QUEUE=true no .env.local');
      console.error('   3. Verifique se heartbeat_sender está sendo chamado');
      return { success: false, error: 'Nenhum heartbeat encontrado' };
    }
    
    console.log(`✅ ${data.length} registro(s) de heartbeat encontrado(s)\n`);
    
    // Validar cada registro
    const agora = new Date();
    let todosRecentes = true;
    
    data.forEach((hb, index) => {
      const lastSeen = new Date(hb.last_seen);
      const diffSegundos = (agora - lastSeen) / 1000;
      
      console.log(`📊 Heartbeat ${index + 1}:`);
      console.log(`   Instance ID: ${hb.instance_id}`);
      console.log(`   Last Seen: ${hb.last_seen} (${diffSegundos.toFixed(1)}s atrás)`);
      console.log(`   Metadata: ${JSON.stringify(hb.metadata || {})}`);
      
      if (diffSegundos > 10) {
        console.log(`   ⚠️  Heartbeat antigo (>10s)`);
        todosRecentes = false;
      } else {
        console.log(`   ✅ Heartbeat recente (<10s)`);
      }
      console.log('');
    });
    
    // Verificar consistência de instance_id
    const instanceIds = [...new Set(data.map(hb => hb.instance_id))];
    if (instanceIds.length > 1) {
      console.log(`⚠️  Múltiplos instance_ids encontrados: ${instanceIds.join(', ')}`);
    } else {
      console.log(`✅ Instance ID consistente: ${instanceIds[0]}`);
    }
    
    // Verificar se há heartbeat muito recente (<5s)
    const heartbeatRecente = data.some(hb => {
      const diffSegundos = (agora - new Date(hb.last_seen)) / 1000;
      return diffSegundos < 5;
    });
    
    if (!heartbeatRecente) {
      console.log('\n⚠️  ATENÇÃO: Nenhum heartbeat muito recente (<5s)');
      console.log('   O heartbeat pode não estar sendo atualizado automaticamente');
    } else {
      console.log('\n✅ Heartbeat está sendo atualizado automaticamente');
    }
    
    return {
      success: todosRecentes && heartbeatRecente,
      heartbeats: data,
      instanceIds,
      todosRecentes,
      heartbeatRecente
    };
  } catch (error) {
    console.error('❌ Erro ao validar heartbeat:', error.message);
    return { success: false, error: error.message };
  }
}

if (require.main === module) {
  validarHeartbeat()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Heartbeat validado com sucesso');
        process.exit(0);
      } else {
        console.log('\n❌ Validação de heartbeat falhou');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

module.exports = { validarHeartbeat };

