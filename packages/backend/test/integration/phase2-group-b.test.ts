import {
  buildPropertySetsForNewIfcBlock,
  ProjectSchema,
} from '@block-bim-studio/shared';
import { describe, expect, it } from 'vitest';
import { createTestApp, createTestProject, sampleBlock } from '../helpers.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

describe('Phase 2 group B integration', () => {
  it('ブロック配置 → 数量算出 → コスト概算のフルフロー', async () => {
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
      headers: jsonHeaders,
      body: JSON.stringify(updated),
    });
    expect(put.status).toBe(200);

    const q = await app.request('/api/simulation/quantity', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(q.status).toBe(200);
    const qj = (await q.json()) as { total: { volume: number; count: number } };
    expect(qj.total.count).toBe(1);
    expect(qj.total.volume).toBeCloseTo(8, 6);

    const c = await app.request('/api/simulation/cost', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(c.status).toBe(200);
    const cj = (await c.json()) as { total: number; uncostedBlocks: string[] };
    expect(cj.uncostedBlocks).toHaveLength(0);
    expect(cj.total).toBeGreaterThan(0);
  });

  it('ブロック配置 → 干渉チェック → 結果返却', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const a = {
      ...sampleBlock,
      id: crypto.randomUUID(),
      name: 'A',
      position: { x: 0, y: 1, z: 0 },
      dimensions: { width: 2, height: 2, depth: 2 },
      propertySets: buildPropertySetsForNewIfcBlock('IfcWall', {
        width: 2,
        height: 2,
        depth: 2,
      }),
    };
    const b = {
      ...sampleBlock,
      id: crypto.randomUUID(),
      name: 'B',
      position: { x: 0, y: 1, z: 0 },
      dimensions: { width: 2, height: 2, depth: 2 },
      propertySets: buildPropertySetsForNewIfcBlock('IfcWall', {
        width: 2,
        height: 2,
        depth: 2,
      }),
    };
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [a, b],
      updatedAt: new Date().toISOString(),
    });
    const put = await app.request(`/api/projects/${p.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(updated),
    });
    expect(put.status).toBe(200);

    const cl = await app.request('/api/simulation/clash', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(cl.status).toBe(200);
    const clj = (await cl.json()) as {
      clashes: Array<{ blockIdA: string; blockIdB: string }>;
    };
    expect(clj.clashes.length).toBeGreaterThanOrEqual(1);
  });
});
