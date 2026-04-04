import { describe, expect, it } from 'vitest';
import {
  AgentProjectDetailResponseSchema,
  AgentProjectListResponseSchema,
  AiGenerateFromTextResponseSchema,
  ClashSimulationResponseSchema,
  CostSimulationResponseSchema,
  QuantitySimulationResponseSchema,
  RegulationCheckResponseSchema,
  StructureCheckResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject, sampleBlock } from './helpers.js';

describe('Agent API contract', () => {
  it('OpenAPI document is 3.0.x JSON', async () => {
    const app = createTestApp();
    const res = await app.request('/api/agent/openapi.json');
    expect(res.status).toBe(200);
    const doc = (await res.json()) as { openapi: string; paths?: Record<string, unknown> };
    expect(doc.openapi.startsWith('3.0')).toBe(true);
    expect(doc.paths && typeof doc.paths === 'object').toBe(true);
  });

  it('POST quantity, cost, clash, structure-check, regulation-check', async () => {
    const app = createTestApp();
    const headers = { 'Content-Type': 'application/json' };
    const blocks = [sampleBlock];

    const q = await app.request('/api/agent/quantity', {
      method: 'POST',
      headers,
      body: JSON.stringify({ blocks }),
    });
    expect(q.status).toBe(200);
    QuantitySimulationResponseSchema.parse(await q.json());

    const co = await app.request('/api/agent/cost', {
      method: 'POST',
      headers,
      body: JSON.stringify({ blocks }),
    });
    expect(co.status).toBe(200);
    CostSimulationResponseSchema.parse(await co.json());

    const cl = await app.request('/api/agent/clash', {
      method: 'POST',
      headers,
      body: JSON.stringify({ blocks }),
    });
    expect(cl.status).toBe(200);
    ClashSimulationResponseSchema.parse(await cl.json());

    const st = await app.request('/api/agent/structure-check', {
      method: 'POST',
      headers,
      body: JSON.stringify({ blocks }),
    });
    expect(st.status).toBe(200);
    StructureCheckResponseSchema.parse(await st.json());

    const reg = await app.request('/api/agent/regulation-check', {
      method: 'POST',
      headers,
      body: JSON.stringify({ blocks, metadata: {} }),
    });
    expect(reg.status).toBe(200);
    RegulationCheckResponseSchema.parse(await reg.json());
  });

  it('POST suggest-structure + generate-blocks', async () => {
    const app = createTestApp();
    const headers = { 'Content-Type': 'application/json' };

    const su = await app.request('/api/agent/suggest-structure', {
      method: 'POST',
      headers,
      body: JSON.stringify({ blocks: [sampleBlock] }),
    });
    expect(su.status).toBe(200);
    const suJson = await su.json();
    expect(suJson._stub).toBe(true);
    expect(suJson._stubLevel).toBe(0);
    expect(Array.isArray(suJson.suggestions)).toBe(true);

    const gen = await app.request('/api/agent/generate-blocks', {
      method: 'POST',
      headers,
      body: JSON.stringify({ description: 'two columns' }),
    });
    expect(gen.status).toBe(200);
    AiGenerateFromTextResponseSchema.parse(await gen.json());
  });

  it('GET project + projects', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);

    const one = await app.request(`/api/agent/project/${p.id}`);
    expect(one.status).toBe(200);
    const oneJson = await one.json();
    AgentProjectDetailResponseSchema.parse(oneJson);
    expect(oneJson).toMatchObject({ _stub: false, _stubLevel: 2 });

    const list = await app.request('/api/agent/projects');
    expect(list.status).toBe(200);
    const listJson = await list.json();
    AgentProjectListResponseSchema.parse(listJson);
    expect(listJson).toMatchObject({ _stub: false, _stubLevel: 2 });
  });
});
