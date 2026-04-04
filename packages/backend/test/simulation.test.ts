import {
  buildPropertySetsForNewIfcBlock,
  ClashSimulationResponseSchema,
  CostSimulationResponseSchema,
  ProjectSchema,
  QuantitySimulationResponseSchema,
} from '@block-bim-studio/shared';
import { describe, expect, it } from 'vitest';
import { createTestApp, createTestProject, sampleBlock } from './helpers.js';

describe('Simulation API contract', () => {
  it('quantity, cost, clash（Level 2 メタ）', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const body = { projectId: p.id };

    const q = await app.request('/api/simulation/quantity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(q.status).toBe(200);
    const qj = await q.json();
    QuantitySimulationResponseSchema.parse(qj);
    expect(qj).toMatchObject({ _stub: false, _stubLevel: 2 });
    expect(qj.total.count).toBe(0);

    const co = await app.request('/api/simulation/cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(co.status).toBe(200);
    const cj = await co.json();
    CostSimulationResponseSchema.parse(cj);
    expect(cj).toMatchObject({ _stub: false, _stubLevel: 2 });

    const cl = await app.request('/api/simulation/clash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(cl.status).toBe(200);
    const clj = await cl.json();
    ClashSimulationResponseSchema.parse(clj);
    expect(clj).toMatchObject({ _stub: false, _stubLevel: 2 });
    expect(clj.message).toBeDefined();
  });

  it('ブロックありで数量・コストが算出される', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const wall = {
      ...sampleBlock,
      id: crypto.randomUUID(),
      dimensions: { width: 2, height: 2, depth: 2 },
      propertySets: buildPropertySetsForNewIfcBlock('IfcWall', {
        width: 2,
        height: 2,
        depth: 2,
      }),
    };
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [wall],
      updatedAt: new Date().toISOString(),
    });
    const put = await app.request(`/api/projects/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    expect(put.status).toBe(200);

    const q = await app.request('/api/simulation/quantity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(q.status).toBe(200);
    const qj = await q.json();
    expect(qj.total.count).toBe(1);
    expect(qj.total.volume).toBeGreaterThan(0);

    const co = await app.request('/api/simulation/cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(co.status).toBe(200);
    const cj = await co.json();
    expect(cj.total).toBeGreaterThan(0);
    expect(cj.uncostedBlocks).toHaveLength(0);
  });
});
