import type { GanttChartData, GanttDependencyEdge } from '../models/gantt.js';
import type { Project } from '../models/project.js';
import type { Dependency, ScheduleInfo } from '../models/schedule.js';
import type { CriticalPathResult } from '../models/simulation-result.js';

export interface ScheduleEngine {
  buildGantt(project: Project): GanttChartData;
  analyzeCriticalPath(project: Project): CriticalPathResult;
}

/** UTC 日単位の整数インデックス（1970-01-01 基準の日） */
export function utcDayIndex(iso: string): number {
  return Math.floor(Date.parse(iso) / 86400000);
}

export function isoFromUtcDayIndex(day: number): string {
  return new Date(day * 86400000).toISOString();
}

/** 開始日を含む duration 日の最終日（終了日 ISO） */
export function computeEndDateFromStartAndDuration(
  startIso: string,
  durationDays: number,
): string {
  if (durationDays < 1) {
    throw new Error('durationDays must be positive');
  }
  const s = utcDayIndex(startIso);
  return isoFromUtcDayIndex(s + durationDays - 1);
}

export function validateProjectSchedules(project: Project): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const s of project.schedules) {
    if (utcDayIndex(s.endDate) < utcDayIndex(s.startDate)) {
      errors.push(`終了日が開始日より前です（ブロック ${s.blockId}）`);
    }
    seen.add(s.blockId);
  }
  const ids = [...seen];
  const edges: Array<{ from: string; to: string }> = [];
  for (const s of project.schedules) {
    for (const d of s.dependencies) {
      if (!seen.has(d.blockId)) {
        errors.push(`未知の先行ブロック: ${d.blockId}`);
      }
      edges.push({ from: d.blockId, to: s.blockId });
    }
  }
  if (detectScheduleCycle(ids, edges)) {
    errors.push('依存関係に循環があります。');
  }
  return errors;
}

export function detectScheduleCycle(
  nodeIds: string[],
  edges: Array<{ from: string; to: string }>,
): boolean {
  const idSet = new Set(nodeIds);
  const adj = new Map<string, string[]>();
  const indeg = new Map<string, number>();
  for (const id of nodeIds) {
    adj.set(id, []);
    indeg.set(id, 0);
  }
  for (const e of edges) {
    if (!idSet.has(e.from) || !idSet.has(e.to)) continue;
    adj.get(e.from)!.push(e.to);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  const q: string[] = [];
  for (const id of nodeIds) {
    if ((indeg.get(id) ?? 0) === 0) q.push(id);
  }
  let visited = 0;
  while (q.length) {
    const u = q.pop()!;
    visited++;
    for (const v of adj.get(u) ?? []) {
      const n = (indeg.get(v) ?? 0) - 1;
      indeg.set(v, n);
      if (n === 0) q.push(v);
    }
  }
  return visited !== nodeIds.length;
}

function scheduleByBlockId(
  schedules: ScheduleInfo[],
): Map<string, ScheduleInfo> {
  const m = new Map<string, ScheduleInfo>();
  for (const s of schedules) {
    m.set(s.blockId, s);
  }
  return m;
}

function buildSuccessors(schedules: ScheduleInfo[]): Map<string, string[]> {
  const succ = new Map<string, string[]>();
  for (const s of schedules) {
    for (const d of s.dependencies) {
      const list = succ.get(d.blockId) ?? [];
      list.push(s.blockId);
      succ.set(d.blockId, list);
    }
  }
  return succ;
}

function findDep(
  pred: string,
  succBlock: string,
  byBlock: Map<string, ScheduleInfo>,
): Dependency | undefined {
  const sch = byBlock.get(succBlock);
  return sch?.dependencies.find((d) => d.blockId === pred);
}

/** Level 0 互換 */
export function buildGanttChartLevel0(project: Project): GanttChartData {
  const now = project.updatedAt;
  return {
    tasks: [],
    dependencyEdges: [],
    scaleStart: now,
    scaleEnd: now,
  };
}

export function buildGanttChartFromProject(project: Project): GanttChartData {
  const schedules = project.schedules;
  if (schedules.length === 0) {
    return {
      tasks: [],
      dependencyEdges: [],
      scaleStart: project.updatedAt,
      scaleEnd: project.updatedAt,
      message: '工程情報がありません。',
    };
  }
  const nameById = new Map(project.blocks.map((b) => [b.id, b.name]));
  const validation = validateProjectSchedules(project);
  const edges: GanttDependencyEdge[] = [];
  const tasks = schedules.map((s) => {
    for (const d of s.dependencies) {
      edges.push({
        fromBlockId: d.blockId,
        toBlockId: s.blockId,
        type: d.type,
      });
    }
    return {
      blockId: s.blockId,
      name: nameById.get(s.blockId) ?? s.blockId.slice(0, 8),
      startDate: s.startDate,
      endDate: s.endDate,
      durationDays: s.durationDays,
      dependencyBlockIds: s.dependencies.map((d) => d.blockId),
      status: s.status,
    };
  });
  let minT = Infinity;
  let maxT = -Infinity;
  for (const s of schedules) {
    minT = Math.min(minT, Date.parse(s.startDate));
    maxT = Math.max(maxT, Date.parse(s.endDate));
  }
  return {
    tasks,
    dependencyEdges: edges,
    scaleStart: new Date(minT).toISOString(),
    scaleEnd: new Date(maxT).toISOString(),
    message: validation.length ? validation.join(' ') : undefined,
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

export function analyzeCriticalPathFromProject(
  project: Project,
): CriticalPathResult {
  const schedules = project.schedules;
  if (schedules.length === 0) {
    return {
      criticalPath: [],
      totalDuration: 0,
      projectStartDate: project.updatedAt,
      projectEndDate: project.updatedAt,
      blockAnalysis: [],
      message: '工程情報がありません。',
    };
  }
  const validation = validateProjectSchedules(project);
  if (validation.some((e) => e.includes('循環'))) {
    return {
      criticalPath: [],
      totalDuration: 0,
      projectStartDate: project.updatedAt,
      projectEndDate: project.updatedAt,
      blockAnalysis: [],
      message: validation.find((e) => e.includes('循環')) ?? '循環依存があります。',
    };
  }
  if (validation.length > 0) {
    return {
      criticalPath: [],
      totalDuration: 0,
      projectStartDate: project.updatedAt,
      projectEndDate: project.updatedAt,
      blockAnalysis: [],
      message: validation.join(' '),
    };
  }

  const byBlock = scheduleByBlockId(schedules);
  const ids = schedules.map((s) => s.blockId);
  const ES = new Map<string, number>();
  const EF = new Map<string, number>();
  const D = new Map<string, number>();
  for (const id of ids) {
    const sch = byBlock.get(id)!;
    D.set(id, sch.durationDays);
    ES.set(id, utcDayIndex(sch.startDate));
  }

  for (let iter = 0; iter < 120; iter++) {
    let changed = false;
    for (const id of ids) {
      const sch = byBlock.get(id)!;
      let es = ES.get(id)!;
      const d = D.get(id)!;
      for (const dep of sch.dependencies) {
        const p = dep.blockId;
        if (!ES.has(p) || !EF.has(p)) continue;
        const esp = ES.get(p)!;
        const efp = EF.get(p)!;
        let need = es;
        switch (dep.type) {
          case 'FS':
            need = Math.max(need, efp + 1);
            break;
          case 'SS':
            need = Math.max(need, esp);
            break;
          case 'FF':
            need = Math.max(need, efp - d + 1);
            break;
          case 'SF':
            need = Math.max(need, esp - d + 1);
            break;
        }
        if (need > es) {
          es = need;
          changed = true;
        }
      }
      ES.set(id, es);
      EF.set(id, es + d - 1);
    }
    if (!changed) break;
  }

  const T = Math.max(...ids.map((id) => EF.get(id)!));
  const minEs = Math.min(...ids.map((id) => ES.get(id)!));
  const totalDuration = T - minEs + 1;

  const LF = new Map<string, number>();
  const LS = new Map<string, number>();
  for (const id of ids) {
    LF.set(id, T);
    LS.set(id, T - D.get(id)! + 1);
  }

  const succByPred = buildSuccessors(schedules);
  for (let iter = 0; iter < 120; iter++) {
    let changed = false;
    for (const id of ids) {
      const di = D.get(id)!;
      const succs = succByPred.get(id) ?? [];
      let lf: number;
      if (succs.length === 0) {
        lf = T;
      } else {
        lf = Number.POSITIVE_INFINITY;
        for (const j of succs) {
          const dep = findDep(id, j, byBlock);
          if (!dep) continue;
          const lsj = LS.get(j)!;
          const lfj = LF.get(j)!;
          const esj = ES.get(j)!;
          const dj = D.get(j)!;
          switch (dep.type) {
            case 'FS':
              lf = Math.min(lf, lsj - 1);
              break;
            case 'SS':
              lf = Math.min(lf, lfj - dj + di);
              break;
            case 'FF':
              lf = Math.min(lf, lfj);
              break;
            case 'SF':
              lf = Math.min(lf, esj + di - 1);
              break;
          }
        }
        if (!Number.isFinite(lf)) lf = T;
        lf = Math.min(lf, T);
      }
      const prevLf = LF.get(id)!;
      if (lf !== prevLf) {
        changed = true;
      }
      LF.set(id, lf);
      LS.set(id, lf - di + 1);
    }
    if (!changed) break;
  }

  const blockAnalysis = ids.map((id) => {
    const es = ES.get(id)!;
    const ef = EF.get(id)!;
    const ls = LS.get(id)!;
    const lf = LF.get(id)!;
    const floatDays = Math.max(0, ls - es);
    return {
      blockId: id,
      earliestStart: isoFromUtcDayIndex(es),
      earliestFinish: isoFromUtcDayIndex(ef),
      latestStart: isoFromUtcDayIndex(ls),
      latestFinish: isoFromUtcDayIndex(lf),
      floatDays,
    };
  });

  const criticalPath = blockAnalysis
    .filter((b) => b.floatDays === 0)
    .sort(
      (a, b) =>
        utcDayIndex(a.earliestStart) - utcDayIndex(b.earliestStart),
    )
    .map((b) => b.blockId);

  return {
    criticalPath,
    totalDuration,
    projectStartDate: isoFromUtcDayIndex(minEs),
    projectEndDate: isoFromUtcDayIndex(T),
    blockAnalysis,
  };
}
