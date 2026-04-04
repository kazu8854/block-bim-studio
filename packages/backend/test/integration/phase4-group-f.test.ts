import {
  buildPropertySetsForNewIfcBlock,
  DashboardResponseSchema,
  CompareResponseSchema,
  IfcExportResponseSchema,
  IfcImportResponseSchema,
  ProjectSchema,
} from '@block-bim-studio/shared';
import { describe, expect, it } from 'vitest';
import { createTestApp, createTestProject, sampleBlock } from '../helpers.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

describe('Phase 4 group F integration', () => {
  it(
    'IFC export → import round-trip restores blocks',
    async () => {
      const app = createTestApp();
      const p = await createTestProject(app);
      const dims = { width: 2, height: 2.5, depth: 0.3 };
      const wall = {
        ...sampleBlock,
        id: '10000000-0000-4000-8000-000000000099',
        name: 'IFC Wall',
        ifcType: 'IfcWall' as const,
        dimensions: dims,
        propertySets: buildPropertySetsForNewIfcBlock('IfcWall', dims),
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

      const ex = await app.request(`/api/ifc/export/${p.id}`, { method: 'POST' });
      expect(ex.status).toBe(200);
      const exported = IfcExportResponseSchema.parse(await ex.json());

      const im = await app.request('/api/ifc/import', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ ifcBase64: exported.ifcBase64 }),
      });
      expect(im.status).toBe(200);
      const imported = IfcImportResponseSchema.parse(await im.json());
      expect(imported.blocks).toHaveLength(1);
      expect(imported.blocks[0]!.id).toBe(wall.id);
    },
    60_000,
  );

  it('dashboard reflects material quantity and cost breakdown', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const dims = { width: 1, height: 2, depth: 0.2 };
    const wall = {
      ...sampleBlock,
      id: crypto.randomUUID(),
      name: 'D1',
      dimensions: dims,
      propertySets: buildPropertySetsForNewIfcBlock('IfcWall', dims),
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

    const res = await app.request(`/api/dashboard/${p.id}`);
    expect(res.status).toBe(200);
    const d = DashboardResponseSchema.parse(await res.json());
    expect(d.blockCount).toBe(1);
    const mat = wall.propertySets.find((x) => x.name === 'Pset_Common')?.properties
      .Material;
    const key = typeof mat === 'string' ? mat : 'unknown';
    expect(d.quantityByType[key]).toBe(1);
    expect(d.costByIfcType.IfcWall).toBeGreaterThan(0);
  });

  it('compare returns aligned metrics for two projects', async () => {
    const app = createTestApp();
    const a = await createTestProject(app);
    const b = await createTestProject(app);
    const res = await app.request('/api/compare', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectIds: [a.id, b.id] }),
    });
    expect(res.status).toBe(200);
    const c = CompareResponseSchema.parse(await res.json());
    expect(c.message).toBeUndefined();
    const costDelta = c.deltas.find((x) => x.metric === 'totalCostEstimate');
    expect(costDelta?.valuesByProjectId[a.id]).toBeDefined();
    expect(costDelta?.valuesByProjectId[b.id]).toBeDefined();
  });
});
