import {
  buildPropertySetsForNewIfcBlock,
  ProjectSchema,
} from '@block-bim-studio/shared';
import { describe, expect, it } from 'vitest';
import {
  EnvironmentCheckResponseSchema,
  RegulationCheckResponseSchema,
  SafetyCheckResponseSchema,
  StructureCheckResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject, sampleBlock } from '../helpers.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

describe('Phase 4 group E integration', () => {
  it('ブロック配置 → 構造チェックで梁スパン違反', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const beamId = crypto.randomUUID();
    const ps = buildPropertySetsForNewIfcBlock('IfcBeam', {
      width: 9,
      height: 0.4,
      depth: 0.25,
    });
    const beam = {
      ...sampleBlock,
      id: beamId,
      name: 'LongBeam',
      ifcType: 'IfcBeam' as const,
      dimensions: { width: 9, height: 0.4, depth: 0.25 },
      propertySets: ps,
    };
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [beam],
      updatedAt: new Date().toISOString(),
    });
    const put = await app.request(`/api/projects/${p.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(updated),
    });
    expect(put.status).toBe(200);

    const res = await app.request('/api/check/structure', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(res.status).toBe(200);
    const j = StructureCheckResponseSchema.parse(await res.json());
    expect(j.passed).toBe(false);
    expect(j.violations.some((v) => v.ruleName === 'beam_span_limit')).toBe(true);
  });

  it('プロジェクト設定 → 法規チェック → 適合判定', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const wallId = crypto.randomUUID();
    const wallPs = buildPropertySetsForNewIfcBlock('IfcWall', {
      width: 4,
      height: 2,
      depth: 0.2,
    });
    const wall = {
      ...sampleBlock,
      id: wallId,
      name: 'W',
      dimensions: { width: 4, height: 2, depth: 0.2 },
      propertySets: wallPs,
    };
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [wall],
      metadata: {
        siteArea: 500,
        buildingCoverageLimit: 80,
        floorAreaRatioLimit: 500,
        zoneType: '第一種低層住居専用地域',
      },
      updatedAt: new Date().toISOString(),
    });
    const put = await app.request(`/api/projects/${p.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(updated),
    });
    expect(put.status).toBe(200);

    const res = await app.request('/api/check/regulation', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(res.status).toBe(200);
    const j = RegulationCheckResponseSchema.parse(await res.json());
    expect(j.items.length).toBeGreaterThanOrEqual(2);
    expect(j.items.filter((i) => i.name === '建ぺい率' || i.name === '容積率').every((i) => i.compliant)).toBe(
      true,
    );
  });

  it('窓配置 → 環境シミュレーション', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const winId = crypto.randomUUID();
    const win = {
      ...sampleBlock,
      id: winId,
      name: 'Window1',
      ifcType: 'IfcWindow' as const,
      category: 'opening' as const,
      dimensions: { width: 1.2, height: 1.4, depth: 0.08 },
      position: { x: 0, y: 1.5, z: 0 },
      propertySets: [],
    };
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [win],
      updatedAt: new Date().toISOString(),
    });
    const put = await app.request(`/api/projects/${p.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(updated),
    });
    expect(put.status).toBe(200);

    const res = await app.request('/api/check/environment', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(res.status).toBe(200);
    const j = EnvironmentCheckResponseSchema.parse(await res.json());
    expect(j.windowDetails?.length).toBe(1);
    expect(j.solarGainKwh).toBeGreaterThan(0);
  });

  it('工程＋配置 → 安全管理で危険検出', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const idA = crypto.randomUUID();
    const idB = crypto.randomUUID();
    const ps = buildPropertySetsForNewIfcBlock('IfcWall', {
      width: 2,
      height: 2,
      depth: 0.2,
    });
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [
        {
          ...sampleBlock,
          id: idA,
          name: 'Low',
          position: { x: 0, y: 1, z: 0 },
          propertySets: ps,
        },
        {
          ...sampleBlock,
          id: idB,
          name: 'High',
          position: { x: 0, y: 5, z: 0 },
          propertySets: ps,
        },
      ],
      schedules: [
        {
          blockId: idA,
          startDate: '2024-05-01T00:00:00.000Z',
          endDate: '2024-05-20T00:00:00.000Z',
          durationDays: 20,
          dependencies: [],
          status: 'in_progress' as const,
        },
        {
          blockId: idB,
          startDate: '2024-05-10T00:00:00.000Z',
          endDate: '2024-05-25T00:00:00.000Z',
          durationDays: 16,
          dependencies: [],
          status: 'in_progress' as const,
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

    const res = await app.request('/api/check/safety', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(res.status).toBe(200);
    const j = SafetyCheckResponseSchema.parse(await res.json());
    expect(j.hazards.length).toBeGreaterThanOrEqual(1);
    expect(j.passed).toBe(false);
  });
});
