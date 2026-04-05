import {
  AiGenerateFromImageResponseSchema,
  AiGenerateFromTextResponseSchema,
  AiSuggestStructureResponseSchema,
} from '@block-bim-studio/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AIUsecase } from '../usecases/ai-usecase.js';
import { AI_TEXT_MAX_LENGTH } from '../usecases/ai-usecase.js';
import { STUB_LEVEL_2_SIMULATION } from './stub.js';

const ProjectIdBodySchema = z.object({
  projectId: z.string().uuid(),
});

const TextBodySchema = z.object({
  text: z.string().min(1).max(AI_TEXT_MAX_LENGTH),
});

const ImageBodySchema = z.object({
  imageBase64: z.string().min(1),
});

export function createAiApp(aiUsecase: AIUsecase) {
  const app = new Hono();

  app.post('/suggest-structure', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const outcome = await aiUsecase.suggestForProject(projectId);
    if (outcome === null) return c.json({ error: 'Project not found' }, 404);
    const body = AiSuggestStructureResponseSchema.parse({
      suggestions: outcome.suggestions,
      message: outcome.message,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  app.post('/generate-from-text', zValidator('json', TextBodySchema), async (c) => {
    const { text } = c.req.valid('json');
    try {
      const result = await aiUsecase.generateFromText(text);
      const body = AiGenerateFromTextResponseSchema.parse({
        ...result,
        ...STUB_LEVEL_2_SIMULATION,
      });
      return c.json(body);
    } catch (e) {
      if (e instanceof Error && e.message === 'AI_GENERATION_FAILED') {
        return c.json(
          { error: 'AI の応答を解釈できませんでした。入力を変えて再試行してください。' },
          502,
        );
      }
      throw e;
    }
  });

  app.post('/generate-from-image', zValidator('json', ImageBodySchema), async (c) => {
    const { imageBase64 } = c.req.valid('json');
    try {
      const result = await aiUsecase.generateFromImage(imageBase64);
      const body = AiGenerateFromImageResponseSchema.parse({
        ...result,
        ...STUB_LEVEL_2_SIMULATION,
      });
      return c.json(body);
    } catch (e) {
      if (e instanceof Error) {
        const code = e.message;
        if (
          code === 'INVALID_IMAGE_BASE64' ||
          code === 'EMPTY_IMAGE' ||
          code === 'IMAGE_TOO_LARGE' ||
          code === 'UNSUPPORTED_IMAGE_TYPE'
        ) {
          return c.json(
            {
              error:
                code === 'IMAGE_TOO_LARGE'
                  ? '画像は 10MB 以下にしてください。'
                  : code === 'UNSUPPORTED_IMAGE_TYPE'
                    ? 'PNG / JPEG / PDF のみ対応しています。'
                    : '画像データが無効です。',
            },
            400,
          );
        }
        if (code === 'AI_IMAGE_ANALYSIS_FAILED') {
          return c.json(
            { error: '画像解析に失敗しました。別の画像で試してください。' },
            502,
          );
        }
      }
      throw e;
    }
  });

  return app;
}
