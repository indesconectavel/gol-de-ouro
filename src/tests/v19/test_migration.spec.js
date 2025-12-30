// Testes Engine V19 - Migration
// ==============================
import { describe, test, expect } from 'vitest';

describe('Engine V19 - Migration', () => {
  test('Variáveis de ambiente V19 devem estar configuradas', () => {
    expect(process.env.USE_ENGINE_V19).toBe('true');
    expect(process.env.ENGINE_HEARTBEAT_ENABLED).toBe('true');
    expect(process.env.ENGINE_MONITOR_ENABLED).toBe('true');
  });

  test('Variáveis Supabase devem estar configuradas', () => {
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
  });
});

