import { describe, expect, it } from 'vitest';
import type { Block } from '../../src/models/block.js';
import type { ScheduleInfo } from '../../src/models/schedule.js';
import { safetyAnalyzeFromBlocks } from '../../src/engines/safety-engine.js';

const block = (
  id: string,
  name: string,
  y: number,
  xz: { x: number; z: number } = { x: 0, z: 0 },
): Block => ({
  id,
  name,
  ifcType: 'IfcWall',
  category: 'structure',
  position: { x: xz.x, y, z: xz.z },
  rotation: { x: 0, y: 0, z: 0 },
  dimensions: { width: 2, height: 2, depth: 0.2 },
  propertySets: [],
});

describe('safety-engine', () => {
  it('工程なし', () => {
    const r = safetyAnalyzeFromBlocks([block('10000000-0000-4000-8000-000000000001', 'A', 1)], []);
    expect(r.hazards).toHaveLength(0);
    expect(r.message).toMatch(/工程/);
  });

  it('上下同時作業の検出', () => {
    const a = '10000000-0000-4000-8000-000000000001';
    const b = '10000000-0000-4000-8000-000000000002';
    const blocks = [
      block(a, '低', 1, { x: 0, z: 0 }),
      block(b, '高', 5, { x: 0, z: 0 }),
    ];
    const schedules: ScheduleInfo[] = [
      {
        blockId: a,
        startDate: '2024-03-01T00:00:00.000Z',
        endDate: '2024-03-10T00:00:00.000Z',
        durationDays: 10,
        dependencies: [],
        status: 'in_progress',
      },
      {
        blockId: b,
        startDate: '2024-03-05T00:00:00.000Z',
        endDate: '2024-03-15T00:00:00.000Z',
        durationDays: 11,
        dependencies: [],
        status: 'in_progress',
      },
    ];
    const r = safetyAnalyzeFromBlocks(blocks, schedules);
    expect(r.hazards.length).toBeGreaterThanOrEqual(1);
    expect(r.hazards[0]!.kind).toBe('concurrent_vertical_work');
    expect(r.passed).toBe(false);
  });

  it('時間重なりなしは合格', () => {
    const a = '10000000-0000-4000-8000-000000000003';
    const b = '10000000-0000-4000-8000-000000000004';
    const blocks = [
      block(a, '低', 1, { x: 0, z: 0 }),
      block(b, '高', 5, { x: 0, z: 0 }),
    ];
    const schedules: ScheduleInfo[] = [
      {
        blockId: a,
        startDate: '2024-03-01T00:00:00.000Z',
        endDate: '2024-03-05T00:00:00.000Z',
        durationDays: 5,
        dependencies: [],
        status: 'completed',
      },
      {
        blockId: b,
        startDate: '2024-04-01T00:00:00.000Z',
        endDate: '2024-04-10T00:00:00.000Z',
        durationDays: 10,
        dependencies: [],
        status: 'not_started',
      },
    ];
    const r = safetyAnalyzeFromBlocks(blocks, schedules);
    expect(r.hazards).toHaveLength(0);
    expect(r.passed).toBe(true);
  });
});
