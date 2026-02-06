/**
 * MISSÃO B2 — Verificação empírica READ-ONLY (apenas SELECT / leitura).
 * Usa apenas @supabase/supabase-js. Nenhum INSERT, UPDATE, DELETE, RPC, etc.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const out = { etapa1: {}, etapa2: {}, etapa3: {}, etapa4: {}, erros: [], resumo: {} };

function logErr(label, e) {
  out.erros.push({ label, message: e?.message || String(e) });
}

async function run() {
  try {
    // ——— ETAPA 1.1 — Duplicidade por external_id / payment_id ———
    let r1 = await supabase.from('pagamentos_pix').select('id, external_id, payment_id, status, valor, amount');
    if (r1.error) {
      logErr('1.1 pagamentos_pix', r1.error);
      out.etapa1.duplicidade = [];
    } else {
      const rows = r1.data || [];
      const byExternal = {};
      const byPaymentId = {};
      for (const row of rows) {
        const ext = row.external_id != null ? row.external_id : row.payment_id;
        if (ext != null) {
          byExternal[ext] = (byExternal[ext] || []).concat(row);
        }
        if (row.payment_id != null) {
          byPaymentId[row.payment_id] = (byPaymentId[row.payment_id] || []).concat(row);
        }
      }
      const duplicados = [];
      for (const [k, arr] of Object.entries(byExternal)) {
        if (arr.length > 1) duplicados.push({ external_id: k, total_registros: arr.length, total_aprovados: arr.filter(x => x.status === 'approved').length });
      }
      for (const [k, arr] of Object.entries(byPaymentId)) {
        const aprov = arr.filter(x => x.status === 'approved').length;
        if (arr.length > 1 || aprov > 1) {
          if (!duplicados.find(d => (d.external_id || d.payment_id) === k)) duplicados.push({ payment_id: k, total_registros: arr.length, total_aprovados: aprov });
        }
      }
      out.etapa1.duplicidade = duplicados;
      out.etapa1.total_linhas = duplicados.length;
    }

    // ——— ETAPA 2.1 — Total PIX aprovados por usuário ———
    let r21 = await supabase.from('pagamentos_pix').select('usuario_id, valor, amount').eq('status', 'approved');
    if (r21.error) { logErr('2.1 pix aprovados', r21.error); out.etapa2.pix_por_usuario = []; } else {
      const byUser = {};
      for (const row of (r21.data || [])) {
        const v = Number(row.valor ?? row.amount ?? 0);
        byUser[row.usuario_id] = (byUser[row.usuario_id] || { total: 0, qtd: 0 });
        byUser[row.usuario_id].total += v;
        byUser[row.usuario_id].qtd += 1;
      }
      out.etapa2.pix_por_usuario = Object.entries(byUser).map(([usuario_id, o]) => ({ usuario_id, total_pix_aprovado: o.total, qtd_pix_aprovados: o.qtd }));
    }

    // ——— ETAPA 2.2 — Total saques “confirmados” (vários status possíveis) ———
    const statusSaqueOk = ['confirmado', 'paid', 'success', 'processado', 'concluido'];
    let r22 = await supabase.from('saques').select('usuario_id, valor, amount, status');
    if (r22.error) { logErr('2.2 saques', r22.error); out.etapa2.saques_por_usuario = []; } else {
      const byUser = {};
      for (const row of (r22.data || [])) {
        if (!statusSaqueOk.includes(String(row.status).toLowerCase())) continue;
        const v = Number(row.valor ?? row.amount ?? 0);
        byUser[row.usuario_id] = (byUser[row.usuario_id] || 0) + v;
      }
      out.etapa2.saques_por_usuario = Object.entries(byUser).map(([usuario_id, total_saques_confirmados]) => ({ usuario_id, total_saques_confirmados }));
    }

    // ——— ETAPA 2.3 — Prêmios em transacoes ———
    let r23 = await supabase.from('transacoes').select('usuario_id, valor').in('tipo', ['premio', 'ganho_jogo']);
    if (r23.error) { logErr('2.3 premios', r23.error); out.etapa2.premios_por_usuario = []; } else {
      const byUser = {};
      for (const row of (r23.data || [])) {
        byUser[row.usuario_id] = (byUser[row.usuario_id] || 0) + Number(row.valor || 0);
      }
      out.etapa2.premios_por_usuario = Object.entries(byUser).map(([usuario_id, total_premios]) => ({ usuario_id, total_premios }));
    }

    // ——— ETAPA 3.1 — Reconciliação saldo real vs teórico ———
    let rU = await supabase.from('usuarios').select('id, saldo');
    if (rU.error) { logErr('3.1 usuarios', rU.error); out.etapa3.diferenca = []; } else {
      const pixMap = {}; (out.etapa2.pix_por_usuario || []).forEach(x => { pixMap[x.usuario_id] = x.total_pix_aprovado; });
      const saqMap = {}; (out.etapa2.saques_por_usuario || []).forEach(x => { saqMap[x.usuario_id] = x.total_saques_confirmados; });
      const premMap = {}; (out.etapa2.premios_por_usuario || []).forEach(x => { premMap[x.usuario_id] = x.total_premios; });
      const diferenca = [];
      for (const u of (rU.data || [])) {
        const saldo_atual = Number(u.saldo || 0);
        const pix = pixMap[u.id] || 0;
        const premios = premMap[u.id] || 0;
        const saques = saqMap[u.id] || 0;
        const saldo_teorico = pix + premios - saques;
        const diff = saldo_atual - saldo_teorico;
        if (Math.abs(diff) > 0.01) diferenca.push({ usuario_id: u.id, saldo_atual, pix, premios, saques, saldo_teorico, diferenca: diff });
      }
      out.etapa3.diferenca = diferenca;
      out.etapa3.total_linhas = diferenca.length;
    }

    // ——— ETAPA 4.1 — Saques confirmados sem nenhum PIX aprovado ———
    const usuariosComPix = new Set((out.etapa2.pix_por_usuario || []).map(x => x.usuario_id));
    let r41 = await supabase.from('saques').select('id, usuario_id, valor, status, created_at');
    if (r41.error) { logErr('4.1 saques sem lastro', r41.error); out.etapa4.saques_sem_lastro = []; } else {
      const semLastro = (r41.data || []).filter(s => statusSaqueOk.includes(String(s.status).toLowerCase()) && !usuariosComPix.has(s.usuario_id));
      out.etapa4.saques_sem_lastro = semLastro.map(s => ({ saque_id: s.id, usuario_id: s.usuario_id, valor: s.valor, status: s.status, created_at: s.created_at }));
    }

    // ——— ETAPA 4.2 — PIX aprovado + saque em janela de 5s ———
    let rP = await supabase.from('pagamentos_pix').select('usuario_id, external_id, payment_id, created_at').eq('status', 'approved');
    let rS = await supabase.from('saques').select('usuario_id, valor, created_at');
    if (rP.error || rS.error) { if (rP.error) logErr('4.2 pix', rP.error); if (rS.error) logErr('4.2 saques', rS.error); out.etapa4.concorrencia = []; } else {
      const pixList = rP.data || [];
      const saqList = rS.data || [];
      const concorrencia = [];
      for (const p of pixList) {
        const tP = new Date(p.created_at).getTime();
        for (const s of saqList) {
          if (s.usuario_id !== p.usuario_id) continue;
          const tS = new Date(s.created_at).getTime();
          const diffSeg = Math.abs(tS - tP) / 1000;
          if (diffSeg < 5) concorrencia.push({ usuario_id: p.usuario_id, external_id: p.external_id || p.payment_id, pix_time: p.created_at, saque_time: s.created_at, valor: s.valor, diff_segundos: Math.round(diffSeg * 100) / 100 });
        }
      }
      out.etapa4.concorrencia = concorrencia;
    }

    out.resumo.etapa1_duplicidade_linhas = (out.etapa1.duplicidade || []).length;
    out.resumo.etapa3_diferenca_linhas = (out.etapa3.diferenca || []).length;
    out.resumo.etapa4_saques_sem_lastro_linhas = (out.etapa4.saques_sem_lastro || []).length;
    out.resumo.etapa4_concorrencia_linhas = (out.etapa4.concorrencia || []).length;
    out.resumo.erros = out.erros.length;
  } catch (e) {
    logErr('run', e);
  }
  console.log(JSON.stringify(out, null, 2));
}

run();
