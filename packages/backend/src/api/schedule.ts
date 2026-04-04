import {
  CriticalPathResponseSchema,
  GanttResponseSchema,
} from '@block-bim-studio/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { ScheduleUsecase } from '../usecases/schedule-usecase.js';
import { STUB_LEVEL_0 } from './stub.js';

const ProjectIdBodySchema = z.object({
  projectId: z.string().uuid(),
});

export function createScheduleApp(scheduleUsecase: ScheduleUsecase) {
  const app = new Hono();

  app.post('/gantt', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const result = await scheduleUsecase.gantt(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = GanttResponseSchema.parse({ ...result, ...STUB_LEVEL_0 });
    return c.json(body);
  });

  app.post('/critical-path', zValidator('json', ProjectIdBodySchema), async (c) => {
    const { projectId } = c.req.valid('json');
    const result = await scheduleUsecase.criticalPath(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = CriticalPathResponseSchema.parse({ ...result, ...STUB_LEVEL_0 });
    return c.json(body);
  });

  return app;
}
