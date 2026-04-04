import type { Project } from '../models/project.js';
import type { GanttChartData } from '../models/gantt.js';
import type { CriticalPathResult } from '../models/simulation-result.js';

export interface ScheduleEngine {
  buildGantt(project: Project): GanttChartData;
  analyzeCriticalPath(project: Project): CriticalPathResult;
}

export function buildGanttChartLevel0(project: Project): GanttChartData {
  const now = project.updatedAt;
  return {
    tasks: [],
    scaleStart: now,
    scaleEnd: now,
  };
}

export function analyzeCriticalPathLevel0(project: Project): CriticalPathResult {
  const now = project.updatedAt;
  return {
    criticalPath: [],
    totalDuration: 0,
    projectStartDate: now,
    projectEndDate: now,
    blockAnalysis: [],
  };
}
