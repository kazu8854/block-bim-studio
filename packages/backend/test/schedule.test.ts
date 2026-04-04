import { describe, expect, it } from 'vitest';
import {
  CriticalPathResponseSchema,
  GanttResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

describe('Schedule API contract', () => {
  it('gantt + critical-path（空の工程）', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const body = { projectId: p.id };

    const g = await app.request('/api/schedule/gantt', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(body),
    });
    expect(g.status).toBe(200);
    const gj = GanttResponseSchema.parse(await g.json());
    expect(gj._stub).toBe(false);
    expect(gj._stubLevel).toBe(2);
    expect(gj.tasks).toHaveLength(0);
    expect(gj.dependencyEdges).toEqual([]);
    expect(gj.message).toMatch(/工程/);

    const c = await app.request('/api/schedule/critical-path', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify(body),
    });
    expect(c.status).toBe(200);
    const cj = CriticalPathResponseSchema.parse(await c.json());
    expect(cj._stub).toBe(false);
    expect(cj._stubLevel).toBe(2);
    expect(cj.criticalPath).toEqual([]);
    expect(cj.message).toMatch(/工程/);
  });

  it('依存エッジが 1 本だけでも契約どおり返る', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const idA = crypto.randomUUID();
    const idB = crypto.randomUUID();
    const updated = {
      ...p,
      blocks: [
        {
          id: idA,
          name: 'X',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 1, height: 1, depth: 1 },
          propertySets: [],
        },
        {
          id: idB,
          name: 'Y',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 1, height: 1, depth: 1 },
          propertySets: [],
        },
      ],
      schedules: [
        {
          blockId: idA,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z',
          durationDays: 1,
          dependencies: [],
          status: 'not_started' as const,
        },
        {
          blockId: idB,
          startDate: '2024-01-02T00:00:00.000Z',
          endDate: '2024-01-02T00:00:00.000Z',
          durationDays: 1,
          dependencies: [{ blockId: idA, type: 'FS' as const }],
          status: 'not_started' as const,
        },
      ],
      updatedAt: new Date().toISOString(),
    };
    const put = await app.request(`/api/projects/${p.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(updated),
    });
    expect(put.status).toBe(200);

    const g = await app.request('/api/schedule/gantt', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(g.status).toBe(200);
    const gj = GanttResponseSchema.parse(await g.json());
    expect(gj.dependencyEdges).toHaveLength(1);
    expect(gj.tasks).toHaveLength(2);
  });
});
