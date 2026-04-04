import {
  ArchiveProjectResponseSchema,
  CreateProjectResponseSchema,
  DuplicateProjectResponseSchema,
  ProjectDetailResponseSchema,
  ProjectListResponseSchema,
  ProjectMetadataSchema,
  ProjectSchema,
  ProjectStatusEnum,
} from '@block-bim-studio/shared';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import type { ProjectUsecase } from '../usecases/project-usecase.js';
import { STUB_LEVEL_2_PROJECT } from './stub.js';

const CreateBodySchema = z.object({
  name: z.string().min(1),
  metadata: ProjectMetadataSchema.optional(),
});

const ArchiveBodySchema = z.object({
  status: ProjectStatusEnum,
});

export function createProjectsApp(projectUsecase: ProjectUsecase) {
  const app = new Hono();

  app.get('/', async (c) => {
    const items = await projectUsecase.list();
    const body = ProjectListResponseSchema.parse({ items, ...STUB_LEVEL_2_PROJECT });
    return c.json(body);
  });

  app.post('/', zValidator('json', CreateBodySchema), async (c) => {
    const input = c.req.valid('json');
    const project = await projectUsecase.create(input);
    const body = CreateProjectResponseSchema.parse({ ...project, ...STUB_LEVEL_2_PROJECT });
    return c.json(body, 201);
  });

  app.get('/:id', async (c) => {
    const project = await projectUsecase.get(c.req.param('id'));
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    const body = ProjectDetailResponseSchema.parse({ ...project, ...STUB_LEVEL_2_PROJECT });
    return c.json(body);
  });

  app.put('/:id', zValidator('json', ProjectSchema), async (c) => {
    const id = c.req.param('id');
    const project = c.req.valid('json');
    if (project.id !== id) {
      return c.json({ error: 'Project id mismatch' }, 400);
    }
    let updated;
    try {
      updated = await projectUsecase.update(project);
    } catch (e) {
      if (e instanceof Error && e.message === 'PROJECT_NOT_FOUND') {
        return c.json({ error: 'Project not found' }, 404);
      }
      throw e;
    }
    const body = ProjectDetailResponseSchema.parse({ ...updated, ...STUB_LEVEL_2_PROJECT });
    return c.json(body);
  });

  app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const existing = await projectUsecase.get(id);
    if (!existing) {
      return c.json({ error: 'Project not found' }, 404);
    }
    await projectUsecase.delete(id);
    return c.body(null, 204);
  });

  app.post('/:id/duplicate', async (c) => {
    const id = c.req.param('id');
    try {
      const copy = await projectUsecase.duplicate(id);
      const body = DuplicateProjectResponseSchema.parse({ ...copy, ...STUB_LEVEL_2_PROJECT });
      return c.json(body, 201);
    } catch {
      return c.json({ error: 'Project not found' }, 404);
    }
  });

  app.patch('/:id/archive', zValidator('json', ArchiveBodySchema), async (c) => {
    const id = c.req.param('id');
    const { status } = c.req.valid('json');
    const updated = await projectUsecase.archiveProject(id, status);
    if (!updated) {
      return c.json({ error: 'Project not found' }, 404);
    }
    const body = ArchiveProjectResponseSchema.parse({ ...updated, ...STUB_LEVEL_2_PROJECT });
    return c.json(body);
  });

  return app;
}
