/**
 * Contrato PIX IN (PaymentProvider) — F4.0E-S1.
 * Implementação ativa prevista para fatia S2+; apenas tipos JSDoc nesta fatia.
 *
 * @typedef {Object} PixDepositCreateInput
 * @property {number} amount
 * @property {string} userId
 * @property {string} userEmail
 * @property {string} [userName]
 * @property {string} [payerCpf]
 * @property {string} idempotencyKey
 * @property {string} notificationUrl
 */

/**
 * @typedef {Object} PixDepositCreateResult
 * @property {boolean} success
 * @property {string} [providerRef]
 * @property {string} [qrCode]
 * @property {string} [qrCodeBase64]
 * @property {string} [copyPaste]
 * @property {string} [status]
 * @property {string} [error]
 */

/**
 * @typedef {Object} PaymentProvider
 * @property {string} name
 * @property {() => boolean} isConfigured
 * @property {(input: PixDepositCreateInput) => Promise<PixDepositCreateResult>} createPixDeposit
 * @property {(providerRef: string) => Promise<{ success: boolean, status?: string, statusDetail?: string, amount?: number, error?: string }>} getPixDepositStatus
 * @property {(req: import('express').Request) => Promise<{ valid: boolean, error?: string, providerRef?: string }>} handleDepositWebhook
 */

module.exports = {};
