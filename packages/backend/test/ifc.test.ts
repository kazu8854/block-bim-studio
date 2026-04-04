import { describe, expect, it } from 'vitest';
import {
  IfcExportResponseSchema,
  IfcImportResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

describe('IFC API contract (F1–F2)', () => {
  it('export + import round-trip meta', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);

    const ex = await app.request(`/api/ifc/export/${p.id}`, { method: 'POST' });
    expect(ex.status).toBe(200);
    const exported = IfcExportResponseSchema.parse(await ex.json());
    expect(exported._stubLevel).toBe(2);
    expect(exported.ifcBase64.length).toBeGreaterThan(10);

    const im = await app.request('/api/ifc/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ifcBase64: exported.ifcBase64 }),
    });
    expect(im.status).toBe(200);
    const imported = IfcImportResponseSchema.parse(await im.json());
    expect(imported._stubLevel).toBe(2);
    expect(imported.blocks).toEqual([]);
  });

  it('import rejects invalid base64 payload with error response', async () => {
    const app = createTestApp();
    const im = await app.request('/api/ifc/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ifcBase64: 'AA==' }),
    });
    expect(im.status).toBe(500);
  });
});
