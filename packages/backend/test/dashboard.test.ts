import { describe, expect, it } from 'vitest';
import { CompareResponseSchema, DashboardResponseSchema } from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

describe('Dashboard & compare API contract', () => {
  it('GET dashboard', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const res = await app.request(`/api/dashboard/${p.id}`);
    expect(res.status).toBe(200);
    DashboardResponseSchema.parse(await res.json());
  });

  it('POST compare', async () => {
    const app = createTestApp();
    const a = await createTestProject(app);
    const b = await createTestProject(app);
    const res = await app.request('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectIds: [a.id, b.id] }),
    });
    expect(res.status).toBe(200);
    CompareResponseSchema.parse(await res.json());
  });
});
