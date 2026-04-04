import { describe, expect, it } from 'vitest';
import { DashboardResponseSchema } from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

describe('Dashboard API contract (F3)', () => {
  it('GET dashboard', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const res = await app.request(`/api/dashboard/${p.id}`);
    expect(res.status).toBe(200);
    const json = DashboardResponseSchema.parse(await res.json());
    expect(json._stubLevel).toBe(2);
    expect(json.costByIfcType).toBeDefined();
  });
});
