import {
  AiGenerateFromImageResponseSchema,
  AiGenerateFromTextResponseSchema,
  AiSuggestStructureResponseSchema,
  buildPropertySetsForNewIfcBlock,
  ProjectSchema,
} from '@block-bim-studio/shared';
import { describe, expect, it } from 'vitest';
import { createTestApp, createTestProject, sampleBlock } from '../helpers.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

/** 1×1 透明 PNG（有効な画像バイナリ） */
const MINI_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

function wall(id: string, x: number) {
  const dims = { width: 1, height: 2, depth: 0.2 };
  return {
    ...sampleBlock,
    id,
    name: `W-${x}`,
    position: { x, y: 1, z: 0 },
    dimensions: dims,
    propertySets: buildPropertySetsForNewIfcBlock('IfcWall', dims),
  };
}

describe('Phase 4 group D integration (MockAIAdapter)', () => {
  it('構造提案: 3 ブロック以上で提案が返る', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const updated = ProjectSchema.parse({
      ...p,
      blocks: [
        wall(crypto.randomUUID(), 0),
        wall(crypto.randomUUID(), 2),
        wall(crypto.randomUUID(), 4),
      ],
      updatedAt: new Date().toISOString(),
    });
    const put = await app.request(`/api/projects/${p.id}`, {
      method: 'PUT',
      headers: jsonHeaders,
      body: JSON.stringify(updated),
    });
    expect(put.status).toBe(200);

    const res = await app.request('/api/ai/suggest-structure', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(res.status).toBe(200);
    const j = AiSuggestStructureResponseSchema.parse(await res.json());
    expect(j._stubLevel).toBe(2);
    expect(j.suggestions.length).toBeGreaterThan(0);
  });

  it('構造提案: ブロック不足時はメッセージ', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const res = await app.request('/api/ai/suggest-structure', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ projectId: p.id }),
    });
    expect(res.status).toBe(200);
    const j = AiSuggestStructureResponseSchema.parse(await res.json());
    expect(j.suggestions).toHaveLength(0);
    expect(j.message).toBeDefined();
  });

  it('自然言語モデリングでブロックが返る', async () => {
    const app = createTestApp();
    const res = await app.request('/api/ai/generate-from-text', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ text: '事務所の外周壁を1枚' }),
    });
    expect(res.status).toBe(200);
    const j = AiGenerateFromTextResponseSchema.parse(await res.json());
    expect(j._stubLevel).toBe(2);
    expect(j.blocks.length).toBeGreaterThan(0);
  });

  it('画像解析で検出要素が返る', async () => {
    const app = createTestApp();
    const res = await app.request('/api/ai/generate-from-image', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ imageBase64: MINI_PNG_B64 }),
    });
    expect(res.status).toBe(200);
    const j = AiGenerateFromImageResponseSchema.parse(await res.json());
    expect(j._stubLevel).toBe(2);
    expect(j.detectedElements.length).toBeGreaterThan(0);
  });
});
