import {
  AiGenerateFromImageResponseSchema,
  AiGenerateFromTextResponseSchema,
  AiSuggestStructureResponseSchema,
} from '@block-bim-studio/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AIUsecase } from '../usecases/ai-usecase.js';
import { STUB_LEVEL_0 } from './stub.js';

const ProjectIdBodySchema = z.object({
  projectId: z.string().uuid(),
});

const TextBodySchema = z.object({
  text: z.string().min(1),
});

const ImageBodySchema = z.object({
  imageBase64: z.string().min(1),
});

export function createAiApp(aiUsecase: AIUsecase) {
  const app = new Hono();

  app.post('/suggest-structure', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const suggestions = await aiUsecase.suggestForProject(projectId);
    if (suggestions === null) return c.json({ error: 'Project not found' }, 404);
    const body = AiSuggestStructureResponseSchema.parse({
      suggestions,
      ...STUB_LEVEL_0,
    });
    return c.json(body);
  });

  app.post('/generate-from-text', zValidator('json', TextBodySchema), async (c) => {
    const { text } = c.req.valid('json');
    const result = await aiUsecase.generateFromText(text);
    const body = AiGenerateFromTextResponseSchema.parse({ ...result, ...STUB_LEVEL_0 });
    return c.json(body);
  });

  app.post('/generate-from-image', zValidator('json', ImageBodySchema), async (c) => {
    const { imageBase64 } = c.req.valid('json');
    const result = await aiUsecase.generateFromImage(imageBase64);
    const body = AiGenerateFromImageResponseSchema.parse({ ...result, ...STUB_LEVEL_0 });
    return c.json(body);
  });

  return app;
}
