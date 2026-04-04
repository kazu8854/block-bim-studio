import { describe, expect, it } from 'vitest';
import {
  ArchiveProjectResponseSchema,
  CreateProjectResponseSchema,
  DuplicateProjectResponseSchema,
  ProjectDetailResponseSchema,
  ProjectListResponseSchema,
  ProjectSchema,
  roundTripProjectThroughJson,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

function assertLiveProjectMeta(body: { _stub: boolean; _stubLevel: number }) {
  expect(body._stub).toBe(false);
  expect(body._stubLevel).toBe(2);
}

describe('Project API contract', () => {
  it('POST /api/projects + list + get + put + duplicate + archive + delete', async () => {
    const app = createTestApp();

    const createRes = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alpha', metadata: { siteArea: 100 } }),
    });
    expect(createRes.status).toBe(201);
    const created = CreateProjectResponseSchema.parse(await createRes.json());
    assertLiveProjectMeta(created);

    const listRes = await app.request('/api/projects');
    expect(listRes.status).toBe(200);
    const listed = ProjectListResponseSchema.parse(await listRes.json());
    assertLiveProjectMeta(listed);

    const getRes = await app.request(`/api/projects/${created.id}`);
    expect(getRes.status).toBe(200);
    const got = ProjectDetailResponseSchema.parse(await getRes.json());
    assertLiveProjectMeta(got);
    expect(got.id).toBe(created.id);

    const { _stub: _s1, _stubLevel: _l1, ...projectForPut } = got;
    const updated = {
      ...projectForPut,
      name: 'Alpha Renamed',
      updatedAt: new Date().toISOString(),
    };
    const putRes = await app.request(`/api/projects/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    expect(putRes.status).toBe(200);
    const putBody = ProjectDetailResponseSchema.parse(await putRes.json());
    assertLiveProjectMeta(putBody);

    const dupRes = await app.request(`/api/projects/${created.id}/duplicate`, {
      method: 'POST',
    });
    expect(dupRes.status).toBe(201);
    const dup = DuplicateProjectResponseSchema.parse(await dupRes.json());
    assertLiveProjectMeta(dup);
    expect(dup.id).not.toBe(created.id);

    const archRes = await app.request(`/api/projects/${created.id}/archive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    expect(archRes.status).toBe(200);
    const arch = ArchiveProjectResponseSchema.parse(await archRes.json());
    assertLiveProjectMeta(arch);

    const delRes = await app.request(`/api/projects/${created.id}`, {
      method: 'DELETE',
    });
    expect(delRes.status).toBe(204);
  });

  it('CRUD integration: create → read → update → read → delete → missing', async () => {
    const app = createTestApp();
    const post = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'CRUD' }),
    });
    expect(post.status).toBe(201);
    const created = CreateProjectResponseSchema.parse(await post.json());
    const id = created.id;

    const g1 = await app.request(`/api/projects/${id}`);
    expect(g1.status).toBe(200);
    const p1 = ProjectDetailResponseSchema.parse(await g1.json());
    expect(p1.name).toBe('CRUD');

    const { _stub: _s, _stubLevel: _l, ...core } = p1;
    const p1rt = roundTripProjectThroughJson(core);
    const put = await app.request(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p1rt, name: 'CRUD Updated' }),
    });
    expect(put.status).toBe(200);
    const p2 = ProjectDetailResponseSchema.parse(await put.json());
    expect(p2.name).toBe('CRUD Updated');

    const g2 = await app.request(`/api/projects/${id}`);
    expect((await g2.json()).name).toBe('CRUD Updated');

    await app.request(`/api/projects/${id}`, { method: 'DELETE' });
    const g3 = await app.request(`/api/projects/${id}`);
    expect(g3.status).toBe(404);
  });

  it('duplicate remaps schedule blockIds to new block ids', async () => {
    const app = createTestApp();
    const blockId = 'cccccccc-dddd-4eee-ffff-000000000001';
    const project = {
      id: 'dddddddd-eeee-4fff-aaaa-000000000002',
      name: 'With Schedule',
      status: 'draft' as const,
      metadata: {},
      blocks: [
        {
          id: blockId,
          name: 'Col',
          ifcType: 'IfcColumn' as const,
          category: 'structure' as const,
          position: { x: 1, y: 0, z: 1 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 0.4, height: 3, depth: 0.4 },
          propertySets: [],
        },
      ],
      schedules: [
        {
          blockId,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-05T00:00:00.000Z',
          durationDays: 5,
          dependencies: [],
          status: 'not_started' as const,
        },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };
    const put = await app.request(`/api/projects/${project.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    expect(put.status).toBe(404);

    const cre = await app.request('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Seed' }),
    });
    const seed = CreateProjectResponseSchema.parse(await cre.json());
    const full = { ...project, id: seed.id };
    const save = await app.request(`/api/projects/${seed.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(full),
    });
    expect(save.status).toBe(200);

    const dupRes = await app.request(`/api/projects/${seed.id}/duplicate`, {
      method: 'POST',
    });
    expect(dupRes.status).toBe(201);
    const copy = DuplicateProjectResponseSchema.parse(await dupRes.json());
    expect(copy.blocks).toHaveLength(1);
    expect(copy.schedules).toHaveLength(1);
    expect(copy.schedules[0]?.blockId).toBe(copy.blocks[0]?.id);
  });

  it('GET unknown project returns 404', async () => {
    const app = createTestApp();
    const res = await app.request(
      '/api/projects/20000000-0000-4000-8000-000000000099',
    );
    expect(res.status).toBe(404);
  });

  it('PUT unknown project returns 404', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const unknownId = '20000000-0000-4000-8000-000000000088';
    const res = await app.request(`/api/projects/${unknownId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, id: unknownId }),
    });
    expect(res.status).toBe(404);
  });

  it('PUT with mismatched id returns 400', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const bad = { ...p, id: '30000000-0000-4000-8000-000000000099' };
    const res = await app.request(`/api/projects/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bad),
    });
    expect(res.status).toBe(400);
  });

  it('PUT validates ProjectSchema', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const res = await app.request(`/api/projects/${p.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...p, name: 'OK' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    ProjectSchema.parse(body);
  });
});
