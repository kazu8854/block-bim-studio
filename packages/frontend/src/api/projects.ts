import type { Project, ProjectMetadata, ProjectSummary } from '@block-bim-studio/shared';
import {
  ArchiveProjectResponseSchema,
  CreateProjectResponseSchema,
  DuplicateProjectResponseSchema,
  ProjectDetailResponseSchema,
  ProjectListResponseSchema,
} from '@block-bim-studio/shared';
import { stripStub } from '@/api/stub';

/** Vite dev の proxy / 本番の同一オリジンで `/api` に届ける */
const PROJECTS_BASE = '/api/projects';

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error('サーバー応答を JSON として解釈できません');
  }
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const res = await fetch(PROJECTS_BASE);
  if (!res.ok) {
    throw new Error(`プロジェクト一覧の取得に失敗しました (${String(res.status)})`);
  }
  const raw = await readJson(res);
  const parsed = ProjectListResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('ProjectListResponseSchema', parsed.error.flatten());
    throw new Error('プロジェクト一覧のレスポンス形式が API 契約と一致しません');
  }
  return stripStub(parsed.data).items;
}

export async function createProject(input: {
  name: string;
  metadata?: ProjectMetadata;
}): Promise<Project> {
  const res = await fetch(PROJECTS_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`プロジェクト作成に失敗しました (${String(res.status)})`);
  }
  const raw = await readJson(res);
  const parsed = CreateProjectResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('CreateProjectResponseSchema', parsed.error.flatten());
    throw new Error('プロジェクト作成レスポンスが API 契約と一致しません（_stub 等を確認）');
  }
  return stripStub(parsed.data) as Project;
}

export async function getProject(id: string): Promise<Project | null> {
  const res = await fetch(`${PROJECTS_BASE}/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`プロジェクト取得に失敗しました (${String(res.status)})`);
  }
  const raw = await readJson(res);
  const parsed = ProjectDetailResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('ProjectDetailResponseSchema', parsed.error.flatten());
    throw new Error('プロジェクト詳細のレスポンス形式が API 契約と一致しません');
  }
  return stripStub(parsed.data) as Project;
}

export async function updateProject(project: Project): Promise<Project> {
  const res = await fetch(`${PROJECTS_BASE}/${encodeURIComponent(project.id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  if (!res.ok) {
    throw new Error(`プロジェクト保存に失敗しました (${String(res.status)})`);
  }
  const raw = await readJson(res);
  const parsed = ProjectDetailResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('ProjectDetailResponseSchema (PUT)', parsed.error.flatten());
    throw new Error('プロジェクト保存レスポンスが API 契約と一致しません');
  }
  return stripStub(parsed.data) as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`${PROJECTS_BASE}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (res.status === 404) throw new Error('プロジェクトが見つかりません');
  if (!res.ok) {
    throw new Error(`削除に失敗しました (${String(res.status)})`);
  }
}

export async function duplicateProject(id: string): Promise<Project> {
  const res = await fetch(
    `${PROJECTS_BASE}/${encodeURIComponent(id)}/duplicate`,
    { method: 'POST' },
  );
  if (!res.ok) {
    throw new Error(`複製に失敗しました (${String(res.status)})`);
  }
  const raw = await readJson(res);
  const parsed = DuplicateProjectResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('DuplicateProjectResponseSchema', parsed.error.flatten());
    throw new Error('複製レスポンスが API 契約と一致しません');
  }
  return stripStub(parsed.data) as Project;
}

export async function setProjectStatus(
  id: string,
  status: Project['status'],
): Promise<Project> {
  const res = await fetch(
    `${PROJECTS_BASE}/${encodeURIComponent(id)}/archive`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    },
  );
  if (!res.ok) {
    throw new Error(`ステータス更新に失敗しました (${String(res.status)})`);
  }
  const raw = await readJson(res);
  const parsed = ArchiveProjectResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('ArchiveProjectResponseSchema', parsed.error.flatten());
    throw new Error('アーカイブレスポンスが API 契約と一致しません');
  }
  return stripStub(parsed.data) as Project;
}
