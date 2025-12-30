// Testes Engine V19 - Lotes
// =========================
import { describe, test, expect } from 'vitest';

describe('Engine V19 - Lotes', () => {
  test('LoteService deve ter método getOrCreateLote', async () => {
    const LoteService = await import('../../modules/lotes/services/lote.service.js');
    const service = LoteService.default || LoteService;
    expect(typeof (service.getOrCreateLote || service.default?.getOrCreateLote)).toBe('function');
  });

  test('LoteService deve ter método updateLoteAfterShot', async () => {
    const LoteService = await import('../../modules/lotes/services/lote.service.js');
    const service = LoteService.default || LoteService;
    expect(typeof (service.updateLoteAfterShot || service.default?.updateLoteAfterShot)).toBe('function');
  });

  test('LoteService deve ter método syncActiveLotes', async () => {
    const LoteService = await import('../../modules/lotes/services/lote.service.js');
    const service = LoteService.default || LoteService;
    expect(typeof (service.syncActiveLotes || service.default?.syncActiveLotes)).toBe('function');
  });
});
