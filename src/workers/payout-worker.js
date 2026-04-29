// Worker dedicado para payout PIX (sem servidor HTTP)
const { createClient } = require('@supabase/supabase-js');
const { createPixWithdraw } = require('../../services/pix-mercado-pago');
const { processPendingWithdrawals } = require('../domain/payout/processPendingWithdrawals');

const enabled = String(process.env.ENABLE_PIX_PAYOUT_WORKER || '').toLowerCase() === 'true';
if (!enabled) {
  console.log('[PAYOUT][WORKER] ENABLE_PIX_PAYOUT_WORKER=false. Encerrando.');
  process.exit(0);
}

const intervalMs = Math.max(
  1000,
  parseInt(process.env.PAYOUT_WORKER_INTERVAL_MS || '30000', 10)
);

let running = false;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ [PAYOUT][WORKER] Supabase não configurado (SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY)');
  process.exit(1);
}

const payoutAccessToken = process.env.MERCADOPAGO_PAYOUT_ACCESS_TOKEN;
if (!payoutAccessToken) {
  console.error('❌ [PAYOUT][WORKER] Token de payout não configurado. Encerrando.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'goldeouro-backend-v1.2.1'
    }
  }
});

process.on('uncaughtException', (err) => {
  console.error('❌ [PAYOUT][WORKER] uncaughtException:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ [PAYOUT][WORKER] unhandledRejection:', err);
});

async function runCycle() {
  if (running) {
    console.log('ℹ️ [PAYOUT][WORKER] Ciclo anterior ainda em execução. Ignorando.');
    return;
  }
  running = true;
  console.log('🟦 [PAYOUT][WORKER] Início do ciclo');
  try {
    const payoutEnabled = String(process.env.PAYOUT_PIX_ENABLED || '').toLowerCase() === 'true';
    const { error: pingError } = await supabase
      .from('saques')
      .select('id')
      .limit(1);
    if (pingError) {
      console.error('❌ [PAYOUT][WORKER] Falha no ping do Supabase:', {
        message: pingError.message,
        details: pingError.details,
        hint: pingError.hint,
        code: pingError.code
      });
    }
    const result = await processPendingWithdrawals({
      supabase,
      isDbConnected: !pingError,
      payoutEnabled,
      createPixWithdraw
    });
    if (result?.processed === false) {
      console.log('ℹ️ [PAYOUT][WORKER] Nenhum saque processado neste ciclo');
    } else if (result?.success) {
      console.log('✅ [PAYOUT][WORKER] Ciclo concluído com sucesso');
    } else {
      console.log('⚠️ [PAYOUT][WORKER] Ciclo concluído com falhas');
    }
  } catch (error) {
    console.error('❌ [PAYOUT][WORKER] Erro inesperado no ciclo:', error);
  } finally {
    running = false;
    console.log('🟦 [PAYOUT][WORKER] Fim do ciclo');
  }
}

const payoutAutoFromRaw = process.env.PAYOUT_AUTO_FROM_AT;
console.log('ℹ️ [PAYOUT][WORKER] Config PAYOUT_AUTO_FROM_AT (corte mínimo de created_at):', payoutAutoFromRaw == null || String(payoutAutoFromRaw).trim() === '' ? '(não definida — processPendingWithdrawals não processa saques)' : String(payoutAutoFromRaw).trim());
console.log(`🕒 [PAYOUT][WORKER] Ativo. Intervalo ${intervalMs}ms`);

/** Heartbeat só para observabilidade (fly logs / grep). Não dispara payout. */
const workerStartMs = Date.now();
const heartbeatMs = Math.min(
  120000,
  Math.max(30000, parseInt(process.env.PAYOUT_WORKER_HEARTBEAT_LOG_MS || '60000', 10) || 60000)
);
setInterval(() => {
  console.log(
    `[PAYOUT][WORKER][HEARTBEAT] ts=${new Date().toISOString()} uptime_s=${Math.floor(
      (Date.now() - workerStartMs) / 1000
    )} payout_cycle_ms=${intervalMs} pid=${process.pid}`
  );
}, heartbeatMs);

runCycle();
setInterval(runCycle, intervalMs);
