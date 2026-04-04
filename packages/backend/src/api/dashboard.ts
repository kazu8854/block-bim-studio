import { DashboardResponseSchema } from '@block-bim-studio/shared';
import { Hono } from 'hono';
import type { DashboardUsecase } from '../usecases/dashboard-usecase.js';
import { STUB_LEVEL_2_SIMULATION } from './stub.js';

export function createDashboardApp(dashboardUsecase: DashboardUsecase) {
  const app = new Hono();

  app.get('/:projectId', async (c) => {
    const projectId = c.req.param('projectId');
    const result = await dashboardUsecase.get(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = DashboardResponseSchema.parse({
      ...result,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  return app;
}
