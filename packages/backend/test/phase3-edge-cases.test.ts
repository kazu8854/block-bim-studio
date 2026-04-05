import {
  ClashSimulationResponseSchema,
  GanttResponseSchema,
  ProjectSchema,
} from '@block-bim-studio/shared';
import { describe, expect, it } from 'vitest';
import { createTestApp, createTestProject, sampleBlock } from './helpers.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

describe('Phase 3.2 — API エッジケース', () => {
  it('存在しない projectId は 404', async () => {
    const app = createTestApp();
    const fakeId = '80000000-0000-4000-8000-000000000001';
    const q = await app.request('/api/simulation/quantity', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: fakeId }),
    });
    expect(q.status).toBe(404);
  });

  it('projectId が UUID でないと 400', async () => {
    const app = createTestApp();
    const q = await app.request('/api/simulation/quantity', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: 'not-a-uuid' }),
    });
    expect(q.status).toBe(400);
  });

  it('JSON が壊れていると 400', async () => {
    const app = createTestApp();
    const q = await app.request('/api/simulation/quantity', {
      method: 'POST',
      headers: jsonHeaders,
      body: '{',
    });
    expect(q.status).toBe(400);
  });

  it('空プロジェクトの干渉は契約どおりメッセージ付き', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const cl = await app.request('/api/simulation/clash', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(cl.status).toBe(200);
    const clj = ClashSimulationResponseSchema.parse(await cl.json());
    expect(clj.clashes).toHaveLength(0);
    expect(clj.message).toMatch(/2 未満/);
  });

  it('循環依存プロジェクトのガントはメッセージを返す', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const idA = crypto.randomUUID();
    const idB = crypto.randomUUID();
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [
        {
          id: idA,
          name: 'A',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 1, height: 1, depth: 1 },
          propertySets: [],
        },
        {
          id: idB,
          name: 'B',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 2, y: 0, z: 0 },
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
          dependencies: [{ blockId: idB, type: 'FS' as const }],
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
    });
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
    expect(gj.message).toMatch(/循環/);
  });

  it('工程はあるが対応ブロックがプロジェクトに無い場合もガントは返る', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const orphanScheduleId = crypto.randomUUID();
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [sampleBlock],
      schedules: [
        {
          blockId: orphanScheduleId,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-02T00:00:00.000Z',
          durationDays: 2,
          dependencies: [],
          status: 'not_started' as const,
        },
      ],
      updatedAt: new Date().toISOString(),
    });
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
    expect(gj.tasks).toHaveLength(1);
    expect(gj.tasks[0]!.name).toBe(orphanScheduleId.slice(0, 8));
  });
});
