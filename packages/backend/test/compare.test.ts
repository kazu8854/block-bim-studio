import { describe, expect, it } from 'vitest';
import { CompareResponseSchema } from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

describe('Compare API contract (F4)', () => {
  it('returns message when fewer than 2 projects', async () => {
    const app = createTestApp();
    const a = await createTestProject(app);
    const res = await app.request('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectIds: [a.id] }),
    });
    expect(res.status).toBe(200);
    const json = CompareResponseSchema.parse(await res.json());
    expect(json._stubLevel).toBe(2);
    expect(json.message).toBeDefined();
    expect(json.deltas).toHaveLength(0);
  });

  it('returns deltas for two or more projects', async () => {
    const app = createTestApp();
    const a = await createTestProject(app);
    const b = await createTestProject(app);
    const res = await app.request('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectIds: [a.id, b.id] }),
    });
    expect(res.status).toBe(200);
    const json = CompareResponseSchema.parse(await res.json());
    expect(json._stubLevel).toBe(2);
    expect(json.message).toBeUndefined();
    expect(json.deltas.length).toBeGreaterThan(0);
  });
});
