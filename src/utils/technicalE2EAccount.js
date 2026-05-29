/**
 * Identifica contas técnicas E2E/homologação para exclusão de indicadores executivos.
 * Não altera saldo, histórico nem operação — apenas classificação read-only em agregações admin.
 * Baseado nas auditorias H4.1A → H4.1C.2.
 */

/** Conta outlier documentada (H4.1C.1) — homologação ponta-a-ponta. */
const KNOWN_TECHNICAL_USER_IDS = new Set([
  '85872488-9e4c-42df-8978-7f9ef9f5cb00'
]);

/**
 * @param {{ id?: string, email?: string, username?: string } | null | undefined} user
 * @returns {boolean}
 */
function isTechnicalE2EAccount(user) {
  if (!user) return false;

  const id = String(user.id || '').trim().toLowerCase();
  if (id && KNOWN_TECHNICAL_USER_IDS.has(id)) return true;

  const email = String(user.email || '').trim().toLowerCase();
  if (email.includes('validacao')) return true;
  if (email.includes('e2e')) return true;

  const username = String(user.username || '').trim().toLowerCase();
  if (username.startsWith('vale2e')) return true;

  return false;
}

module.exports = {
  isTechnicalE2EAccount,
  KNOWN_TECHNICAL_USER_IDS
};
