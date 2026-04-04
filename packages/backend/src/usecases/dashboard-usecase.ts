import type { Project, ProjectSummary } from '@block-bim-studio/shared';
import type { DbPort } from '../adapters/db-port.js';

function toSummary(p: Project): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    blockCount: p.blocks.length,
    updatedAt: p.updatedAt,
  };
}

export class DashboardUsecase {
  constructor(private readonly db: DbPort) {}

  async get(projectId: string) {
    const p = await this.db.getProject(projectId);
    if (!p) return null;
    return {
      projectId: p.id,
      blockCount: p.blocks.length,
      scheduleProgressPercent: 0,
      quantityByType: {} as Record<string, number>,
    };
  }

  async compare(projectIds: string[]) {
    const projects: ProjectSummary[] = [];
    for (const id of projectIds) {
      const p = await this.db.getProject(id);
      if (p) projects.push(toSummary(p));
    }
    return { projects, deltas: [] };
  }
}
