import { describe, expect, it } from 'vitest';
import { MockDbAdapter } from '../../src/adapters/mock-db-adapter.js';

describe('MockDbAdapter CRUD flow', () => {
  it('create → get → update → delete', async () => {
    const db = new MockDbAdapter();
    const created = await db.createProject({ name: 'Flow' });
    expect(created.name).toBe('Flow');

    const got = await db.getProject(created.id);
    expect(got?.id).toBe(created.id);

    const updated = await db.updateProject({
      ...created,
      name: 'Flow2',
      status: 'active',
    });
    expect(updated.name).toBe('Flow2');

    await db.deleteProject(created.id);
    expect(await db.getProject(created.id)).toBeNull();
  });

  it('duplicate creates new id', async () => {
    const db = new MockDbAdapter();
    const a = await db.createProject({ name: 'Orig' });
    const b = await db.duplicateProject(a.id);
    expect(b.id).not.toBe(a.id);
    expect(b.name).toContain('copy');
  });
});
