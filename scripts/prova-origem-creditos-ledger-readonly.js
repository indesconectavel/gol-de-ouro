/**
 * READ-ONLY: Auditoria de origem dos créditos de saldo via ledger_financeiro.
 * Não imprime SUPABASE_URL nem SERVICE_ROLE_KEY.
 * Detecta automaticamente coluna user_id ou usuario_id no ledger.
 * Saída: JSON (timestamp, coluna_uid, janela_horas, por_usuario, eventos_suspeitos, resumo).
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const JANELA_HORAS = parseInt(process.env.PROVA_LEDGER_JANELA_HORAS || '6', 10) || 6;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes', timestamp: new Date().toISOString() }));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  if (s.length <= 8) return '***';
  return s.slice(0, 4) + '…' + s.slice(-4);
}

/** Detecta qual coluna de usuário existe: user_id ou usuario_id (sem assumir as duas existirem). */
async function detectUserIdColumn() {
  const r1 = await supabase.from('ledger_financeiro').select('user_id').limit(1).maybeSingle();
  if (!r1.error) return { column: 'user_id' };
  const r2 = await supabase.from('ledger_financeiro').select('usuario_id').limit(1).maybeSingle();
  if (!r2.error) return { column: 'usuario_id' };
  return { column: null, error: r1.error?.message || r2.error?.message || 'coluna user_id/usuario_id não encontrada' };
}

async function run() {
  const since = new Date(Date.now() - JANELA_HORAS * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  const out = {
    timestamp: new Date().toISOString(),
    janela_horas: JANELA_HORAS,
    since: sinceIso,
    coluna_uid: null,
    por_usuario: [],
    top_tipos_credito_global: [],
    top_referencias_global: [],
    eventos_suspeitos: {
      creditos_repetidos_mesma_referencia: [],
      creditos_repetidos_mesmo_correlation_id: [],
      creditos_sem_referencia: [],
      muitos_creditos_pequenos_sequencia: []
    },
    saldo_vs_ledger: [],
    erros: []
  };

  const det = await detectUserIdColumn();
  out.coluna_uid = det.column;
  if (!out.coluna_uid) {
    out.erros.push({ step: 'detect_column', message: det.error || 'coluna user_id/usuario_id não detectada' });
    console.log(JSON.stringify(out, null, 2));
    process.exit(0);
    return;
  }

  const selectCols = `created_at, tipo, valor, referencia, correlation_id, ${out.coluna_uid}`;
  const { data: rows, error: eLedger } = await supabase
    .from('ledger_financeiro')
    .select(selectCols)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: true });

  if (eLedger) {
    out.erros.push({ step: 'ledger', message: eLedger.message });
    console.log(JSON.stringify(out, null, 2));
    process.exit(0);
    return;
  }

  const list = rows || [];
  const byUser = {};
  const byTipo = {};
  const byRef = {};
  const refCount = {};
  const corrCount = {};
  const semRef = [];
  const byUserSeq = {};

  list.forEach(r => {
    const uid = r[out.coluna_uid];
    const valor = Number(r.valor) || 0;
    const tipo = r.tipo || 'sem_tipo';
    const ref = r.referencia != null && String(r.referencia).trim() !== '' ? String(r.referencia).trim() : null;
    const corr = r.correlation_id != null ? String(r.correlation_id) : null;

    if (uid != null) {
      if (!byUser[uid]) byUser[uid] = { total_creditos: 0, total_debitos: 0, tipos: {}, referencias: {}, linhas: [] };
      if (valor > 0) {
        byUser[uid].total_creditos += valor;
        byTipo[tipo] = (byTipo[tipo] || 0) + 1;
        const refKey = ref || '(sem referencia)';
        byRef[refKey] = (byRef[refKey] || 0) + 1;
        byUser[uid].tipos[tipo] = (byUser[uid].tipos[tipo] || 0) + 1;
        if (ref) byUser[uid].referencias[ref] = (byUser[uid].referencias[ref] || 0) + 1;
        byUser[uid].linhas.push({ created_at: r.created_at, tipo, valor, referencia: ref ? maskId(ref) : null });
      } else if (valor < 0) {
        byUser[uid].total_debitos += Math.abs(valor);
      }
    }

    if (valor > 0) {
      if (ref) refCount[ref] = (refCount[ref] || 0) + 1;
      else semRef.push({ created_at: r.created_at, tipo, valor, uid: uid ? maskId(uid) : null });
      if (corr) corrCount[corr] = (corrCount[corr] || 0) + 1;
    }
  });

  out.top_tipos_credito_global = Object.entries(byTipo)
    .map(([tipo, count]) => ({ tipo, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
  out.top_referencias_global = Object.entries(byRef)
    .map(([ref, count]) => ({ referencia: ref.length > 60 ? ref.slice(0, 60) + '…' : ref, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  Object.entries(byUser).forEach(([uid, v]) => {
    const topTipos = Object.entries(v.tipos).map(([t, c]) => ({ tipo: t, count: c })).sort((a, b) => b.count - a.count).slice(0, 10);
    const topRefs = Object.entries(v.referencias).map(([r, c]) => ({ referencia: r.length > 40 ? r.slice(0, 40) + '…' : r, count: c })).sort((a, b) => b.count - a.count).slice(0, 5);
    out.por_usuario.push({
      usuario_id: maskId(uid),
      total_creditos: Math.round(v.total_creditos * 100) / 100,
      total_debitos: Math.round(v.total_debitos * 100) / 100,
      top_tipos_credito: topTipos,
      top_referencias: topRefs,
      num_linhas: v.linhas.length
    });
  });
  out.por_usuario.sort((a, b) => b.total_creditos - a.total_creditos);

  const refDuplicados = Object.entries(refCount).filter(([, c]) => c > 1).map(([ref, c]) => ({ referencia: maskId(ref), count: c })).sort((a, b) => b.count - a.count).slice(0, 30);
  const corrDuplicados = Object.entries(corrCount).filter(([, c]) => c > 1).map(([c, n]) => ({ correlation_id: maskId(c), count: n })).sort((a, b) => b.count - a.count).slice(0, 30);
  out.eventos_suspeitos.creditos_repetidos_mesma_referencia = refDuplicados;
  out.eventos_suspeitos.creditos_repetidos_mesmo_correlation_id = corrDuplicados;
  out.eventos_suspeitos.creditos_sem_referencia = semRef.length ? { total: semRef.length, amostra: semRef.slice(0, 15) } : { total: 0, amostra: [] };

  for (const uid of Object.keys(byUser)) {
    const linhas = byUser[uid].linhas.filter(l => l.valor > 0).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    if (linhas.length < 4) continue;
    let seq = 0;
    let maxSeq = 0;
    let lastT = 0;
    for (const l of linhas) {
      const t = new Date(l.created_at).getTime();
      if (l.valor > 0 && l.valor < 50 && (lastT === 0 || t - lastT < 120000)) {
        seq++;
        maxSeq = Math.max(maxSeq, seq);
      } else seq = 0;
      lastT = t;
    }
    if (maxSeq >= 3) {
      out.eventos_suspeitos.muitos_creditos_pequenos_sequencia.push({ usuario_id: maskId(uid), sequencia_max: maxSeq, total_linhas: linhas.length });
    }
  }

  const { data: usuarios, error: eUsr } = await supabase.from('usuarios').select('id, saldo');
  if (!eUsr && usuarios && usuarios.length) {
    const saldoMap = {};
    usuarios.forEach(u => { saldoMap[u.id] = Number(u.saldo || 0); });
    Object.entries(byUser).forEach(([uid, v]) => {
      const saldoAtual = saldoMap[uid];
      if (saldoAtual == null) return;
      const deltaLedger = v.total_creditos - v.total_debitos;
      out.saldo_vs_ledger.push({
        usuario_id: maskId(uid),
        saldo_atual: saldoAtual,
        delta_creditos_ledger_janela: Math.round(v.total_creditos * 100) / 100,
        delta_debitos_ledger_janela: Math.round(v.total_debitos * 100) / 100,
        delta_ledger_janela: Math.round(deltaLedger * 100) / 100
      });
    });
    out.saldo_vs_ledger.sort((a, b) => b.delta_ledger_janela - a.delta_ledger_janela);
  }

  console.log(JSON.stringify(out, null, 2));
}

run().catch(err => {
  console.log(JSON.stringify({ error: err?.message || String(err), timestamp: new Date().toISOString() }));
  process.exit(1);
});
