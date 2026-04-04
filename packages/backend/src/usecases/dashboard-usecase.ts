import {
  calculateCostFromBlocks,
  estimateGrossFloorAreaM2,
  quantityByMaterialFromBlocks,
  scheduleProgressPercentFromProject,
  scheduleSpanDaysFromProject,
  type Project,
  type ProjectSummary,
} from '@block-bim-studio/shared';
import type { DbPort } from '../adapters/db-port.js';

function toSummary(p: Project): ProjectSummary {
  const cost = calculateCostFromBlocks(p.blocks);
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    blockCount: p.blocks.length,
    totalCost: cost.total > 0 ? cost.total : undefined,
    updatedAt: p.updatedAt,
  };
}

export class DashboardUsecase {
  constructor(private readonly db: DbPort) {}

  async get(projectId: string) {
    const p = await this.db.getProject(projectId);
    if (!p) return null;
    const cost = calculateCostFromBlocks(p.blocks);
    const costByIfcType: Record<string, number> = {};
    for (const [t, row] of Object.entries(cost.byType)) {
      costByIfcType[t] = row.cost;
    }
    return {
      projectId: p.id,
      blockCount: p.blocks.length,
      totalCostEstimate: cost.total > 0 ? cost.total : undefined,
      scheduleProgressPercent: scheduleProgressPercentFromProject(p),
      quantityByType: quantityByMaterialFromBlocks(p.blocks),
      costByIfcType,
    };
  }

  async compare(projectIds: string[]) {
    if (projectIds.length < 2) {
      const projects: ProjectSummary[] = [];
      for (const id of projectIds) {
        const p = await this.db.getProject(id);
        if (p) projects.push(toSummary(p));
      }
      return {
        projects,
        deltas: [],
        message: '比較には2件以上のプロジェクトを選択してください。',
      };
    }

    const projects: ProjectSummary[] = [];
    for (const id of projectIds) {
      const p = await this.db.getProject(id);
      if (p) projects.push(toSummary(p));
    }

    const costById: Record<string, number> = {};
    const blocksById: Record<string, number> = {};
    const floorById: Record<string, number> = {};
    const spanById: Record<string, number> = {};
    const costPerM2ById: Record<string, number> = {};

    for (const id of projectIds) {
      const p = await this.db.getProject(id);
      if (!p) continue;
      const cost = calculateCostFromBlocks(p.blocks);
      costById[p.id] = cost.total;
      blocksById[p.id] = p.blocks.length;
      const gfa = estimateGrossFloorAreaM2(p.blocks);
      floorById[p.id] = gfa;
      spanById[p.id] = scheduleSpanDaysFromProject(p);
      costPerM2ById[p.id] = gfa > 0 ? cost.total / gfa : 0;
    }

    const deltas = [
      { metric: 'totalCostEstimate', valuesByProjectId: costById },
      { metric: 'blockCount', valuesByProjectId: blocksById },
      { metric: 'grossFloorAreaM2', valuesByProjectId: floorById },
      { metric: 'scheduleSpanDays', valuesByProjectId: spanById },
      { metric: 'costPerFloorAreaM2', valuesByProjectId: costPerM2ById },
    ];

    return { projects, deltas };
  }
}
