#!/usr/bin/env node
/**
 * READ-ONLY: Confirmação do trigger de saldo na tabela chutes em produção.
 * Executa apenas SELECT em pg_trigger e pg_proc. Não altera banco.
 * Uso: node scripts/confirmacao-trigger-producao-readonly.js
 * Requer: .env com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const QUERY_TRIGGERS = `
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  tgtype AS trigger_type
FROM pg_trigger
WHERE tgrelid = 'public.chutes'::regclass
  AND NOT tgisinternal;
`;

const QUERY_FUNCTION = `
SELECT
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE proname = 'update_user_stats';
`;

async function runQuery(name, sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql: sql.trim() + ';' });
  if (error) {
    return { error: error.message, data: null };
  }
  return { error: null, data };
}

function interpretTgenabled(val) {
  if (val === 'O' || val === true) return 'ENABLED';
  if (val === 'D') return 'DISABLED';
  if (val === 'R') return 'REPLICA';
  if (val === 'A') return 'ALWAYS';
  return String(val);
}

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const reportPath = path.join(__dirname, '..', 'docs', 'relatorios', `CONFIRMACAO-TRIGGER-PRODUCAO-BLOCO-D-${today}.md`);

  let triggersResult = { error: null, data: null };
  let functionResult = { error: null, data: null };

  console.log('Consultando pg_trigger (tabela chutes)...');
  triggersResult = await runQuery('triggers', QUERY_TRIGGERS);

  console.log('Consultando pg_proc (update_user_stats)...');
  functionResult = await runQuery('function', QUERY_FUNCTION);

  const triggerFound = triggersResult.data && Array.isArray(triggersResult.data) && triggersResult.data.some(r => (r.trigger_name || r.tgname) === 'trigger_update_user_stats');
  const triggerRow = triggersResult.data && Array.isArray(triggersResult.data) && triggersResult.data.find(r => (r.trigger_name || r.tgname) === 'trigger_update_user_stats');
  const funcFound = functionResult.data && Array.isArray(functionResult.data) && functionResult.data.length > 0;
  const funcBody = funcFound && functionResult.data[0] ? (functionResult.data[0].function_body || functionResult.data[0].prosrc || '') : '';

  const enabledVal = triggerRow && (triggerRow.enabled !== undefined ? triggerRow.enabled : triggerRow.tgenabled);
  const status = enabledVal != null ? interpretTgenabled(enabledVal) : 'N/A';

  let conclusion = 'saldo NÃO debitado corretamente';
  if (triggerFound && status === 'ENABLED' && funcFound) {
    conclusion = 'saldo debitado corretamente';
  } else if (!triggersResult.error && !functionResult.error && !triggerFound) {
    conclusion = 'saldo NÃO debitado corretamente (trigger trigger_update_user_stats não encontrado)';
  } else if (triggersResult.error || functionResult.error) {
    conclusion = 'não foi possível confirmar (erro na consulta ao banco)';
  }

  const lines = [];
  lines.push('# TRIGGER CHUTES PRODUÇÃO');
  lines.push('');
  lines.push(`**Data:** ${today}`);
  lines.push('');
  lines.push('## Resultado');
  lines.push('');
  lines.push('| Item | Valor |');
  lines.push('|------|--------|');
  lines.push(`| **Trigger encontrado** | ${triggerFound ? 'SIM' : 'NÃO'} |`);
  lines.push(`| **Nome** | ${triggerFound ? 'trigger_update_user_stats' : '—'} |`);
  lines.push(`| **Função associada** | ${funcFound ? 'update_user_stats' : 'não encontrada'} |`);
  lines.push(`| **Evento** | AFTER INSERT ON chutes (esperado) |`);
  lines.push(`| **Status** | ${status} |`);
  lines.push('');
  lines.push('## SQL da função');
  lines.push('');
  if (funcBody) {
    lines.push('```sql');
    lines.push(funcBody.slice(0, 2000) + (funcBody.length > 2000 ? '\n-- (truncado)' : ''));
    lines.push('```');
  } else {
    lines.push('*(não disponível ou RPC não retornou prosrc)*');
  }
  lines.push('');
  lines.push('## Dados brutos (triggers)');
  lines.push('');
  if (triggersResult.error) {
    lines.push('Erro: `' + triggersResult.error + '`');
  } else {
    lines.push('```json');
    lines.push(JSON.stringify(triggersResult.data, null, 2));
    lines.push('```');
  }
  lines.push('');
  lines.push('## Conclusão');
  lines.push('');
  lines.push('- **' + conclusion + '**');
  lines.push('');

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, lines.join('\n'), 'utf8');
  console.log('Relatório gravado:', reportPath);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
