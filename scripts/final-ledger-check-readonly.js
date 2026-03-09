/**
 * AUDITORIA READ-ONLY: Ledger 24h, 7d e 30d — detecta user_id/usuario_id,
 * agrega por usuário, tipos, referencias, correlation_id.
 * Salva docs/relatorios/final-ledger-check.json
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

const OUT_DIR = path.join(__dirname, '..', 'docs', 'relatorios');
const JANELAS = [24, 24 * 7, 24 * 30]; // 24h, 7d, 30d

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(JSON.stringify({ error: 'SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes' }));
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  return s.length <= 4 ? '***' : '***' + s.slice(-4);
}

async function run() {
  let userCol = 'user_id';
  const { error: eUser } = await supabase.from('ledger_financeiro').select('user_id').limit(1);
  if (eUser) {
    const { error: eUsuario } = await supabase.from('ledger_financeiro').select('usuario_id').limit(1);
    if (!eUsuario) userCol = 'usuario_id';
  }

  const report = {
    timestamp: new Date().toISOString(),
    user_column: userCol,
    janelas: {},
    erros: []
  };

  for (const horas of JANELAS) {
    const since = new Date(Date.now() - horas * 60 * 60 * 1000).toISOString();
    const { data: rows, error: e1 } = await supabase
      .from('ledger_financeiro')
      .select('*')
      .gte('created_at', since);
    if (e1) {
      report.janelas[`${horas}h`] = { error: e1.message };
      continue;
    }
    const list = rows || [];
    const byUser = {};
    const byTipo = {};
    const byRef = {};
    list.forEach(r => {
      const uid = r[userCol] ?? r.usuario_id ?? r.user_id;
      if (uid != null) {
        if (!byUser[uid]) byUser[uid] = { creditos: 0, debitos: 0 };
        const val = Number(r.valor ?? r.amount ?? 0);
        if (val > 0) byUser[uid].creditos += val;
        else byUser[uid].debitos += Math.abs(val);
      }
      byTipo[r.tipo || 'unknown'] = (byTipo[r.tipo || 'unknown'] || 0) + 1;
      byRef[r.referencia || 'null'] = (byRef[r.referencia || 'null'] || 0) + 1;
    });
    report.janelas[`${horas}h`] = {
      total_registros: list.length,
      por_usuario: Object.entries(byUser).map(([uid, v]) => ({
        usuario_id: maskId(uid),
        total_creditos: v.creditos,
        total_debitos: v.debitos
      })).sort((a, b) => (b.total_creditos + b.total_debitos) - (a.total_creditos + a.total_debitos)).slice(0, 30),
      top_tipos: Object.entries(byTipo).map(([tipo, count]) => ({ tipo, count })).sort((a, b) => b.count - a.count).slice(0, 15),
      top_referencias: Object.entries(byRef).map(([ref, count]) => ({ referencia: ref, count })).sort((a, b) => b.count - a.count).slice(0, 15)
    };
  }

  const outPath = path.join(OUT_DIR, 'final-ledger-check.json');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('OK final ledger -> ' + outPath);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
