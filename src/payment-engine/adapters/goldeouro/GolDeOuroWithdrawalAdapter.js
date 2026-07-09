'use strict';

const GolDeOuroWithdrawRepository = require('./GolDeOuroWithdrawRepository');
const { resolveWithdrawalIds } = require('../../compat/withdrawalIdAlias');

/**
 * Normaliza row GDO → WithdrawalRecord com withdrawalId.
 * @param {object | null} row
 * @returns {import('../../ports/WithdrawalPort').WithdrawalRecord | null}
 */
function mapWithdrawalRow(row) {
  if (!row) return null;
  const { withdrawalId } = resolveWithdrawalIds({ saqueId: row.id });
  return {
    id: String(row.id),
    withdrawalId: withdrawalId || String(row.id),
    usuario_id: row.usuario_id != null ? String(row.usuario_id) : undefined,
    status: row.status != null ? String(row.status) : undefined,
    valor: row.valor != null ? parseFloat(row.valor) : undefined,
    raw: row
  };
}

/**
 * PE.2B — adapter shadow WithdrawalPort sobre repositório P2.2 (sem alterar persistência).
 *
 * @param {object} deps
 * @param {object} deps.supabase
 * @returns {import('../../ports/WithdrawalPort').WithdrawalPort}
 */
function createGolDeOuroWithdrawalAdapter(deps = {}) {
  const { supabase } = deps;

  return {
    productId: GolDeOuroWithdrawRepository.productId,

    async findById(withdrawalId) {
      const { withdrawalId: id } = resolveWithdrawalIds({ withdrawalId, saqueId: withdrawalId });
      if (!id) {
        return { data: null, error: new Error('INVALID_WITHDRAWAL_ID') };
      }
      const result = await GolDeOuroWithdrawRepository.findById(supabase, id);
      if (result.error) {
        return { data: null, error: result.error };
      }
      return { data: mapWithdrawalRow(result.data), error: null };
    },

    async listByAccount(accountId, limit = 50) {
      const result = await GolDeOuroWithdrawRepository.listByUser(supabase, accountId, limit);
      if (result.error) {
        return { data: null, error: result.error };
      }
      const rows = Array.isArray(result.data) ? result.data.map(mapWithdrawalRow) : [];
      return { data: rows, error: null };
    }
  };
}

module.exports = {
  createGolDeOuroWithdrawalAdapter,
  mapWithdrawalRow
};
