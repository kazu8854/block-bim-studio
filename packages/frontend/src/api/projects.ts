import type { Project, ProjectMetadata, ProjectSummary } from '@block-bim-studio/shared';
import { apiClient } from '@/api/client';
import { stripStub } from '@/api/stub';

export async function listProjects(): Promise<ProjectSummary[]> {
  const res = await apiClient.api.projects.$get();
  if (!res.ok) throw new Error(`プロジェクト一覧の取得に失敗しました (${String(res.status)})`);
  const json = (await res.json()) as {
    items: ProjectSummary[];
    _stub: boolean;
    _stubLevel: number;
  };
  return stripStub(json).items;
}

export async function createProject(input: {
  name: string;
  metadata?: ProjectMetadata;
}): Promise<Project> {
  const res = await apiClient.api.projects.$post({ json: input });
  if (!res.ok) throw new Error(`プロジェクト作成に失敗しました (${String(res.status)})`);
  const json = (await res.json()) as Project & { _stub: boolean; _stubLevel: number };
  return stripStub(json) as Project;
}

export async function getProject(id: string): Promise<Project | null> {
  const res = await apiClient.api.projects[':id'].$get({ param: { id } });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`プロジェクト取得に失敗しました (${String(res.status)})`);
  }
  const json = (await res.json()) as Project & { _stub: boolean; _stubLevel: number };
  return stripStub(json) as Project;
}

export async function updateProject(project: Project): Promise<Project> {
  const res = await apiClient.api.projects[':id'].$put({
    param: { id: project.id },
    json: project,
  });
  if (!res.ok) {
    throw new Error(`プロジェクト保存に失敗しました (${String(res.status)})`);
  }
  const json = (await res.json()) as Project & { _stub: boolean; _stubLevel: number };
  return stripStub(json) as Project;
}

export async function deleteProject(id: string): Promise<void> {
  const res = await apiClient.api.projects[':id'].$delete({ param: { id } });
  if (res.status === 404) throw new Error('プロジェクトが見つかりません');
  if (!res.ok) {
    throw new Error(`削除に失敗しました (${String(res.status)})`);
  }
}

export async function duplicateProject(id: string): Promise<Project> {
  const res = await apiClient.api.projects[':id'].duplicate.$post({
    param: { id },
  });
  if (!res.ok) {
    throw new Error(`複製に失敗しました (${String(res.status)})`);
  }
  const json = (await res.json()) as Project & { _stub: boolean; _stubLevel: number };
  return stripStub(json) as Project;
}

export async function setProjectStatus(
  id: string,
  status: Project['status'],
): Promise<Project> {
  const res = await apiClient.api.projects[':id'].archive.$patch({
    param: { id },
    json: { status },
  });
  if (!res.ok) {
    throw new Error(`ステータス更新に失敗しました (${String(res.status)})`);
  }
  const json = (await res.json()) as Project & { _stub: boolean; _stubLevel: number };
  return stripStub(json) as Project;
}
