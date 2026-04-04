import type {
  Project,
  ProjectMetadata,
  ProjectStatus,
  ProjectSummary,
} from '@block-bim-studio/shared';
import type { DbPort } from '../adapters/db-port.js';

export class ProjectUsecase {
  constructor(private readonly db: DbPort) {}

  async list(): Promise<ProjectSummary[]> {
    return this.db.listProjects();
  }

  async get(id: string): Promise<Project | null> {
    return this.db.getProject(id);
  }

  async create(input: { name: string; metadata?: ProjectMetadata }): Promise<Project> {
    return this.db.createProject(input);
  }

  async update(project: Project): Promise<Project> {
    return this.db.updateProject(project);
  }

  async delete(id: string): Promise<void> {
    return this.db.deleteProject(id);
  }

  async duplicate(id: string): Promise<Project> {
    return this.db.duplicateProject(id);
  }

  async setStatus(id: string, status: ProjectStatus): Promise<Project | null> {
    const p = await this.db.getProject(id);
    if (!p) return null;
    return this.db.updateProject({ ...p, status, updatedAt: new Date().toISOString() });
  }

  /** アーカイブ等、ステータス変更（A1 要件の archiveProject） */
  async archiveProject(id: string, status: ProjectStatus): Promise<Project | null> {
    return this.setStatus(id, status);
  }
}
