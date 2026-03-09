/**
 * Detector de divergência entre usuarios.saldo e soma dos valores em ledger_financeiro.
 * SOMENTE LEITURA — não altera saldo, ledger nem executa retries.
 * Uso: auditoria e monitoramento de consistência.
 */

/**
 * Detecta qual coluna de usuário existe em ledger_financeiro (user_id ou usuario_id).
 * @param {object} supabase
 * @returns {Promise<string|null>} 'user_id' | 'usuario_id' | null
 */
async function getLedgerUserColumn(supabase) {
  const { error: e1 } = await supabase.from('ledger_financeiro').select('user_id').limit(1).maybeSingle();
  if (!e1) return 'user_id';
  const { error: e2 } = await supabase.from('ledger_financeiro').select('usuario_id').limit(1).maybeSingle();
  if (!e2) return 'usuario_id';
  return null;
}

/**
 * Detecta divergências entre saldo em usuarios e soma de valor em ledger_financeiro.
 * Equivalente lógico à query:
 *   WITH ledger_soma AS (SELECT user_id, SUM(valor) AS soma FROM ledger_financeiro GROUP BY user_id)
 *   SELECT u.id, u.saldo, COALESCE(l.soma,0) AS ledger_sum, (u.saldo - COALESCE(l.soma,0)) AS diff
 *   FROM usuarios u LEFT JOIN ledger_soma l ON l.user_id = u.id
 *   WHERE u.saldo IS DISTINCT FROM COALESCE(l.soma,0)
 *
 * @param {{ supabase: object }} opts
 * @returns {Promise<{ totalUsersChecked: number, mismatches: Array<{ userId: string, saldo: number, ledgerSum: number, diff: number }> }>}
 */
async function detectBalanceLedgerMismatch({ supabase }) {
  const result = { totalUsersChecked: 0, mismatches: [] };

  if (!supabase) {
    return result;
  }

  try {
    const userCol = await getLedgerUserColumn(supabase);
    if (!userCol) {
      return result;
    }

    const { data: usuarios, error: errUsuarios } = await supabase
      .from('usuarios')
      .select('id, saldo');

    if (errUsuarios) {
      console.error('[LEDGER-AUDIT] Erro ao listar usuarios:', errUsuarios.message);
      return result;
    }

    const { data: ledgerRows, error: errLedger } = await supabase
      .from('ledger_financeiro')
      .select(`${userCol}, valor`);

    if (errLedger) {
      console.error('[LEDGER-AUDIT] Erro ao listar ledger:', errLedger.message);
      result.totalUsersChecked = (usuarios || []).length;
      return result;
    }

    const ledgerSumByUser = new Map();
    for (const row of ledgerRows || []) {
      const uid = row[userCol];
      if (uid == null) continue;
      const key = String(uid);
      const prev = ledgerSumByUser.get(key) || 0;
      ledgerSumByUser.set(key, prev + Number(row.valor || 0));
    }

    const list = usuarios || [];
    result.totalUsersChecked = list.length;

    for (const u of list) {
      const saldo = Number(u.saldo ?? 0);
      const ledgerSum = ledgerSumByUser.get(String(u.id)) ?? 0;
      if (saldo !== ledgerSum) {
        result.mismatches.push({
          userId: String(u.id),
          saldo,
          ledgerSum,
          diff: saldo - ledgerSum
        });
      }
    }

    console.log('[LEDGER-AUDIT] usuários verificados:', result.totalUsersChecked);
    console.log('[LEDGER-AUDIT] divergências encontradas:', result.mismatches.length);
  } catch (err) {
    console.error('[LEDGER-AUDIT] Erro inesperado:', err);
  }

  return result;
}

module.exports = {
  detectBalanceLedgerMismatch,
  getLedgerUserColumn
};
