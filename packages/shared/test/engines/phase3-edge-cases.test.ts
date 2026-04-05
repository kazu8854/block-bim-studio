import type { Project } from '../../src/models/project.js';
import { describe, expect, it } from 'vitest';
import { calculateQuantityFromBlocks } from '../../src/engines/quantity-engine.js';
import { detectClashesFromBlocks } from '../../src/engines/clash-engine.js';
import {
  buildGanttChartFromProject,
  detectScheduleCycle,
  validateProjectSchedules,
} from '../../src/engines/schedule-engine.js';

const now = '2024-06-01T12:00:00.000Z';

function baseProject(
  blocks: Project['blocks'],
  schedules: Project['schedules'],
): Project {
  return {
    id: '40000000-0000-4000-8000-000000000001',
    name: 'Edge',
    status: 'draft',
    metadata: {},
    blocks,
    schedules,
    createdAt: now,
    updatedAt: now,
  };
}

describe('Phase 3.2 — エッジケース（shared）', () => {
  it('空ブロックの数量はゼロ', () => {
    const q = calculateQuantityFromBlocks([]);
    expect(q.total.count).toBe(0);
    expect(q.total.volume).toBe(0);
  });

  it('干渉はブロックが 2 未満ならメッセージのみ', () => {
    const r0 = detectClashesFromBlocks([]);
    expect(r0.clashes).toHaveLength(0);
    expect(r0.message).toMatch(/2 未満/);

    const r1 = detectClashesFromBlocks([
      {
        id: '50000000-0000-4000-8000-000000000001',
        name: 'A',
        ifcType: 'IfcWall',
        category: 'structure',
        position: { x: 0, y: 0.5, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1, height: 1, depth: 1 },
        propertySets: [],
      },
    ]);
    expect(r1.clashes).toHaveLength(0);
    expect(r1.message).toMatch(/2 未満/);
  });

  it('工程なしのガントはメッセージ付きで空', () => {
    const p = baseProject([], []);
    const g = buildGanttChartFromProject(p);
    expect(g.tasks).toHaveLength(0);
    expect(g.message).toMatch(/工程/);
  });

  it('循環依存を検出する', () => {
    const idA = '60000000-0000-4000-8000-0000000000a1';
    const idB = '60000000-0000-4000-8000-0000000000b1';
    const p = baseProject(
      [
        {
          id: idA,
          name: 'A',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 1, height: 1, depth: 1 },
          propertySets: [],
        },
        {
          id: idB,
          name: 'B',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 2, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 1, height: 1, depth: 1 },
          propertySets: [],
        },
      ],
      [
        {
          blockId: idA,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-01T00:00:00.000Z',
          durationDays: 1,
          dependencies: [{ blockId: idB, type: 'FS' }],
          status: 'not_started',
        },
        {
          blockId: idB,
          startDate: '2024-01-02T00:00:00.000Z',
          endDate: '2024-01-02T00:00:00.000Z',
          durationDays: 1,
          dependencies: [{ blockId: idA, type: 'FS' }],
          status: 'not_started',
        },
      ],
    );
    const errs = validateProjectSchedules(p);
    expect(errs.some((e) => e.includes('循環'))).toBe(true);
    expect(detectScheduleCycle([idA, idB], [
      { from: idB, to: idA },
      { from: idA, to: idB },
    ])).toBe(true);
    const g = buildGanttChartFromProject(p);
    expect(g.message).toMatch(/循環/);
  });

  it('先行ブロック ID が存在しないと検証エラー', () => {
    const idA = '70000000-0000-4000-8000-0000000000a1';
    const missing = '70000000-0000-4000-8000-00000000dead';
    const p = baseProject(
      [
        {
          id: idA,
          name: 'A',
          ifcType: 'IfcWall',
          category: 'structure',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          dimensions: { width: 1, height: 1, depth: 1 },
          propertySets: [],
        },
      ],
      [
        {
          blockId: idA,
          startDate: '2024-01-01T00:00:00.000Z',
          endDate: '2024-01-02T00:00:00.000Z',
          durationDays: 2,
          dependencies: [{ blockId: missing, type: 'FS' }],
          status: 'not_started',
        },
      ],
    );
    const errs = validateProjectSchedules(p);
    expect(errs.some((e) => e.includes('未知'))).toBe(true);
  });
});
