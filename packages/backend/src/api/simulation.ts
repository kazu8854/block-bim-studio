import {
  ClashSimulationResponseSchema,
  CostSimulationResponseSchema,
  QuantitySimulationResponseSchema,
} from '@block-bim-studio/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { SimulationUsecase } from '../usecases/simulation-usecase.js';
import { STUB_LEVEL_2_SIMULATION } from './stub.js';

const ProjectIdBodySchema = z.object({
  projectId: z.string().uuid(),
});

export function createSimulationApp(simulationUsecase: SimulationUsecase) {
  const app = new Hono();

  app.post('/quantity', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const result = await simulationUsecase.quantity(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = QuantitySimulationResponseSchema.parse({
      ...result,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  app.post('/cost', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const result = await simulationUsecase.cost(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = CostSimulationResponseSchema.parse({
      ...result,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  app.post('/clash', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const result = await simulationUsecase.clash(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = ClashSimulationResponseSchema.parse({
      ...result,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  return app;
}
