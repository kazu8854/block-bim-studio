import { describe, expect, it } from 'vitest';
import {
  IfcExportResponseSchema,
  IfcImportResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

describe('IFC API contract', () => {
  it('export + import', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);

    const ex = await app.request(`/api/ifc/export/${p.id}`, { method: 'POST' });
    expect(ex.status).toBe(200);
    IfcExportResponseSchema.parse(await ex.json());

    const im = await app.request('/api/ifc/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ifcBase64: 'AA==' }),
    });
    expect(im.status).toBe(200);
    IfcImportResponseSchema.parse(await im.json());
  });
});
