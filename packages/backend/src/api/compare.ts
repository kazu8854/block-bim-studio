import { CompareResponseSchema } from '@block-bim-studio/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { DashboardUsecase } from '../usecases/dashboard-usecase.js';
import { STUB_LEVEL_0 } from './stub.js';

const CompareBodySchema = z.object({
  projectIds: z.array(z.string().uuid()).min(2).max(32),
});

export function createCompareApp(dashboardUsecase: DashboardUsecase) {
  const app = new Hono();

  app.post('/', zValidator('json', CompareBodySchema), async (c) => {
    const { projectIds } = c.req.valid('json');
    const result = await dashboardUsecase.compare(projectIds);
    const body = CompareResponseSchema.parse({ ...result, ...STUB_LEVEL_0 });
    return c.json(body);
  });

  return app;
}
