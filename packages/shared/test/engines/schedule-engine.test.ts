import { describe, expect, it } from 'vitest';
import type { Project } from '../../src/models/project.js';
import type { ScheduleInfo } from '../../src/models/schedule.js';
import {
  analyzeCriticalPathFromProject,
  buildGanttChartFromProject,
  computeEndDateFromStartAndDuration,
  detectScheduleCycle,
  validateProjectSchedules,
} from '../../src/engines/schedule-engine.js';

function baseProject(overrides: Partial<Project> = {}): Project {
  const now = '2024-06-01T00:00:00.000Z';
  return {
    id: '20000000-0000-4000-8000-000000000001',
    name: 'T',
    status: 'draft',
    metadata: {},
    blocks: [],
    schedules: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('schedule-engine', () => {
  it('computeEndDateFromStartAndDuration', () => {
    const start = '2024-01-01T00:00:00.000Z';
    expect(computeEndDateFromStartAndDuration(start, 1)).toBe(
      '2024-01-01T00:00:00.000Z',
    );
    expect(computeEndDateFromStartAndDuration(start, 3)).toBe(
      '2024-01-03T00:00:00.000Z',
    );
  });

  it('validateProjectSchedules rejects end before start', () => {
    const s: ScheduleInfo = {
      blockId: '10000000-0000-4000-8000-000000000001',
      startDate: '2024-02-05T00:00:00.000Z',
      endDate: '2024-02-01T00:00:00.000Z',
      durationDays: 2,
      dependencies: [],
      status: 'not_started',
    };
    const p = baseProject({ schedules: [s], blocks: [] });
    const e = validateProjectSchedules(p);
    expect(e.some((x) => x.includes('終了日'))).toBe(true);
  });

  it('validateProjectSchedules unknown predecessor', () => {
    const s: ScheduleInfo = {
      blockId: '10000000-0000-4000-8000-000000000001',
      startDate: '2024-02-01T00:00:00.000Z',
      endDate: '2024-02-02T00:00:00.000Z',
      durationDays: 2,
      dependencies: [
        { blockId: '99999999-9999-4999-8999-999999999999', type: 'FS' },
      ],
      status: 'not_started',
    };
    const p = baseProject({ schedules: [s] });
    expect(validateProjectSchedules(p).some((x) => x.includes('未知'))).toBe(
      true,
    );
  });

  it('detectScheduleCycle', () => {
    const a = '10000000-0000-4000-8000-000000000001';
    const b = '10000000-0000-4000-8000-000000000002';
    expect(detectScheduleCycle([a, b], [])).toBe(false);
    expect(
      detectScheduleCycle(
        [a, b],
        [
          { from: a, to: b },
          { from: b, to: a },
        ],
      ),
    ).toBe(true);
  });

  it('buildGanttChartFromProject empty schedules', () => {
    const p = baseProject();
    const g = buildGanttChartFromProject(p);
    expect(g.tasks).toHaveLength(0);
    expect(g.dependencyEdges).toHaveLength(0);
    expect(g.message).toMatch(/工程/);
  });

  it('buildGanttChartFromProject tasks and edges', () => {
    const bid = '10000000-0000-4000-8000-000000000001';
    const bid2 = '10000000-0000-4000-8000-000000000002';
    const s1: ScheduleInfo = {
      blockId: bid,
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-02T00:00:00.000Z',
      durationDays: 2,
      dependencies: [],
      status: 'not_started',
    };
    const s2: ScheduleInfo = {
      blockId: bid2,
      startDate: '2024-01-03T00:00:00.000Z',
      endDate: '2024-01-04T00:00:00.000Z',
      durationDays: 2,
      dependencies: [{ blockId: bid, type: 'FS' }],
      status: 'in_progress',
    };
    const p = baseProject({
      blocks: [
        {
          id: bid,
          name: 'A',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 1, height: 1, depth: 1 },
          propertySets: [],
        },
        {
          id: bid2,
          name: 'B',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 1, height: 1, depth: 1 },
          propertySets: [],
        },
      ],
      schedules: [s1, s2],
    });
    const g = buildGanttChartFromProject(p);
    expect(g.tasks).toHaveLength(2);
    expect(g.dependencyEdges).toHaveLength(1);
    expect(g.dependencyEdges[0]?.fromBlockId).toBe(bid);
    expect(g.dependencyEdges[0]?.toBlockId).toBe(bid2);
  });

  it('analyzeCriticalPathFromProject FS chain', () => {
    const bid = '10000000-0000-4000-8000-000000000001';
    const bid2 = '10000000-0000-4000-8000-000000000002';
    const s1: ScheduleInfo = {
      blockId: bid,
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-01T00:00:00.000Z',
      durationDays: 1,
      dependencies: [],
      status: 'not_started',
    };
    const s2: ScheduleInfo = {
      blockId: bid2,
      startDate: '2024-01-02T00:00:00.000Z',
      endDate: '2024-01-03T00:00:00.000Z',
      durationDays: 2,
      dependencies: [{ blockId: bid, type: 'FS' }],
      status: 'not_started',
    };
    const p = baseProject({
      blocks: [
        {
          id: bid,
          name: 'A',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 1, height: 1, depth: 1 },
          propertySets: [],
        },
        {
          id: bid2,
          name: 'B',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 1, height: 1, depth: 1 },
          propertySets: [],
        },
      ],
      schedules: [s1, s2],
    });
    const c = analyzeCriticalPathFromProject(p);
    expect(c.blockAnalysis).toHaveLength(2);
    expect(c.criticalPath.length).toBeGreaterThanOrEqual(1);
    expect(c.totalDuration).toBeGreaterThanOrEqual(1);
    expect(c.message).toBeUndefined();
  });

  it('analyzeCriticalPathFromProject cycle returns message', () => {
    const a = '10000000-0000-4000-8000-000000000001';
    const b = '10000000-0000-4000-8000-000000000002';
    const s1: ScheduleInfo = {
      blockId: a,
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: '2024-01-01T00:00:00.000Z',
      durationDays: 1,
      dependencies: [{ blockId: b, type: 'FS' }],
      status: 'not_started',
    };
    const s2: ScheduleInfo = {
      blockId: b,
      startDate: '2024-01-02T00:00:00.000Z',
      endDate: '2024-01-02T00:00:00.000Z',
      durationDays: 1,
      dependencies: [{ blockId: a, type: 'FS' }],
      status: 'not_started',
    };
    const p = baseProject({
      blocks: [],
      schedules: [s1, s2],
    });
    const c = analyzeCriticalPathFromProject(p);
    expect(c.criticalPath).toHaveLength(0);
    expect(c.message).toMatch(/循環/);
  });
});
