import {
  EnvironmentCheckResponseSchema,
  RegulationCheckResponseSchema,
  SafetyCheckResponseSchema,
  StructureCheckResponseSchema,
} from '@block-bim-studio/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { CheckUsecase } from '../usecases/check-usecase.js';
import { STUB_LEVEL_2_SIMULATION } from './stub.js';

const ProjectIdBodySchema = z.object({
  projectId: z.string().uuid(),
});

export function createCheckApp(checkUsecase: CheckUsecase) {
  const app = new Hono();

  app.post('/structure', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const result = await checkUsecase.structure(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = StructureCheckResponseSchema.parse({
      ...result,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  app.post('/regulation', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const result = await checkUsecase.regulation(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = RegulationCheckResponseSchema.parse({
      ...result,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  app.post('/environment', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const result = await checkUsecase.environment(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = EnvironmentCheckResponseSchema.parse({
      ...result,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  app.post('/safety', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const result = await checkUsecase.safety(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = SafetyCheckResponseSchema.parse({
      ...result,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  return app;
}
