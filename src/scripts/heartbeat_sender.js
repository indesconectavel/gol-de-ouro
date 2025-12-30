/**
 * HEARTBEAT SENDER - Envia heartbeat para system_heartbeat a cada 5s
 */

const { supabaseAdmin } = require('../../database/supabase-unified-config');

const HEARTBEAT_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '5000');
const INSTANCE_ID = process.env.INSTANCE_ID || `instance_${Date.now()}_${Math.random().toString(36).substring(7)}`;

let heartbeatInterval = null;

async function sendHeartbeat() {
  try {
    const { error } = await supabaseAdmin
      .from('system_heartbeat')
      .upsert({
        instance_id: INSTANCE_ID,
        last_seen: new Date().toISOString(),
        metadata: {
          node_version: process.version,
          platform: process.platform,
          memory_usage: {
            rss: process.memoryUsage().rss,
            heapTotal: process.memoryUsage().heapTotal,
            heapUsed: process.memoryUsage().heapUsed
          },
          uptime: process.uptime()
        }
      }, {
        onConflict: 'instance_id'
      });

    if (error) {
      console.error(`❌ [HEARTBEAT] Erro ao enviar heartbeat: ${error.message}`);
    } else {
      console.log(`✅ [HEARTBEAT] Heartbeat enviado: ${INSTANCE_ID}`);
    }
  } catch (error) {
    console.error(`❌ [HEARTBEAT] Exceção ao enviar heartbeat: ${error.message}`);
  }
}

function startHeartbeat() {
  console.log(`🔄 [HEARTBEAT] Iniciando heartbeat sender (intervalo: ${HEARTBEAT_INTERVAL}ms)`);
  console.log(`   Instance ID: ${INSTANCE_ID}`);
  
  // Enviar primeiro heartbeat imediatamente
  sendHeartbeat();
  
  // Configurar intervalo
  heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('🛑 [HEARTBEAT] Parando heartbeat sender...');
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
  });
  
  process.on('SIGINT', () => {
    console.log('🛑 [HEARTBEAT] Parando heartbeat sender...');
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
    process.exit(0);
  });
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('🛑 [HEARTBEAT] Heartbeat sender parado');
  }
}

if (require.main === module) {
  startHeartbeat();
}

module.exports = { startHeartbeat, stopHeartbeat, sendHeartbeat, INSTANCE_ID };

