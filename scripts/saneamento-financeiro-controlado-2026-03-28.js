/**
 * Saneamento controlado PT/EN — pagamentos_pix e saques.
 * READ-ONLY por defeito. Aplicar: node scripts/saneamento-financeiro-controlado-2026-03-28.js --apply
 *
 * Regras: só preenche NULL/vazio a partir do par; nunca sobrescreve ambos preenchidos e diferentes.
 * external_id duplicado: só inventário (sem UPDATE).
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const APPLY = process.argv.includes('--apply');
const PAGE = 1000;
const MONEY_EPS = 0.009;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(JSON.stringify({ erro: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }));
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

function n(v) {
  if (v === null || v === undefined || v === '') return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
}

function str(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

function moneyEqual(a, b) {
  const na = n(a);
  const nb = n(b);
  if (na === null || nb === null) return na === nb;
  return Math.abs(na - nb) <= MONEY_EPS;
}

async function fetchAll(table, columns) {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order('id', { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

async function main() {
  const out = {
    modo: APPLY ? 'apply' : 'diagnostico',
    timestamp_utc: new Date().toISOString(),
    pagamentos_pix: {},
    saques: {},
    updates_executados: []
  };

  const pixRows = await fetchAll(
    'pagamentos_pix',
    'id, usuario_id, amount, valor, payment_id, external_id, status'
  );

  let pp_both_null = 0;
  let pp_amount_null_valor_ok = 0;
  let pp_valor_null_amount_ok = 0;
  let pp_conflict = 0;
  let pp_ok = 0;
  const pp_fill_amount = [];
  const pp_fill_valor = [];
  const pp_conflict_ids = [];

  const extMap = new Map();
  for (const r of pixRows) {
    const e = str(r.external_id);
    if (e) {
      if (!extMap.has(e)) extMap.set(e, []);
      extMap.get(e).push(r.id);
    }
  }
  const external_id_duplicados = [...extMap.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([external_id, ids]) => ({ external_id, ids, count: ids.length }));

  const payMap = new Map();
  for (const r of pixRows) {
    const p = str(r.payment_id);
    if (p) {
      if (!payMap.has(p)) payMap.set(p, []);
      payMap.get(p).push(r.id);
    }
  }
  const payment_id_duplicados = [...payMap.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([payment_id, ids]) => ({ payment_id, ids, count: ids.length }));

  for (const r of pixRows) {
    const a = n(r.amount);
    const v = n(r.valor);
    const hasA = a !== null;
    const hasV = v !== null;
    if (!hasA && !hasV) {
      pp_both_null++;
      continue;
    }
    if (!hasA && hasV) {
      pp_amount_null_valor_ok++;
      pp_fill_amount.push({ id: r.id, valor: v });
      continue;
    }
    if (hasA && !hasV) {
      pp_valor_null_amount_ok++;
      pp_fill_valor.push({ id: r.id, amount: a });
      continue;
    }
    if (moneyEqual(a, v)) pp_ok++;
    else {
      pp_conflict++;
      pp_conflict_ids.push({ id: r.id, amount: a, valor: v, payment_id: r.payment_id, external_id: r.external_id });
    }
  }

  out.pagamentos_pix = {
    total_linhas: pixRows.length,
    amount_null_valor_preenchido: pp_amount_null_valor_ok,
    valor_null_amount_preenchido: pp_valor_null_amount_ok,
    ambos_preenchidos_iguais: pp_ok,
    ambos_preenchidos_diferentes_conflito: pp_conflict,
    ambos_null: pp_both_null,
    external_id_valores_distintos_duplicados: external_id_duplicados.length,
    external_id_duplicados_detalhe: external_id_duplicados.slice(0, 200),
    payment_id_duplicados_grupos: payment_id_duplicados.length,
    payment_id_duplicados_detalhe: payment_id_duplicados.slice(0, 200)
  };

  if (APPLY) {
    for (const { id, valor } of pp_fill_amount) {
      const { error } = await supabase.from('pagamentos_pix').update({ amount: valor }).eq('id', id);
      if (error) throw new Error(`PIX update amount id=${id}: ${error.message}`);
      out.updates_executados.push({ tabela: 'pagamentos_pix', id, campo: 'amount', origem: 'valor', valor: valor });
    }
    for (const { id, amount } of pp_fill_valor) {
      const { error } = await supabase.from('pagamentos_pix').update({ valor: amount }).eq('id', id);
      if (error) throw new Error(`PIX update valor id=${id}: ${error.message}`);
      out.updates_executados.push({ tabela: 'pagamentos_pix', id, campo: 'valor', origem: 'amount', valor: amount });
    }
  }

  const saqRows = await fetchAll(
    'saques',
    'id, usuario_id, amount, valor, chave_pix, tipo_chave, pix_key, pix_type, fee, net_amount, correlation_id, status'
  );

  let sq_both_money_null = 0;
  let sq_amount_null = 0;
  let sq_valor_null = 0;
  let sq_money_conflict = 0;
  let sq_money_ok = 0;

  let sq_pk_both_null = 0;
  let sq_pk_pix_null = 0;
  let sq_pk_chave_null = 0;
  let sq_pk_conflict = 0;
  let sq_pk_ok = 0;

  let sq_pt_both_null = 0;
  let sq_pt_pix_null = 0;
  let sq_pt_chave_null = 0;
  let sq_pt_conflict = 0;
  let sq_pt_ok = 0;

  const sq_fill_amount = [];
  const sq_fill_valor = [];
  const sq_fill_pix_key = [];
  const sq_fill_chave_pix = [];
  const sq_fill_pix_type = [];
  const sq_fill_tipo_chave = [];
  const sq_money_conflicts = [];
  const sq_pk_conflicts = [];
  const sq_pt_conflicts = [];

  let fee_null = 0;
  let net_null = 0;
  let corr_null = 0;

  for (const r of saqRows) {
    const a = n(r.amount);
    const v = n(r.valor);
    const hasA = a !== null;
    const hasV = v !== null;
    if (!hasA && !hasV) sq_both_money_null++;
    else if (!hasA && hasV) {
      sq_amount_null++;
      sq_fill_amount.push({ id: r.id, valor: v });
    } else if (hasA && !hasV) {
      sq_valor_null++;
      sq_fill_valor.push({ id: r.id, amount: a });
    } else if (moneyEqual(a, v)) sq_money_ok++;
    else {
      sq_money_conflict++;
      sq_money_conflicts.push({ id: r.id, amount: a, valor: v });
    }

    const pk = str(r.pix_key);
    const ck = str(r.chave_pix);
    const hasPk = pk !== null;
    const hasCk = ck !== null;
    if (!hasPk && !hasCk) sq_pk_both_null++;
    else if (!hasPk && hasCk) {
      sq_pk_pix_null++;
      sq_fill_pix_key.push({ id: r.id, chave_pix: ck });
    } else if (hasPk && !hasCk) {
      sq_pk_chave_null++;
      sq_fill_chave_pix.push({ id: r.id, pix_key: pk });
    } else if (pk === ck) sq_pk_ok++;
    else {
      sq_pk_conflict++;
      sq_pk_conflicts.push({ id: r.id, pix_key: pk, chave_pix: ck });
    }

    const pt = str(r.pix_type);
    const tc = str(r.tipo_chave);
    const hasPt = pt !== null;
    const hasTc = tc !== null;
    if (!hasPt && !hasTc) sq_pt_both_null++;
    else if (!hasPt && hasTc) {
      sq_pt_pix_null++;
      sq_fill_pix_type.push({ id: r.id, tipo_chave: tc });
    } else if (hasPt && !hasTc) {
      sq_pt_chave_null++;
      sq_fill_tipo_chave.push({ id: r.id, pix_type: pt });
    } else if (pt === tc) sq_pt_ok++;
    else {
      sq_pt_conflict++;
      sq_pt_conflicts.push({ id: r.id, pix_type: pt, tipo_chave: tc });
    }

    if (r.fee === null || r.fee === undefined || r.fee === '') fee_null++;
    if (r.net_amount === null || r.net_amount === undefined || r.net_amount === '') net_null++;
    if (r.correlation_id === null || r.correlation_id === undefined || String(r.correlation_id).trim() === '')
      corr_null++;
  }

  out.saques = {
    total_linhas: saqRows.length,
    amount_valor: {
      ambos_null: sq_both_money_null,
      amount_null_valor_ok: sq_amount_null,
      valor_null_amount_ok: sq_valor_null,
      ambos_iguais: sq_money_ok,
      conflito: sq_money_conflict
    },
    pix_key_chave_pix: {
      ambos_null: sq_pk_both_null,
      pix_key_null: sq_pk_pix_null,
      chave_pix_null: sq_pk_chave_null,
      iguais: sq_pk_ok,
      conflito: sq_pk_conflict
    },
    pix_type_tipo_chave: {
      ambos_null: sq_pt_both_null,
      pix_type_null: sq_pt_pix_null,
      tipo_chave_null: sq_pt_chave_null,
      iguais: sq_pt_ok,
      conflito: sq_pt_conflict
    },
    fee_null: fee_null,
    net_amount_null: net_null,
    correlation_id_null: corr_null
  };

  if (APPLY) {
    for (const { id, valor } of sq_fill_amount) {
      const { error } = await supabase.from('saques').update({ amount: valor }).eq('id', id);
      if (error) throw new Error(`saques amount id=${id}: ${error.message}`);
      out.updates_executados.push({ tabela: 'saques', id, campo: 'amount', origem: 'valor', valor });
    }
    for (const { id, amount } of sq_fill_valor) {
      const { error } = await supabase.from('saques').update({ valor: amount }).eq('id', id);
      if (error) throw new Error(`saques valor id=${id}: ${error.message}`);
      out.updates_executados.push({ tabela: 'saques', id, campo: 'valor', origem: 'amount', valor: amount });
    }
    for (const { id, chave_pix } of sq_fill_pix_key) {
      const { error } = await supabase.from('saques').update({ pix_key: chave_pix }).eq('id', id);
      if (error) throw new Error(`saques pix_key id=${id}: ${error.message}`);
      out.updates_executados.push({ tabela: 'saques', id, campo: 'pix_key', origem: 'chave_pix' });
    }
    for (const { id, pix_key } of sq_fill_chave_pix) {
      const { error } = await supabase.from('saques').update({ chave_pix: pix_key }).eq('id', id);
      if (error) throw new Error(`saques chave_pix id=${id}: ${error.message}`);
      out.updates_executados.push({ tabela: 'saques', id, campo: 'chave_pix', origem: 'pix_key' });
    }
    for (const { id, tipo_chave } of sq_fill_pix_type) {
      const { error } = await supabase.from('saques').update({ pix_type: tipo_chave }).eq('id', id);
      if (error) throw new Error(`saques pix_type id=${id}: ${error.message}`);
      out.updates_executados.push({ tabela: 'saques', id, campo: 'pix_type', origem: 'tipo_chave' });
    }
    for (const { id, pix_type } of sq_fill_tipo_chave) {
      const { error } = await supabase.from('saques').update({ tipo_chave: pix_type }).eq('id', id);
      if (error) throw new Error(`saques tipo_chave id=${id}: ${error.message}`);
      out.updates_executados.push({ tabela: 'saques', id, campo: 'tipo_chave', origem: 'pix_type' });
    }
  }

  out.pos_apply = null;
  if (APPLY) {
    const pixAfter = await fetchAll(
      'pagamentos_pix',
      'id, amount, valor, payment_id, external_id'
    );
    let pp_r_null_a = 0;
    let pp_r_null_v = 0;
    let pp_r_conf = 0;
    for (const r of pixAfter) {
      const a = n(r.amount);
      const v = n(r.valor);
      const hasA = a !== null;
      const hasV = v !== null;
      if (!hasA && hasV) pp_r_null_a++;
      if (hasA && !hasV) pp_r_null_v++;
      if (hasA && hasV && !moneyEqual(a, v)) pp_r_conf++;
    }
    const saqAfter = await fetchAll(
      'saques',
      'id, amount, valor, pix_key, chave_pix, pix_type, tipo_chave'
    );
    let s_r = {
      amount_null: 0,
      valor_null: 0,
      money_conf: 0,
      pk_pix_null: 0,
      pk_ch_null: 0,
      pk_conf: 0,
      pt_pix_null: 0,
      pt_tc_null: 0,
      pt_conf: 0
    };
    for (const r of saqAfter) {
      const a = n(r.amount);
      const v = n(r.valor);
      if (a === null && v !== null) s_r.amount_null++;
      if (a !== null && v === null) s_r.valor_null++;
      if (a !== null && v !== null && !moneyEqual(a, v)) s_r.money_conf++;
      const pk = str(r.pix_key);
      const ck = str(r.chave_pix);
      if (pk === null && ck !== null) s_r.pk_pix_null++;
      if (pk !== null && ck === null) s_r.pk_ch_null++;
      if (pk !== null && ck !== null && pk !== ck) s_r.pk_conf++;
      const pt = str(r.pix_type);
      const tc = str(r.tipo_chave);
      if (pt === null && tc !== null) s_r.pt_pix_null++;
      if (pt !== null && tc === null) s_r.pt_tc_null++;
      if (pt !== null && tc !== null && pt !== tc) s_r.pt_conf++;
    }
    out.pos_apply = { pagamentos_pix: { amount_null_valor_ok: pp_r_null_a, valor_null_amount_ok: pp_r_null_v, conflitos: pp_r_conf }, saques: s_r };
  }

  const jsonPath = path.join(__dirname, '..', 'docs', 'relatorios', 'saneamento-financeiro-controlado-resultado-2026-03-28.json');
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        ...out,
        pagamentos_pix_conflitos_amostra: pp_conflict_ids.slice(0, 50),
        saques_conflitos_money_amostra: sq_money_conflicts.slice(0, 50),
        saques_conflitos_pix_key_amostra: sq_pk_conflicts.slice(0, 50),
        saques_conflitos_pix_type_amostra: sq_pt_conflicts.slice(0, 50)
      },
      null,
      2
    ),
    'utf8'
  );
  console.log('OK resultado -> docs/relatorios/saneamento-financeiro-controlado-resultado-2026-03-28.json');
  console.log(JSON.stringify({ modo: out.modo, updates: out.updates_executados.length, pp: out.pagamentos_pix, sq: out.saques }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
