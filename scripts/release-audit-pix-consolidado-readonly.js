/**
 * MAX SAFETY RELEASE AUDIT — Consolidado (lê JSONs das fases 1 e 2, gera relatório final).
 * Somente leitura de arquivos e escrita do relatório Markdown. Não consulta banco.
 */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'docs', 'relatorios', 'RELEASE-AUDIT');
const finalReportPath = path.join(outDir, 'RELATORIO-FINAL-RELEASE-AUDIT-PIX-2026-02-05.md');

function findLatestJson(prefix) {
  if (!fs.existsSync(outDir)) return null;
  const files = fs.readdirSync(outDir).filter(f => f.startsWith(prefix) && f.endsWith('.json'));
  if (files.length === 0) return null;
  files.sort().reverse();
  return path.join(outDir, files[0]);
}

function loadJson(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function run() {
  const depositosPath = findLatestJson('release-audit-depositos-');
  const saquesPath = findLatestJson('release-audit-saques-');
  const dep = loadJson(depositosPath);
  const saq = loadJson(saquesPath);

  let gate1 = true;
  let gate2 = true;
  let gate3 = true;
  let gate4 = true;
  let gate5 = true;

  if (dep) {
    const pidApproved = dep.duplicidade?.payment_id_approved ?? 0;
    const extApproved = dep.duplicidade?.external_id_approved ?? 0;
    gate1 = pidApproved === 0;
    gate2 = extApproved === 0;
    const q = dep.qualidade || {};
    const invalidos = (q.amount_valor_nulo || 0) + (q.valor_menor_igual_zero || 0);
    gate5 = invalidos === 0;
  }
  if (saq) {
    gate3 = (saq.saldos_negativos?.count ?? 0) === 0;
    gate4 = (saq.lastro?.usuarios_saque_maior_pix?.length ?? 0) === 0;
  }

  const depStatus = classifyDepositos(dep);
  const saqStatus = classifySaques(saq);
  const lastroStatus = gate4 ? '🟢' : '🔴';
  const pendingsStatus = classifyPendings(dep);

  let veredito = 'GO';
  if (!gate1 || !gate2 || !gate3 || !gate4) veredito = 'NO-GO';
  else if (!gate5 || depStatus === '🟡' || saqStatus === '🟡' || pendingsStatus === '🟡') veredito = 'GO COM RESSALVAS';

  const md = buildFinalReport({
    dep,
    saq,
    depositosPath,
    saquesPath,
    gate1,
    gate2,
    gate3,
    gate4,
    gate5,
    depStatus,
    saqStatus,
    lastroStatus,
    pendingsStatus,
    veredito
  });

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(finalReportPath, md, 'utf8');
  console.log('[RELEASE-AUDIT][CONSOLIDADO] Relatório final:', finalReportPath);
}

function classifyDepositos(dep) {
  if (!dep) return '🟡';
  const pidApproved = dep.duplicidade?.payment_id_approved ?? 0;
  const extApproved = dep.duplicidade?.external_id_approved ?? 0;
  if (pidApproved > 0 || extApproved > 0) return '🔴';
  const q = dep.qualidade || {};
  if ((q.amount_valor_nulo || 0) + (q.valor_menor_igual_zero || 0) > 0) return '🟡';
  return '🟢';
}

function classifySaques(saq) {
  if (!saq) return '🟡';
  if ((saq.saldos_negativos?.count ?? 0) > 0) return '🔴';
  if ((saq.lastro?.usuarios_saque_maior_pix?.length ?? 0) > 0) return '🔴';
  if ((saq.ledger?.duplicidade?.length ?? 0) > 0) return '🟡';
  return '🟢';
}

function classifyPendings(dep) {
  if (!dep || !dep.pendings) return '🟢';
  const total = dep.pendings.total ?? 0;
  const old = (dep.pendings.faixas?.['31+d'] ?? 0) + (dep.pendings.faixas?.['8-30d'] ?? 0);
  if (total > 50 || old > 20) return '🟡';
  return '🟢';
}

function buildFinalReport(opts) {
  const { dep, saq, gate1, gate2, gate3, gate4, gate5, depStatus, saqStatus, lastroStatus, pendingsStatus, veredito } = opts;
  let s = '# RELATÓRIO FINAL — RELEASE AUDIT PIX (READ-ONLY)\n\n';
  s += '**Data:** 2026-02-05\n';
  s += '**Sistema:** Gol de Ouro · Produção real\n';
  s += '**Modo:** MAX SAFETY · READ-ONLY ABSOLUTO\n\n';
  s += '---\n\n';
  s += '## 1. Regras de segurança aplicadas\n\n';
  s += '- **Proibido:** INSERT/UPDATE/DELETE/UPSERT/RPC, triggers, migrations, deploy, reenviar webhooks, criar PIX, solicitar saque, rodar worker, chamar rollback, chamar endpoints POST.\n';
  s += '- **Permitido:** Leitura de arquivos, SELECT via Supabase, GET no Mercado Pago para consulta, geração de scripts e relatórios, backup local.\n';
  s += '- **Segredos:** Tokens/URLs não impressos; variáveis logadas como PRESENTE/AUSENTE e valores mascarados.\n\n';
  s += '---\n\n';
  s += '## 2. Evidências empíricas (fontes)\n\n';
  s += '- Depósitos: JSON gerado por `release-audit-pix-depositos-readonly.js`\n';
  s += '- Saques: JSON gerado por `release-audit-pix-saques-readonly.js`\n\n';

  if (dep) {
    s += '### 2.1 Depósitos PIX\n\n';
    s += '| status | count |\n|--------|-------|\n';
    (dep.contagem_por_status || []).forEach(x => { s += `| ${x.status} | ${x.count} |\n`; });
    s += `\n- payment_id duplicado em approved: ${dep.duplicidade?.payment_id_approved ?? 0}\n`;
    s += `- external_id com >1 approved: ${dep.duplicidade?.external_id_approved ?? 0}\n`;
    s += `- Pendings total: ${dep.pendings?.total ?? 0} (0-1d: ${dep.pendings?.faixas?.['0-1d'] ?? 0}, 2-7d: ${dep.pendings?.faixas?.['2-7d'] ?? 0}, 8-30d: ${dep.pendings?.faixas?.['8-30d'] ?? 0}, 31+d: ${dep.pendings?.faixas?.['31+d'] ?? 0})\n`;
    s += `- Valores nulos: ${dep.qualidade?.amount_valor_nulo ?? 0}, <=0: ${dep.qualidade?.valor_menor_igual_zero ?? 0}, >10000: ${dep.qualidade?.valor_acima_10000 ?? 0}\n\n`;
  }

  if (saq) {
    s += '### 2.2 Saques PIX\n\n';
    s += '| status | count |\n|--------|-------|\n';
    (saq.saques_por_status || []).forEach(x => { s += `| ${x.status} | ${x.count} |\n`; });
    s += `\n- Saldos negativos: ${saq.saldos_negativos?.count ?? 0}\n`;
    s += `- Lastro (saques_confirmados > pix_approved): ${(saq.lastro?.usuarios_saque_maior_pix?.length ?? 0) === 0 ? '0 (OK)' : saq.lastro.usuarios_saque_maior_pix.length + ' (ALERTA)'}\n\n`;
  }

  s += '---\n\n';
  s += '## 3. Classificação por área\n\n';
  s += '| Área | Classificação |\n|------|----------------|\n';
  s += `| Depósitos | ${depStatus} |\n`;
  s += `| Saques | ${saqStatus} |\n`;
  s += `| Lastro | ${lastroStatus} |\n`;
  s += `| Pendings antigos | ${pendingsStatus} |\n\n`;
  s += '---\n\n';
  s += '## 4. Gates de lançamento\n\n';
  s += '| Gate | Condição | Resultado |\n|------|----------|----------|\n';
  s += `| GATE 1 | payment_id duplicado em approved = 0 | ${gate1 ? '✅ 0' : '❌ >0'} |\n`;
  s += `| GATE 2 | external_id com >1 approved = 0 | ${gate2 ? '✅ 0' : '❌ >0'} |\n`;
  s += `| GATE 3 | usuarios.saldo < 0 = 0 | ${gate3 ? '✅ 0' : '❌ >0'} |\n`;
  s += `| GATE 4 | saques_confirmados > pix_approved = 0 | ${gate4 ? '✅ 0' : '❌ >0'} |\n`;
  s += `| GATE 5 | Valores inválidos (nulos/<=0) em dados = 0 | ${gate5 ? '✅ 0' : '⚠️ >0'} |\n\n`;
  s += '---\n\n';
  s += '## 5. Veredito final\n\n';
  s += `**${veredito}**\n\n`;
  s += '- **GO:** Todos os gates passaram e classificações 🟢.\n';
  s += '- **GO COM RESSALVAS:** Gates 1–4 passaram; pode haver 🟡 (pendings, qualidade) ou GATE 5 com valor inválido.\n';
  s += '- **NO-GO:** Algum gate 1–4 falhou (duplicidade approved, saldo negativo, lastro).\n\n';
  s += 'Nenhuma correção sugerida; apenas fatos e veredito.\n';
  return s;
}

run();
