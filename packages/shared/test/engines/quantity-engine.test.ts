import type { Block } from '../../src/models/block.js';
import { describe, expect, it } from 'vitest';
import { calculateQuantityFromBlocks } from '../../src/engines/quantity-engine.js';
import { buildPropertySetsForNewIfcBlock } from '../../src/utils/new-block-property-sets.js';

function wallBlock(id: string, dims: { w: number; h: number; d: number }): Block {
  return {
    id,
    name: 'W',
    ifcType: 'IfcWall',
    category: 'structure',
    position: { x: 0, y: dims.h / 2, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: dims.w, height: dims.h, depth: dims.d },
    propertySets: buildPropertySetsForNewIfcBlock('IfcWall', {
      width: dims.w,
      height: dims.h,
      depth: dims.d,
    }),
  };
}

describe('quantity-engine Level 2', () => {
  it('空配列は total.count = 0', () => {
    const r = calculateQuantityFromBlocks([]);
    expect(r.total.count).toBe(0);
    expect(r.total.volume).toBe(0);
    expect(Object.keys(r.byType)).toHaveLength(0);
  });

  it('タイプ別に体積・面積・件数を集計する', () => {
    const a = wallBlock('10000000-0000-4000-8000-000000000001', {
      w: 2,
      h: 3,
      d: 0.2,
    });
    const b: Block = {
      ...wallBlock('10000000-0000-4000-8000-000000000002', {
        w: 1,
        h: 1,
        d: 1,
      }),
      ifcType: 'IfcColumn',
      category: 'structure',
      propertySets: buildPropertySetsForNewIfcBlock('IfcColumn', {
        width: 1,
        height: 1,
        depth: 1,
      }),
    };
    const r = calculateQuantityFromBlocks([a, b]);
    expect(r.total.count).toBe(2);
    expect(r.byType.IfcWall?.count).toBe(1);
    expect(r.byType.IfcColumn?.count).toBe(1);
    expect(r.byType.IfcWall!.volume).toBeCloseTo(2 * 3 * 0.2, 6);
    expect(r.total.volume).toBeCloseTo(2 * 3 * 0.2 + 1, 6);
  });
});
