/**
 * READ-ONLY: Composição do saldo por tabelas (depósitos, saques, prêmios, ajustes).
 * Não imprime SUPABASE_URL nem SERVICE_ROLE_KEY.
 * USER_ID: PROVA_USER_ID (obrigatório para composição; usar mesmo do monitor).
 * Janela: PROVA_JANELA_DIAS (padrão 30).
 * Saída: docs/relatorios/prova-composicao-saldo-output-YYYY-MM-DD.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROVA_USER_ID = process.env.PROVA_USER_ID ? String(process.env.PROVA_USER_ID).trim() : null;
const JANELA_DIAS = parseInt(process.env.PROVA_JANELA_DIAS || '30', 10) || 30;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes', timestamp: new Date().toISOString() }));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function getOutputPath() {
  const d = new Date();
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const D = String(d.getDate()).padStart(2, '0');
  const base = path.join(process.cwd(), 'docs', 'relatorios');
  if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true });
  return path.join(base, `prova-composicao-saldo-output-${Y}-${M}-${D}.json`);
}

async function detectLedgerUserIdColumn() {
  const r1 = await supabase.from('ledger_financeiro').select('user_id').limit(1).maybeSingle();
  if (!r1.error) return 'user_id';
  const r2 = await supabase.from('ledger_financeiro').select('usuario_id').limit(1).maybeSingle();
  if (!r2.error) return 'usuario_id';
  return null;
}

async function run() {
  const since = new Date(Date.now() - JANELA_DIAS * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  const out = {
    timestamp: new Date().toISOString(),
    user_id: PROVA_USER_ID,
    janela_dias: JANELA_DIAS,
    since: sinceIso,
    saldo_atual: null,
    componentes: {
      depositos_aprovados: 0,
      saques_concluidos: 0,
      saques_pendentes: 0,
      premios_jogo_chutes: 0,
      premios_transacoes: 0,
      premios_ledger: 0,
      ajustes_ledger: 0,
      outros_ledger: 0
    },
    soma_componentes: null,
    GAP: null,
    tabela_resumo: null,
    hipoteses_gap: [],
    erros: []
  };

  let uid = PROVA_USER_ID;
  if (!uid) {
    const { data: allApproved } = await supabase.from('pagamentos_pix').select('usuario_id, valor, amount').eq('status', 'approved');
    const { data: users } = await supabase.from('usuarios').select('id, saldo');
    if (users && users.length) {
      const pixByUser = {};
      (allApproved || []).forEach(row => { const id = row.usuario_id; pixByUser[id] = (pixByUser[id] || 0) + Number(row.amount ?? row.valor ?? 0); });
      const diffs = users.map(u => ({ id: u.id, diferenca: Number(u.saldo || 0) - (pixByUser[u.id] || 0) }));
      diffs.sort((a, b) => Math.abs(b.diferenca) - Math.abs(a.diferenca));
      uid = diffs[0].id;
    }
  }
  if (!uid) {
    out.erros.push('PROVA_USER_ID não definido e não foi possível obter usuário candidato.');
    const outPath = getOutputPath();
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    console.log('Written:', outPath);
    process.exit(0);
    return;
  }
  out.user_id = uid;

  const { data: userRow, error: eu } = await supabase.from('usuarios').select('id, saldo').eq('id', uid).maybeSingle();
  if (eu) out.erros.push({ step: 'usuarios', message: eu.message });
  else if (userRow) out.saldo_atual = Number(userRow.saldo || 0);

  const { data: pixRows } = await supabase
    .from('pagamentos_pix')
    .select('valor, amount, created_at')
    .eq('usuario_id', uid)
    .eq('status', 'approved')
    .gte('created_at', sinceIso);
  (pixRows || []).forEach(r => {
    out.componentes.depositos_aprovados += Number(r.amount ?? r.valor ?? 0);
  });

  const { data: saquesRows } = await supabase
    .from('saques')
    .select('valor, amount, status, created_at')
    .eq('usuario_id', uid)
    .gte('created_at', sinceIso);
  (saquesRows || []).forEach(r => {
    const v = Number(r.valor ?? r.amount ?? 0);
    const st = String(r.status || '').toLowerCase();
    if (st === 'processado' || st === 'concluido' || st === 'confirmado' || st === 'pago' || st === 'completed') {
      out.componentes.saques_concluidos += v;
    } else {
      out.componentes.saques_pendentes += v;
    }
  });

  const { data: chutesRows, error: ec } = await supabase
    .from('chutes')
    .select('premio, premio_gol_de_ouro, valor_aposta, created_at')
    .eq('usuario_id', uid)
    .gte('created_at', sinceIso);
  if (!ec && chutesRows) {
    chutesRows.forEach(c => {
      out.componentes.premios_jogo_chutes += Number(c.premio || 0) + Number(c.premio_gol_de_ouro || 0);
    });
  }

  const { data: transRows } = await supabase
    .from('transacoes')
    .select('valor, tipo, created_at')
    .eq('usuario_id', uid)
    .gte('created_at', sinceIso);
  (transRows || []).forEach(r => {
    const t = String(r.tipo || '').toLowerCase();
    const v = Number(r.valor || 0);
    if (v > 0 && (t.includes('premio') || t.includes('ganho') || t.includes('gol') || t.includes('win'))) {
      out.componentes.premios_transacoes += v;
    }
  });

  const ledgerCol = await detectLedgerUserIdColumn();
  if (ledgerCol) {
    const { data: ledgerRows } = await supabase
      .from('ledger_financeiro')
      .select('tipo, valor, created_at')
      .eq(ledgerCol, uid)
      .gte('created_at', sinceIso);
    (ledgerRows || []).forEach(r => {
      const v = Number(r.valor || 0);
      const t = String(r.tipo || '').toLowerCase();
      if (v <= 0) return;
      if (t.includes('premio') || t.includes('gol')) out.componentes.premios_ledger += v;
      else if (t.includes('ajuste')) out.componentes.ajustes_ledger += v;
      else out.componentes.outros_ledger += v;
    });
  }

  const soma = out.componentes.depositos_aprovados - out.componentes.saques_concluidos - out.componentes.saques_pendentes
    + out.componentes.premios_jogo_chutes + out.componentes.premios_transacoes + out.componentes.premios_ledger
    + out.componentes.ajustes_ledger + out.componentes.outros_ledger;
  out.soma_componentes = Math.round(soma * 100) / 100;
  out.GAP = out.saldo_atual != null ? Math.round((out.saldo_atual - out.soma_componentes) * 100) / 100 : null;

  out.tabela_resumo = [
    { componente: 'depositos_aprovados', valor: out.componentes.depositos_aprovados },
    { componente: 'saques_concluidos', valor: -out.componentes.saques_concluidos },
    { componente: 'saques_pendentes', valor: -out.componentes.saques_pendentes },
    { componente: 'premios_jogo_chutes', valor: out.componentes.premios_jogo_chutes },
    { componente: 'premios_transacoes', valor: out.componentes.premios_transacoes },
    { componente: 'premios_ledger', valor: out.componentes.premios_ledger },
    { componente: 'ajustes_ledger', valor: out.componentes.ajustes_ledger },
    { componente: 'outros_ledger', valor: out.componentes.outros_ledger },
    { componente: 'soma_componentes', valor: out.soma_componentes },
    { componente: 'saldo_atual', valor: out.saldo_atual },
    { componente: 'GAP', valor: out.GAP }
  ];

  if (out.GAP != null && Math.abs(out.GAP) > 0.5) {
    out.hipoteses_gap = [
      'Saldo inicial ou créditos anteriores fora da janela de ' + JANELA_DIAS + ' dias.',
      'Tabela ou rota que atualiza usuarios.saldo não auditada (ex.: outro tipo em transacoes/ledger).',
      'Ajustes manuais ou migrações históricas.',
      'Arredondamento ou múltiplas fontes de verdade (ledger vs saldo em memória).'
    ];
  }

  const outPath = getOutputPath();
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Written:', outPath);
}

run().catch(err => {
  console.log(JSON.stringify({ error: err?.message || String(err), timestamp: new Date().toISOString() }));
  process.exit(1);
});
