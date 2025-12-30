// Testes Engine V19 - Financial
// =============================
import { describe, test, expect } from 'vitest';

describe('Engine V19 - Financial', () => {
  test('FinancialService deve ter método addBalance', async () => {
    const FinancialService = await import('../../modules/financial/services/financial.service.js');
    const service = FinancialService.default || FinancialService;
    expect(typeof (service.addBalance || service.default?.addBalance)).toBe('function');
  });

  test('FinancialService deve ter método deductBalance', async () => {
    const FinancialService = await import('../../modules/financial/services/financial.service.js');
    const service = FinancialService.default || FinancialService;
    expect(typeof (service.deductBalance || service.default?.deductBalance)).toBe('function');
  });

  test('WebhookService deve existir', async () => {
    const WebhookService = await import('../../modules/financial/services/webhook.service.js');
    expect(WebhookService.default || WebhookService).toBeDefined();
  });
});
