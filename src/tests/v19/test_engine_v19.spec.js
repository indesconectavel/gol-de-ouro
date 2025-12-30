// Testes Engine V19 - Core
// ========================
import { describe, test, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

describe('Engine V19 - Core', () => {
  test('Deve carregar supabase-unified-config', async () => {
    const config = await import('../../../database/supabase-unified-config.js');
    expect(config).toBeDefined();
    expect(config.supabaseAdmin).toBeDefined();
  });

  test('Deve carregar LoteService', async () => {
    const LoteService = await import('../../modules/lotes/services/lote.service.js');
    expect(LoteService.default || LoteService).toBeDefined();
    const service = LoteService.default || LoteService;
    expect(service.getOrCreateLote || service.default?.getOrCreateLote).toBeDefined();
  });

  test('Deve carregar FinancialService', async () => {
    const FinancialService = await import('../../modules/financial/services/financial.service.js');
    expect(FinancialService.default || FinancialService).toBeDefined();
    const service = FinancialService.default || FinancialService;
    expect(service.addBalance || service.default?.addBalance).toBeDefined();
    expect(service.deductBalance || service.default?.deductBalance).toBeDefined();
  });

  test('Deve carregar RewardService', async () => {
    const RewardService = await import('../../modules/rewards/services/reward.service.js');
    expect(RewardService.default || RewardService).toBeDefined();
    const service = RewardService.default || RewardService;
    expect(service.creditReward || service.default?.creditReward).toBeDefined();
  });
});
