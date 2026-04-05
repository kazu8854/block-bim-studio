import type { Block } from '../../src/models/block.js';
import type { Project } from '../../src/models/project.js';
import { describe, expect, it } from 'vitest';
import { calculateQuantityFromBlocks } from '../../src/engines/quantity-engine.js';
import { detectClashesFromBlocks } from '../../src/engines/clash-engine.js';
import { buildGanttChartFromProject } from '../../src/engines/schedule-engine.js';

function spacedBlocks(n: number): Block[] {
  const out: Block[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `20000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      name: `B${String(i)}`,
      ifcType: 'IfcWall',
      category: 'structure',
      position: { x: i * 6, y: 0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { width: 1, height: 1, depth: 1 },
      propertySets: [],
    });
  }
  return out;
}

function projectWithSchedules(blocks: Block[]): Project {
  const now = new Date().toISOString();
  const schedules = blocks.map((b, i) => ({
    blockId: b.id,
    startDate: new Date(Date.UTC(2024, 0, 1 + i)).toISOString(),
    endDate: new Date(Date.UTC(2024, 0, 1 + i)).toISOString(),
    durationDays: 1,
    dependencies: [] as [],
    status: 'not_started' as const,
  }));
  return {
    id: '30000000-0000-4000-8000-000000000001',
    name: 'Perf',
    status: 'draft',
    metadata: {},
    blocks,
    schedules,
    createdAt: now,
    updatedAt: now,
  };
}

describe('Phase 3.1 — 100+ ブロックのスケール', () => {
  it('数量・干渉・ガントが許容時間内に完了する', () => {
    const blocks = spacedBlocks(120);
    const project = projectWithSchedules(blocks);

    const t0 = performance.now();
    const q = calculateQuantityFromBlocks(blocks);
    const t1 = performance.now();
    const cl = detectClashesFromBlocks(blocks);
    const t2 = performance.now();
    const g = buildGanttChartFromProject(project);
    const t3 = performance.now();

    expect(q.total.count).toBe(120);
    expect(cl.clashes).toHaveLength(0);
    expect(g.tasks).toHaveLength(120);

    const budgetMs = 2500;
    expect(t1 - t0).toBeLessThan(budgetMs);
    expect(t2 - t1).toBeLessThan(budgetMs);
    expect(t3 - t2).toBeLessThan(budgetMs);
  });
});
