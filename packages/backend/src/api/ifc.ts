import {
  IfcExportResponseSchema,
  IfcImportResponseSchema,
} from '@block-bim-studio/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { IfcUsecase } from '../usecases/ifc-usecase.js';
import { STUB_LEVEL_2_SIMULATION } from './stub.js';

const ImportBodySchema = z.object({
  ifcBase64: z.string().min(1),
});

export function createIfcApp(ifcUsecase: IfcUsecase) {
  const app = new Hono();

  app.post('/export/:projectId', async (c) => {
    const projectId = c.req.param('projectId');
    const result = await ifcUsecase.exportProject(projectId);
    if (!result) return c.json({ error: 'Project not found' }, 404);
    const body = IfcExportResponseSchema.parse({
      ...result,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  app.post('/import', zValidator('json', ImportBodySchema), async (c) => {
    const { ifcBase64 } = c.req.valid('json');
    const result = await ifcUsecase.importIfc(ifcBase64);
    const body = IfcImportResponseSchema.parse({
      ...result,
      ...STUB_LEVEL_2_SIMULATION,
    });
    return c.json(body);
  });

  return app;
}
