import type { Block, Project, ProjectSummary } from '@block-bim-studio/shared';
import {
  AgentProjectDetailResponseSchema,
  AgentProjectListResponseSchema,
  DuplicateProjectResponseSchema,
  ProjectDetailResponseSchema,
  ProjectListResponseSchema,
  ProjectSchema,
  roundTripProjectThroughJson,
} from '@block-bim-studio/shared';
import { describe, expect, it } from 'vitest';
import { createTestApp, createTestProject, sampleBlock } from '../helpers.js';

const jsonHeaders = { 'Content-Type': 'application/json' };

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** ProjectList の検索・ソートと同じロジック（フロントと整合する結合検証用） */
function filterProjectsByName(items: ProjectSummary[], q: string): ProjectSummary[] {
  const t = q.trim().toLowerCase();
  if (!t) return items;
  return items.filter((p) => p.name.toLowerCase().includes(t));
}

function sortProjects(items: ProjectSummary[], sortValue: string): ProjectSummary[] {
  const parts = sortValue.split('-');
  const key = parts[0] as 'status' | 'updatedAt' | 'blockCount' | 'totalCost';
  const dir = parts[1] as 'asc' | 'desc';
  const sign = dir === 'desc' ? -1 : 1;
  return [...items].sort((a, b) => {
    if (key === 'updatedAt') {
      return a.updatedAt.localeCompare(b.updatedAt) * sign;
    }
    if (key === 'status') {
      return a.status.localeCompare(b.status) * sign;
    }
    if (key === 'blockCount') {
      return (a.blockCount - b.blockCount) * sign;
    }
    if (key === 'totalCost') {
      return ((a.totalCost ?? 0) - (b.totalCost ?? 0)) * sign;
    }
    return 0;
  });
}

async function getProjectJson(
  app: ReturnType<typeof createTestApp>,
  id: string,
): Promise<Project> {
  const res = await app.request(`/api/projects/${id}`);
  expect(res.status).toBe(200);
  const raw = await res.json();
  ProjectDetailResponseSchema.parse(raw);
  const { _stub: _s, _stubLevel: _l, ...project } = raw as Project & {
    _stub: boolean;
    _stubLevel: number;
  };
  return project as Project;
}

async function putProject(
  app: ReturnType<typeof createTestApp>,
  project: Project,
): Promise<Project> {
  const res = await app.request(`/api/projects/${project.id}`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify(project),
  });
  expect(res.status).toBe(200);
  const raw = await res.json();
  ProjectDetailResponseSchema.parse(raw);
  const { _stub: _s, _stubLevel: _l, ...next } = raw as Project & {
    _stub: boolean;
    _stubLevel: number;
  };
  return next as Project;
}

describe('Phase 1 integration (group A core)', () => {
  it('フルフロー: 作成 → ブロック追加 → 属性変更 → 保存 → 再読み込み', async () => {
    const app = createTestApp();
    const created = await createTestProject(app);
    let p = await getProjectJson(app, created.id);
    expect(p.blocks).toHaveLength(0);

    const wall: Block = {
      ...sampleBlock,
      id: crypto.randomUUID(),
      name: 'Integration Wall',
      propertySets: [...sampleBlock.propertySets],
    };
    p = { ...p, blocks: [wall] };
    p = await putProject(app, p);
    expect(p.blocks).toHaveLength(1);
    expect(p.blocks[0]?.name).toBe('Integration Wall');

    let reloaded = await getProjectJson(app, created.id);
    expect(reloaded.blocks).toHaveLength(1);

    const renamed: Block = { ...reloaded.blocks[0]!, name: 'Renamed Wall' };
    reloaded = { ...reloaded, blocks: [renamed] };
    reloaded = await putProject(app, reloaded);

    const again = await getProjectJson(app, created.id);
    expect(again.blocks[0]?.name).toBe('Renamed Wall');
  });

  it('プロジェクト一覧の検索・ソート（API + クライアント側ロジック相当）', async () => {
    const app = createTestApp();
    await app.request('/api/projects', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: 'Zebra Project' }),
    });
    await sleep(3);
    await app.request('/api/projects', {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ name: 'Apple Project' }),
    });

    const listRes = await app.request('/api/projects');
    expect(listRes.status).toBe(200);
    const listRaw = await listRes.json();
    ProjectListResponseSchema.parse(listRaw);
    const items = (listRaw as { items: ProjectSummary[] }).items;

    const appleOnly = filterProjectsByName(items, 'apple');
    expect(appleOnly).toHaveLength(1);
    expect(appleOnly[0]?.name).toContain('Apple');

    const sortedByStatus = sortProjects(items, 'status-asc');
    const names = sortedByStatus.map((x) => x.name);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
  });

  it('複製・削除・アーカイブ', async () => {
    const app = createTestApp();
    const seed = await createTestProject(app);
    let p = await getProjectJson(app, seed.id);
    const wall: Block = {
      ...sampleBlock,
      id: crypto.randomUUID(),
      name: 'To Copy',
      propertySets: [...sampleBlock.propertySets],
    };
    p = await putProject(app, { ...p, blocks: [wall] });

    const dupRes = await app.request(`/api/projects/${p.id}/duplicate`, {
      method: 'POST',
    });
    expect(dupRes.status).toBe(201);
    const dupRaw = await dupRes.json();
    const dupParsed = DuplicateProjectResponseSchema.parse(dupRaw);
    expect(dupParsed.blocks).toHaveLength(1);
    expect(dupParsed.name).toContain('copy');

    const archRes = await app.request(`/api/projects/${dupParsed.id}/archive`, {
      method: 'PATCH',
      headers: jsonHeaders,
      body: JSON.stringify({ status: 'archived' }),
    });
    expect(archRes.status).toBe(200);
    const archived = await archRes.json();
    expect(archived.status).toBe('archived');

    const delRes = await app.request(`/api/projects/${dupParsed.id}`, {
      method: 'DELETE',
    });
    expect(delRes.status).toBe(204);
    const gone = await app.request(`/api/projects/${dupParsed.id}`);
    expect(gone.status).toBe(404);
  });

  it('JSON シリアライズ／デシリアライズのラウンドトリップ', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);
    const loaded = await getProjectJson(app, p.id);
    const block: Block = {
      ...sampleBlock,
      id: crypto.randomUUID(),
      propertySets: [...sampleBlock.propertySets],
    };
    const withBlock = await putProject(app, { ...loaded, blocks: [block] });
    const rt = roundTripProjectThroughJson(withBlock);
    expect(ProjectSchema.safeParse(rt).success).toBe(true);
    expect(rt.id).toBe(withBlock.id);
    expect(rt.blocks).toHaveLength(1);
    expect(rt.blocks[0]?.id).toBe(block.id);
  });

  it('Agent GET /project/:id と /projects が Level 2 メタを返す', async () => {
    const app = createTestApp();
    const p = await createTestProject(app);

    const one = await app.request(`/api/agent/project/${p.id}`);
    expect(one.status).toBe(200);
    const oneJson = await one.json();
    AgentProjectDetailResponseSchema.parse(oneJson);
    expect(oneJson).toMatchObject({ _stub: false, _stubLevel: 2 });

    const list = await app.request('/api/agent/projects');
    expect(list.status).toBe(200);
    const listJson = await list.json();
    AgentProjectListResponseSchema.parse(listJson);
    expect(listJson).toMatchObject({ _stub: false, _stubLevel: 2 });
    expect(Array.isArray(listJson.projects)).toBe(true);
  });
});
