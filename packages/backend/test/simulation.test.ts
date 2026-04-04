import { describe, expect, it } from 'vitest';
import {
  ClashSimulationResponseSchema,
  CostSimulationResponseSchema,
  QuantitySimulationResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

describe('Simulation API contract', () => {
  it('quantity, cost, clash', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const body = { projectId: p.id };

    const q = await app.request('/api/simulation/quantity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(q.status).toBe(200);
    QuantitySimulationResponseSchema.parse(await q.json());

    const co = await app.request('/api/simulation/cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(co.status).toBe(200);
    CostSimulationResponseSchema.parse(await co.json());

    const cl = await app.request('/api/simulation/clash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(cl.status).toBe(200);
    ClashSimulationResponseSchema.parse(await cl.json());
  });
});
