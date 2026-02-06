/**
 * MISSÃO C — Auditoria pós-deploy READ-ONLY (apenas SELECT).
 * Reporta: external_id duplicados approved; contagem approved por payment_id; top N diferenças (soma PIX approved vs saldo).
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const TOP_N = parseInt(process.env.AUDIT_C_TOP_N || '10', 10);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const report = { timestamp: new Date().toISOString(), external_id_duplicados_approved: [], approved_por_payment_id: {}, top_diferencas: [], erros: [] };

async function run() {
  try {
    // 1) external_id duplicados com status approved
    const { data: allApproved, error: e1 } = await supabase
      .from('pagamentos_pix')
      .select('id, external_id, payment_id, status, valor, amount, usuario_id')
      .eq('status', 'approved');
    if (e1) {
      report.erros.push({ step: 'approved', message: e1.message });
    } else {
      const byExternal = {};
      (allApproved || []).forEach(row => {
        const ext = row.external_id != null ? row.external_id : row.payment_id;
        if (ext != null) {
          byExternal[ext] = (byExternal[ext] || []).concat(row);
        }
      });
      report.external_id_duplicados_approved = Object.entries(byExternal)
        .filter(([, arr]) => arr.length > 1)
        .map(([external_id, rows]) => ({ external_id, total: rows.length, payment_ids: rows.map(r => r.payment_id) }));
    }

    // 2) contagem de approved por payment_id (deve ser 0 ou 1 por payment_id)
    const byPaymentId = {};
    (allApproved || []).forEach(row => {
      const pid = row.payment_id != null ? String(row.payment_id) : null;
      if (pid) byPaymentId[pid] = (byPaymentId[pid] || 0) + 1;
    });
    const multi = Object.entries(byPaymentId).filter(([, c]) => c > 1).map(([payment_id, count]) => ({ payment_id, count }));
    report.approved_por_payment_id = { total_payment_ids: Object.keys(byPaymentId).length, payment_ids_com_mais_de_um_approved: multi };

    // 3) top N usuários com maiores diferenças (soma PIX approved - saldo atual; apenas alerta)
    const { data: users, error: e2 } = await supabase.from('usuarios').select('id, saldo');
    if (e2) {
      report.erros.push({ step: 'usuarios', message: e2.message });
    } else {
      const pixByUser = {};
      (allApproved || []).forEach(row => {
        const uid = row.usuario_id;
        const v = Number(row.amount ?? row.valor ?? 0);
        pixByUser[uid] = (pixByUser[uid] || 0) + v;
      });
      const diffs = (users || []).map(u => {
        const pix = pixByUser[u.id] || 0;
        const saldo = Number(u.saldo || 0);
        return { usuario_id: u.id, soma_pix_approved: pix, saldo_atual: saldo, diferenca: saldo - pix };
      }).filter(d => Math.abs(d.diferenca) > 0.01);
      diffs.sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
      report.top_diferencas = diffs.slice(0, TOP_N);
    }

  } catch (e) {
    report.erros.push({ step: 'run', message: e?.message || String(e) });
  }
  console.log(JSON.stringify(report, null, 2));
}

run();
