import {
  buildPropertySetsForNewIfcBlock,
  ProjectSchema,
} from '@block-bim-studio/shared';
import { describe, expect, it } from 'vitest';
import { createTestApp, createTestProject, sampleBlock } from '../helpers.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

describe('Phase 2 group C integration', () => {
  it('工程設定 → ガント → クリティカルパス（FS 直列）', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const idA = crypto.randomUUID();
    const idB = crypto.randomUUID();
    const wallPs = buildPropertySetsForNewIfcBlock('IfcWall', {
      width: 1,
      height: 1,
      depth: 1,
    });
    const a = {
      ...sampleBlock,
      id: idA,
      name: 'TaskA',
      propertySets: wallPs,
    };
    const b = {
      ...sampleBlock,
      id: idB,
      name: 'TaskB',
      propertySets: wallPs,
    };
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [a, b],
      schedules: [
        {
          blockId: idA,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-02T00:00:00.000Z',
          durationDays: 2,
          dependencies: [],
          status: 'not_started' as const,
        },
        {
          blockId: idB,
          startDate: '2024-01-03T00:00:00.000Z',
          endDate: '2024-01-04T00:00:00.000Z',
          durationDays: 2,
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
    const gj = (await g.json()) as {
      tasks: unknown[];
      dependencyEdges: unknown[];
      _stub: boolean;
      _stubLevel: number;
    };
    expect(gj._stub).toBe(false);
    expect(gj._stubLevel).toBe(2);
    expect(gj.tasks).toHaveLength(2);
    expect(gj.dependencyEdges).toHaveLength(1);

    const c = await app.request('/api/schedule/critical-path', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(c.status).toBe(200);
    const cj = (await c.json()) as {
      criticalPath: string[];
      totalDuration: number;
      _stub: boolean;
      message?: string;
    };
    expect(cj._stub).toBe(false);
    expect(cj.message).toBeUndefined();
    expect(cj.criticalPath.length).toBeGreaterThanOrEqual(1);
    expect(cj.totalDuration).toBeGreaterThanOrEqual(1);
  });

  it('循環依存ではクリティカルパスがエラーメッセージを返す', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const idA = crypto.randomUUID();
    const idB = crypto.randomUUID();
    const wallPs = buildPropertySetsForNewIfcBlock('IfcWall', {
      width: 1,
      height: 1,
      depth: 1,
    });
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [
        { ...sampleBlock, id: idA, name: 'A', propertySets: wallPs },
        { ...sampleBlock, id: idB, name: 'B', propertySets: wallPs },
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

    const c = await app.request('/api/schedule/critical-path', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(c.status).toBe(200);
    const cj = (await c.json()) as { message?: string; criticalPath: string[] };
    expect(cj.message).toMatch(/循環/);
    expect(cj.criticalPath).toHaveLength(0);
  });
});
