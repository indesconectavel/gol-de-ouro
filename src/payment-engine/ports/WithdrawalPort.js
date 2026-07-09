'use strict';

/**
 * PE.2B — port de persistência de withdrawal (evolução WithdrawRepository).
 *
 * @typedef {Object} WithdrawalRecord
 * @property {string} id
 * @property {string} withdrawalId
 * @property {string} [usuario_id]
 * @property {string} [status]
 * @property {number} [valor]
 * @property {Record<string, unknown>} [raw]
 */

/**
 * @typedef {Object} WithdrawalPort
 * @property {string} productId
 * @property {(withdrawalId: string) => Promise<{ data: WithdrawalRecord | null, error: object | null }>} findById
 * @property {(accountId: string, limit?: number) => Promise<{ data: WithdrawalRecord[] | null, error: object | null }>} listByAccount
 */

module.exports = {};
