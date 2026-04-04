import { describe, expect, it } from 'vitest';
import {
  EnvironmentCheckResponseSchema,
  RegulationCheckResponseSchema,
  SafetyCheckResponseSchema,
  StructureCheckResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

describe('Check API contract', () => {
  it('structure, regulation, environment, safety（Level 2 メタ）', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const body = { projectId: p.id };
    const headers = jsonHeaders;

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
      expect(json).toMatchObject({ _stub: false, _stubLevel: 2 });
      if (path.endsWith('structure')) StructureCheckResponseSchema.parse(json);
      if (path.endsWith('regulation')) RegulationCheckResponseSchema.parse(json);
      if (path.endsWith('environment')) EnvironmentCheckResponseSchema.parse(json);
      if (path.endsWith('safety')) SafetyCheckResponseSchema.parse(json);
    }
  });

  it('構造: ブロック 0 個は合格メッセージ', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const res = await app.request('/api/check/structure', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(res.status).toBe(200);
    const j = StructureCheckResponseSchema.parse(await res.json());
    expect(j.passed).toBe(true);
    expect(j.violations).toHaveLength(0);
    expect(j.message).toMatch(/満たしています/);
  });

  it('法規: 敷地未設定メッセージ', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const res = await app.request('/api/check/regulation', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(res.status).toBe(200);
    const j = RegulationCheckResponseSchema.parse(await res.json());
    expect(j.message).toMatch(/敷地/);
    expect(j.allCompliant).toBe(false);
  });
});
