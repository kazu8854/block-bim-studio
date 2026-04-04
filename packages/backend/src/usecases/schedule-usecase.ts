import {
  analyzeCriticalPathLevel0,
  buildGanttChartLevel0,
} from '@block-bim-studio/shared';
import type { DbPort } from '../adapters/db-port.js';

export class ScheduleUsecase {
  constructor(private readonly db: DbPort) {}

  async gantt(projectId: string) {
    const p = await this.db.getProject(projectId);
    if (!p) return null;
    return buildGanttChartLevel0(p);
  }

  async criticalPath(projectId: string) {
    const p = await this.db.getProject(projectId);
    if (!p) return null;
    return analyzeCriticalPathLevel0(p);
  }
}
