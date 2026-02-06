/**
 * MAX SAFETY RELEASE AUDIT — PIX Depósitos — READ-ONLY.
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

function truncId(id, maxLen = 12) {
  if (id == null) return null;
  const s = String(id);
  return s.length <= maxLen ? s : s.slice(0, maxLen) + '…';
}

function ageDays(createdAt) {
  if (!createdAt) return null;
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000));
}

const outDir = path.join(__dirname, '..', 'docs', 'relatorios', 'RELEASE-AUDIT');
const ts = new Date();
const tsStr = ts.toISOString().slice(0, 10).replace(/-/g, '') + '-' + String(ts.getHours()).padStart(2, '0') + String(ts.getMinutes()).padStart(2, '0');

const report = {
  timestamp: ts.toISOString(),
  env: { SUPABASE_URL: envStatus('SUPABASE_URL'), SUPABASE_SERVICE_ROLE_KEY: envStatus('SUPABASE_SERVICE_ROLE_KEY') },
  contagem_por_status: [],
  duplicidade: { payment_id_total: 0, payment_id_approved: 0, external_id_total: 0, external_id_approved: 0, detalhe_payment_id: [], detalhe_external_id: [] },
  qualidade: { amount_valor_nulo: 0, valor_menor_igual_zero: 0, valor_acima_10000: 0, amostras_invalidas: [] },
  pendings: { total: 0, faixas: { '0-1d': 0, '2-7d': 0, '8-30d': 0, '31+d': 0 }, top30: [] },
  approved_recentes: { top30: [] },
  cruzamento_approved_usuarios: [],
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
    const { data: allRows, error: eAll } = await supabase.from('pagamentos_pix').select('id, usuario_id, status, amount, valor, payment_id, external_id, created_at');
    if (eAll) {
      report.erros.push({ step: 'select_all', msg: eAll.message });
      writeOutputs();
      return;
    }
    const rows = allRows || [];

    const byStatus = {};
    rows.forEach(r => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
    report.contagem_por_status = Object.entries(byStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count);

    const byPid = {};
    const byPidApproved = {};
    const byExt = {};
    const byExtApproved = {};
    rows.forEach(r => {
      const pid = r.payment_id != null ? String(r.payment_id) : null;
      const ext = r.external_id != null ? String(r.external_id) : null;
      const approved = String(r.status || '').toLowerCase() === 'approved';
      if (pid) { byPid[pid] = (byPid[pid] || 0) + 1; if (approved) byPidApproved[pid] = (byPidApproved[pid] || 0) + 1; }
      if (ext) { byExt[ext] = (byExt[ext] || 0) + 1; if (approved) byExtApproved[ext] = (byExtApproved[ext] || 0) + 1; }
    });
    report.duplicidade.payment_id_total = Object.values(byPid).filter(c => c > 1).length;
    report.duplicidade.payment_id_approved = Object.entries(byPidApproved).filter(([, c]) => c > 1).length;
    report.duplicidade.external_id_total = Object.values(byExt).filter(c => c > 1).length;
    report.duplicidade.external_id_approved = Object.entries(byExtApproved).filter(([, c]) => c > 1).length;
    report.duplicidade.detalhe_payment_id = Object.entries(byPid).filter(([, c]) => c > 1).map(([k, c]) => ({ payment_id: truncId(k), count: c })).slice(0, 20);
    report.duplicidade.detalhe_external_id = Object.entries(byExt).filter(([, c]) => c > 1).map(([k, c]) => ({ external_id: truncId(k), count: c })).slice(0, 20);

    const valorNull = rows.filter(r => (r.amount == null && r.valor == null));
    const valorLeZero = rows.filter(r => { const v = Number(r.amount ?? r.valor); return !Number.isNaN(v) && v <= 0; });
    const valorAlto = rows.filter(r => { const v = Number(r.amount ?? r.valor); return !Number.isNaN(v) && v > 10000; });
    report.qualidade.amount_valor_nulo = valorNull.length;
    report.qualidade.valor_menor_igual_zero = valorLeZero.length;
    report.qualidade.valor_acima_10000 = valorAlto.length;
    report.qualidade.amostras_invalidas = [...valorNull, ...valorLeZero, ...valorAlto].slice(0, 30).map(r => ({
      id: maskUuid(r.id), usuario_id: maskId(r.usuario_id), status: r.status, valor: r.valor ?? r.amount
    }));

    const pendings = rows.filter(r => String(r.status || '').toLowerCase() === 'pending');
    report.pendings.total = pendings.length;
    pendings.forEach(r => {
      const d = ageDays(r.created_at);
      if (d == null) return;
      if (d <= 1) report.pendings.faixas['0-1d']++;
      else if (d <= 7) report.pendings.faixas['2-7d']++;
      else if (d <= 30) report.pendings.faixas['8-30d']++;
      else report.pendings.faixas['31+d']++;
    });
    pendings.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    report.pendings.top30 = pendings.slice(0, 30).map(r => ({
      id: maskUuid(r.id), usuario_id: maskId(r.usuario_id), created_at: r.created_at, valor: r.valor ?? r.amount,
      payment_id: truncId(r.payment_id), external_id: truncId(r.external_id)
    }));

    const approved = rows.filter(r => String(r.status || '').toLowerCase() === 'approved');
    approved.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    report.approved_recentes.top30 = approved.slice(0, 30).map(r => ({
      id: maskUuid(r.id), usuario_id: maskId(r.usuario_id), created_at: r.created_at, valor: r.valor ?? r.amount, payment_id: truncId(r.payment_id)
    }));

    const byUser = {};
    approved.forEach(r => {
      const uid = r.usuario_id;
      if (!uid) return;
      const v = Number(r.valor ?? r.amount) || 0;
      if (!byUser[uid]) byUser[uid] = { soma_pix_approved: 0, qtd_pix_approved: 0 };
      byUser[uid].soma_pix_approved += v;
      byUser[uid].qtd_pix_approved += 1;
    });
    report.cruzamento_approved_usuarios = Object.entries(byUser).map(([uid, o]) => ({
      usuario_id: maskId(uid), soma_pix_approved: o.soma_pix_approved, qtd_pix_approved: o.qtd_pix_approved
    }));
  } catch (err) {
    report.erros.push({ step: 'run', msg: err.message });
  }

  writeOutputs();
}

function writeOutputs() {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const jsonPath = path.join(outDir, `release-audit-depositos-${tsStr}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('[RELEASE-AUDIT][DEPOSITOS] JSON:', jsonPath);

  const mdPath = path.join(outDir, 'RELATORIO-RELEASE-AUDIT-PIX-DEPOSITOS.md');
  const md = buildMarkdown();
  fs.writeFileSync(mdPath, md, 'utf8');
  console.log('[RELEASE-AUDIT][DEPOSITOS] Markdown:', mdPath);
}

function buildMarkdown() {
  const r = report;
  let s = '# Relatório Release Audit — PIX Depósitos (READ-ONLY)\n\n';
  s += `**Data:** ${r.timestamp}\n\n`;
  s += '## 1. Contagem por status\n\n| status | count |\n|--------|-------|\n';
  (r.contagem_por_status || []).forEach(x => { s += `| ${x.status} | ${x.count} |\n`; });
  s += '\n## 2. Duplicidade\n\n';
  s += `- payment_id duplicado (total): ${r.duplicidade?.payment_id_total ?? 0}\n`;
  s += `- payment_id duplicado em approved: ${r.duplicidade?.payment_id_approved ?? 0}\n`;
  s += `- external_id duplicado (total): ${r.duplicidade?.external_id_total ?? 0}\n`;
  s += `- external_id com >1 approved: ${r.duplicidade?.external_id_approved ?? 0}\n\n`;
  s += '## 3. Qualidade\n\n';
  s += `- amount/valor nulo: ${r.qualidade?.amount_valor_nulo ?? 0}\n`;
  s += `- valor <= 0: ${r.qualidade?.valor_menor_igual_zero ?? 0}\n`;
  s += `- valor > 10000: ${r.qualidade?.valor_acima_10000 ?? 0}\n\n`;
  s += '## 4. Pendings antigos\n\n';
  s += `Total pending: ${r.pendings?.total ?? 0}\n`;
  s += `Faixas: 0-1d=${r.pendings?.faixas?.['0-1d'] ?? 0}, 2-7d=${r.pendings?.faixas?.['2-7d'] ?? 0}, 8-30d=${r.pendings?.faixas?.['8-30d'] ?? 0}, 31+d=${r.pendings?.faixas?.['31+d'] ?? 0}\n\n`;
  s += '## 5. Cruzamento approved por usuario_id\n\n';
  s += '| usuario_id (mascarado) | soma_pix_approved | qtd_pix_approved |\n|--------------------------|-------------------|------------------|\n';
  (r.cruzamento_approved_usuarios || []).slice(0, 50).forEach(x => {
    s += `| ${x.usuario_id} | ${x.soma_pix_approved} | ${x.qtd_pix_approved} |\n`;
  });
  if ((r.erros || []).length) s += '\n## Erros\n\n' + r.erros.map(e => typeof e === 'object' ? JSON.stringify(e) : e).join('\n');
  return s;
}

run().catch(err => {
  report.erros.push({ msg: err.message });
  writeOutputs();
  process.exit(1);
});
