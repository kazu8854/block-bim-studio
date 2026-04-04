import { describe, expect, it } from 'vitest';
import {
  EnvironmentCheckResponseSchema,
  RegulationCheckResponseSchema,
  SafetyCheckResponseSchema,
  StructureCheckResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

describe('Check API contract', () => {
  it('structure, regulation, environment, safety', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const body = { projectId: p.id };
    const headers = { 'Content-Type': 'application/json' };

    for (const path of [
      '/api/check/structure',
      '/api/check/regulation',
      '/api/check/environment',
      '/api/check/safety',
    ] as const) {
      const res = await app.request(path, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      if (path.endsWith('structure')) StructureCheckResponseSchema.parse(json);
      if (path.endsWith('regulation')) RegulationCheckResponseSchema.parse(json);
      if (path.endsWith('environment')) EnvironmentCheckResponseSchema.parse(json);
      if (path.endsWith('safety')) SafetyCheckResponseSchema.parse(json);
    }
  });
});
