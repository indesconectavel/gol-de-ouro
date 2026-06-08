/**
 * Contrato PIX OUT (PayoutProvider) — F4.0E-S1.
 *
 * @typedef {Object} PixPayoutRequestInput
 * @property {number} netAmount
 * @property {string} pixKey
 * @property {string} pixType
 * @property {string} userId
 * @property {string} saqueId
 * @property {string} correlationId
 * @property {string} payoutExternalReference
 * @property {string} idempotencyKey
 * @property {string} [notificationUrl]
 * @property {{ type: 'CPF'|'CNPJ', number: string }} ownerIdentification
 */

/**
 * @typedef {Object} PixPayoutRequestResult
 * @property {boolean} success
 * @property {object} [data]
 * @property {string} [data.id]
 * @property {string} [data.status]
 * @property {string} [data.status_detail]
 * @property {string} [data.external_reference]
 * @property {object} [data.sanitized]
 * @property {string} [error]
 */

/**
 * @typedef {Object} PayoutProvider
 * @property {string} name
 * @property {() => boolean} isConfigured
 * @property {(input: PixPayoutRequestInput) => Promise<PixPayoutRequestResult>} requestPixPayout
 * @property {(providerRef: string) => Promise<{ success: boolean, data?: object, error?: string }>} getPayoutStatus
 * @property {(req: import('express').Request) => Promise<{ valid: boolean, error?: string, externalReference?: string, status?: string, statusDetail?: string, providerRef?: string }>} handlePayoutWebhook
 */

module.exports = {};
