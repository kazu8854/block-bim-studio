import { describe, expect, it } from 'vitest';
import {
  AiGenerateFromImageResponseSchema,
  AiGenerateFromTextResponseSchema,
  AiSuggestStructureResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

const MINI_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('AI API contract (グループ D)', () => {
  it('suggest-structure, generate-from-text, generate-from-image (Level 2)', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);

    const s = await app.request('/api/ai/suggest-structure', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(s.status).toBe(200);
    const sj = AiSuggestStructureResponseSchema.parse(await s.json());
    expect(sj._stubLevel).toBe(2);
    expect(sj._stub).toBe(false);

    const t = await app.request('/api/ai/generate-from-text', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ text: 'build a wall' }),
    });
    expect(t.status).toBe(200);
    const tj = AiGenerateFromTextResponseSchema.parse(await t.json());
    expect(tj._stubLevel).toBe(2);

    const i = await app.request('/api/ai/generate-from-image', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ imageBase64: MINI_PNG_B64 }),
    });
    expect(i.status).toBe(200);
    AiGenerateFromImageResponseSchema.parse(await i.json());
  });

  it('rejects text over 1000 characters', async () => {
    const app = createTestApp();
    const res = await app.request('/api/ai/generate-from-text', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ text: 'x'.repeat(1001) }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects oversized image payload', async () => {
    const app = createTestApp();
    const huge = Buffer.alloc(11 * 1024 * 1024, 0xff).toString('base64');
    const res = await app.request('/api/ai/generate-from-image', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ imageBase64: huge }),
    });
    expect(res.status).toBe(400);
  });
});
