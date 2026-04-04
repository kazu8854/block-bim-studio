import { describe, expect, it } from 'vitest';
import {
  ArchiveProjectResponseSchema,
  CreateProjectResponseSchema,
  DuplicateProjectResponseSchema,
  ProjectDetailResponseSchema,
  ProjectListResponseSchema,
  ProjectSchema,
} from '@block-bim-studio/shared';
import { createTestApp, createTestProject } from './helpers.js';

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

    const listRes = await app.request('/api/projects');
    expect(listRes.status).toBe(200);
    ProjectListResponseSchema.parse(await listRes.json());

    const getRes = await app.request(`/api/projects/${created.id}`);
    expect(getRes.status).toBe(200);
    const got = ProjectDetailResponseSchema.parse(await getRes.json());
    expect(got.id).toBe(created.id);

    const updated: typeof got = {
      ...got,
      name: 'Alpha Renamed',
      updatedAt: new Date().toISOString(),
    };
    const putRes = await app.request(`/api/projects/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    expect(putRes.status).toBe(200);
    ProjectDetailResponseSchema.parse(await putRes.json());

    const dupRes = await app.request(`/api/projects/${created.id}/duplicate`, {
      method: 'POST',
    });
    expect(dupRes.status).toBe(201);
    DuplicateProjectResponseSchema.parse(await dupRes.json());

    const archRes = await app.request(`/api/projects/${created.id}/archive`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
    expect(archRes.status).toBe(200);
    ArchiveProjectResponseSchema.parse(await archRes.json());

    const delRes = await app.request(`/api/projects/${created.id}`, {
      method: 'DELETE',
    });
    expect(delRes.status).toBe(204);
  });

  it('GET unknown project returns 404', async () => {
    const app = createTestApp();
    const res = await app.request(
      '/api/projects/20000000-0000-4000-8000-000000000099',
    );
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
