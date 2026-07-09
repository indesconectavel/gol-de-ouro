'use strict';

/**
 * PE.2B — normalização withdrawalId ↔ saqueId (compatibilidade sem alterar payloads produtivos).
 *
 * @param {object} input
 * @returns {{ withdrawalId: string | null, saqueId: string | null }}
 */
function resolveWithdrawalIds(input = {}) {
  const withdrawalId =
    input.withdrawalId != null && String(input.withdrawalId).trim() !== ''
      ? String(input.withdrawalId).trim()
      : input.saqueId != null && String(input.saqueId).trim() !== ''
        ? String(input.saqueId).trim()
        : null;

  return {
    withdrawalId,
    saqueId: withdrawalId
  };
}

/**
 * Injeta ambos os campos para callers legados e novos.
 * @param {object} input
 * @returns {object}
 */
function withWithdrawalIdAliases(input = {}) {
  const { withdrawalId, saqueId } = resolveWithdrawalIds(input);
  return {
    ...input,
    ...(withdrawalId ? { withdrawalId, saqueId } : {})
  };
}

module.exports = {
  resolveWithdrawalIds,
  withWithdrawalIdAliases
};
