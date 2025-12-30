// Testes Engine V19 - Monitoramento
// ==================================
import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Engine V19 - Monitoramento', () => {
  test('Módulo monitor deve existir', () => {
    const monitorPath = path.join(__dirname, '..', '..', 'modules', 'monitor');
    expect(fs.existsSync(monitorPath)).toBe(true);
  });

  test('Monitor controller deve existir', () => {
    const controllerPath = path.join(__dirname, '..', '..', 'modules', 'monitor', 'monitor.controller.js');
    expect(fs.existsSync(controllerPath)).toBe(true);
  });

  test('Heartbeat sender deve existir', () => {
    const heartbeatPath = path.join(__dirname, '..', '..', 'scripts', 'heartbeat_sender.js');
    expect(fs.existsSync(heartbeatPath)).toBe(true);
  });

  test('Health routes deve existir', () => {
    const healthPath = path.join(__dirname, '..', '..', 'modules', 'health', 'routes', 'health.routes.js');
    expect(fs.existsSync(healthPath)).toBe(true);
  });
});
