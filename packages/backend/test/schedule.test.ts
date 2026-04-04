import { describe, expect, it } from 'vitest';
import {
  CriticalPathResponseSchema,
  GanttResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

describe('Schedule API contract', () => {
  it('gantt + critical-path', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const body = { projectId: p.id };

    const g = await app.request('/api/schedule/gantt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(g.status).toBe(200);
    GanttResponseSchema.parse(await g.json());

    const c = await app.request('/api/schedule/critical-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(c.status).toBe(200);
    CriticalPathResponseSchema.parse(await c.json());
  });
});
