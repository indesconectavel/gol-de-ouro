/**
 * MAX SAFETY RELEASE AUDIT — PIX Saques — READ-ONLY.
 * Apenas SELECT no Supabase. Sem PII nos logs. Sem impressão de segredos.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function envStatus(name) {
  const v = process.env[name];
  return v != null && String(v).trim() !== '' ? 'PRESENTE' : 'AUSENTE';
}

function maskId(id) {
  if (id == null) return null;
  const s = String(id);
  if (s.length <= 6) return 'u_' + s;
  return 'u_' + s.slice(-6);
}

function maskUuid(uuid, len = 8) {
  if (uuid == null) return null;
  const s = String(uuid);
  return s.length <= len ? s : s.slice(0, len) + '…';
}

const STATUS_CONFIRMADO = ['processado', 'concluido', 'confirmado', 'paid', 'success', 'completed', 'pago'];
const STATUS_NAO_FINAL = ['pendente', 'pending', 'processando', 'aguardando_confirmacao', 'aguardando', 'em_processamento', 'processing'];

const outDir = path.join(__dirname, '..', 'docs', 'relatorios', 'RELEASE-AUDIT');
const ts = new Date();
const tsStr = ts.toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(ts.getHours()).padStart(2, '0') + String(ts.getMinutes()).padStart(2, '0');

const report = {
  timestamp: ts.toISOString(),
  env: { SUPABASE_URL: envStatus('SUPABASE_URL'), SUPABASE_SERVICE_ROLE_KEY: envStatus('SUPABASE_SERVICE_ROLE_KEY') },
  saques_por_status: [],
  saques_nao_final_antigos: { total: 0, top30: [] },
  saldos_negativos: { count: 0, top20: [] },
  ledger: { por_tipo: [], duplicidade: [] },
  lastro: { alertas: [], usuarios_saque_maior_pix: [], ok: true },
  erros: []
};

async function run() {
  if (envStatus('SUPABASE_URL') !== 'PRESENTE' || envStatus('SUPABASE_SERVICE_ROLE_KEY') !== 'PRESENTE') {
    report.erros.push('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes');
    writeOutputs();
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    const { data: saquesRows, error: eS } = await supabase.from('saques').select('id, usuario_id, status, valor, amount, created_at');
    if (eS) report.erros.push({ step: 'saques', msg: eS.message });
    const saques = saquesRows || [];

    const byStatus = {};
    saques.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
    report.saques_por_status = Object.entries(byStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

    const statusSet = new Set(STATUS_NAO_FINAL.map(s => s.toLowerCase()));
    const naoFinal = saques.filter(s => statusSet.has(String(s.status || '').toLowerCase()));
    naoFinal.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    report.saques_nao_final_antigos.total = naoFinal.length;
    report.saques_nao_final_antigos.top30 = naoFinal.slice(0, 30).map(r => ({
      id: maskUuid(r.id), usuario_id: maskId(r.usuario_id), status: r.status, valor: r.valor ?? r.amount, created_at: r.created_at
    }));

    const { data: users, error: eU } = await supabase.from('usuarios').select('id, saldo');
    if (eU) report.erros.push({ step: 'usuarios', msg: eU.message });
    const negativos = (users || []).filter(u => Number(u.saldo) < 0);
    report.saldos_negativos.count = negativos.length;
    report.saldos_negativos.top20 = negativos.slice(0, 20).map(u => ({ id: maskId(u.id), saldo: u.saldo }));

    let ledgerRows = [];
    try {
      const { data: ledger, error: eL } = await supabase.from('ledger_financeiro').select('tipo, correlation_id, referencia');
      if (!eL && ledger) ledgerRows = ledger;
    } catch (_) {}
    const byTipo = {};
    ledgerRows.forEach(r => { byTipo[r.tipo] = (byTipo[r.tipo] || 0) + 1; });
    report.ledger.por_tipo = Object.entries(byTipo).map(([tipo, count]) => ({ tipo, count })).sort((a, b) => b.count - a.count);
    const keyCount = {};
    ledgerRows.forEach(r => {
      const key = `${r.correlation_id}|${r.tipo}|${r.referencia}`;
      keyCount[key] = (keyCount[key] || 0) + 1;
    });
    report.ledger.duplicidade = Object.entries(keyCount).filter(([, c]) => c > 1).map(([key, c]) => ({ key: key.length > 60 ? key.slice(0, 60) + '…' : key, count: c }));

    const { data: pixRows } = await supabase.from('pagamentos_pix').select('usuario_id, valor, amount, status');
    const pixList = pixRows || [];
    const pixByUser = {};
    pixList.filter(p => String(p.status || '').toLowerCase() === 'approved').forEach(p => {
      const uid = p.usuario_id;
      if (!uid) return;
      const v = Number(p.valor ?? p.amount) || 0;
      pixByUser[uid] = (pixByUser[uid] || 0) + v;
    });

    const confirmadoSet = new Set(STATUS_CONFIRMADO.map(s => s.toLowerCase()));
    const saquesConfirmadosByUser = {};
    saques.forEach(s => {
      if (!confirmadoSet.has(String(s.status || '').toLowerCase())) return;
      const uid = s.usuario_id;
      const v = Number(s.valor ?? s.amount) || 0;
      saquesConfirmadosByUser[uid] = (saquesConfirmadosByUser[uid] || 0) + v;
    });

    const semLastro = [];
    Object.entries(saquesConfirmadosByUser).forEach(([uid, totalSaque]) => {
      const totalPix = pixByUser[uid] || 0;
      if (totalSaque > totalPix) {
        semLastro.push({ usuario_id: maskId(uid), saques_confirmados: totalSaque, pix_approved: totalPix });
        report.lastro.ok = false;
      }
    });
    report.lastro.usuarios_saque_maior_pix = semLastro;
    if (semLastro.length) report.lastro.alertas.push('ALERTA: saques_confirmados > pix_approved para algum usuário');
  } catch (err) {
    report.erros.push({ step: 'run', msg: err.message });
  }

  writeOutputs();
}

function writeOutputs() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, `release-audit-saques-${tsStr}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('[RELEASE-AUDIT][SAQUES] JSON:', jsonPath);

  const mdPath = path.join(outDir, 'RELATORIO-RELEASE-AUDIT-PIX-SAQUES.md');
  const md = buildMarkdown();
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log('[RELEASE-AUDIT][SAQUES] Markdown:', mdPath);
}

function buildMarkdown() {
  const r = report;
  let s = '# Relatório Release Audit — PIX Saques (READ-ONLY)\n\n';
  s += `**Data:** ${r.timestamp}\n\n`;
  s += '## 1. Saques por status\n\n| status | count |\n|--------|-------|\n';
  (r.saques_por_status || []).forEach(x => { s += `| ${x.status} | ${x.count} |\n`; });
  s += '\n## 2. Saques não-final antigos\n\n';
  s += `Total: ${r.saques_nao_final_antigos?.total ?? 0}\n\n`;
  s += '## 3. Saldos negativos\n\n';
  s += `Count: ${r.saldos_negativos?.count ?? 0}\n\n`;
  s += '## 4. Ledger por tipo\n\n';
  (r.ledger?.por_tipo || []).forEach(x => { s += `- ${x.tipo}: ${x.count}\n`; });
  s += '\n## 5. Lastro (saques_confirmados vs pix_approved)\n\n';
  s += (r.lastro?.ok ? 'OK: nenhum usuário com saques_confirmados > pix_approved.\n' : 'ALERTA: ' + (r.lastro?.usuarios_saque_maior_pix?.length || 0) + ' usuário(s) com saque > PIX.\n');
  if ((r.lastro?.usuarios_saque_maior_pix || []).length) {
    r.lastro.usuarios_saque_maior_pix.forEach(x => {
      s += `- ${x.usuario_id}: saques=${x.saques_confirmados}, pix=${x.pix_approved}\n`;
    });
  }
  if ((r.erros || []).length) s += '\n## Erros\n\n' + r.erros.map(e => typeof e === 'object' ? JSON.stringify(e) : e).join('\n');
  return s;
}

run().catch(err => {
  report.erros.push({ msg: err.message });
  writeOutputs();
  process.exit(1);
});
