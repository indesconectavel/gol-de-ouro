/**
 * SMOKE TEST - Testes básicos de endpoints
 */

const { describe, it, expect } = require('vitest');
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:8080';

describe('Smoke Tests', () => {
  it('deve responder no endpoint /health', async () => {
    const response = await axios.get(`${API_URL}/health`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success');
  });

  it('deve responder no endpoint /monitor', async () => {
    const response = await axios.get(`${API_URL}/monitor`);
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('success');
    expect(response.data).toHaveProperty('metrics');
    expect(response.data.metrics).toHaveProperty('lotes_ativos_count');
  });

  it('deve responder no endpoint /metrics (Prometheus)', async () => {
    const response = await axios.get(`${API_URL}/metrics`);
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.data).toContain('goldeouro_');
  });
});

