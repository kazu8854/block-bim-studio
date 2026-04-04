import { describe, expect, it } from 'vitest';
import {
  AiGenerateFromImageResponseSchema,
  AiGenerateFromTextResponseSchema,
  AiSuggestStructureResponseSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

describe('AI API contract', () => {
  it('suggest-structure, generate-from-text, generate-from-image', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);

    const s = await app.request('/api/ai/suggest-structure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(s.status).toBe(200);
    AiSuggestStructureResponseSchema.parse(await s.json());

    const t = await app.request('/api/ai/generate-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'build a wall' }),
    });
    expect(t.status).toBe(200);
    AiGenerateFromTextResponseSchema.parse(await t.json());

    const i = await app.request('/api/ai/generate-from-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: 'AA==' }),
    });
    expect(i.status).toBe(200);
    AiGenerateFromImageResponseSchema.parse(await i.json());
  });
});
