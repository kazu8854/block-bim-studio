import { describe, expect, it } from 'vitest';
import type { Block } from '../../src/models/block.js';
import { structureCheckFromBlocks } from '../../src/engines/structure-check-engine.js';

function blk(p: Partial<Block> & Pick<Block, 'id' | 'name' | 'ifcType'>): Block {
  return {
    category: 'structure',
    position: { x: 0, y: 1, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: 1, height: 2, depth: 0.2 },
    propertySets: [],
    ...p,
  } as Block;
}

describe('structure-check-engine', () => {
  it('ブロック 0 個は合格', () => {
    const r = structureCheckFromBlocks([]);
    expect(r.passed).toBe(true);
    expect(r.violations).toHaveLength(0);
    expect(r.message).toMatch(/満たしています/);
  });

  it('梁スパン > 8m で違反', () => {
    const b = blk({
      id: '10000000-0000-4000-8000-000000000001',
      name: 'Long beam',
      ifcType: 'IfcBeam',
      dimensions: { width: 9, height: 0.5, depth: 0.3 },
    });
    const r = structureCheckFromBlocks([b]);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => v.ruleName === 'beam_span_limit')).toBe(
      true,
    );
  });

  it('孤立した壁は未支持', () => {
    const w = blk({
      id: '10000000-0000-4000-8000-000000000002',
      name: 'Wall',
      ifcType: 'IfcWall',
      dimensions: { width: 4, height: 3, depth: 0.2 },
      position: { x: 20, y: 1.5, z: 0 },
    });
    const r = structureCheckFromBlocks([w]);
    expect(r.passed).toBe(false);
    expect(r.violations.some((v) => v.ruleName === 'unsupported_wall')).toBe(
      true,
    );
  });

  it('柱と平面・高さが重なる壁は支持あり', () => {
    const col = blk({
      id: '10000000-0000-4000-8000-000000000003',
      name: 'Col',
      ifcType: 'IfcColumn',
      dimensions: { width: 0.4, height: 3, depth: 0.4 },
      position: { x: 0, y: 1.5, z: 0 },
    });
    const w = blk({
      id: '10000000-0000-4000-8000-000000000004',
      name: 'Wall',
      ifcType: 'IfcWall',
      dimensions: { width: 2, height: 3, depth: 0.2 },
      position: { x: 0, y: 1.5, z: 0 },
    });
    const r = structureCheckFromBlocks([col, w]);
    expect(r.violations.filter((v) => v.ruleName === 'unsupported_wall')).toHaveLength(
      0,
    );
  });

  it('支持のないスラブ', () => {
    const s = blk({
      id: '10000000-0000-4000-8000-000000000005',
      name: 'Slab',
      ifcType: 'IfcSlab',
      dimensions: { width: 4, height: 0.2, depth: 4 },
      position: { x: 50, y: 3, z: 0 },
    });
    const r = structureCheckFromBlocks([s]);
    expect(r.violations.some((v) => v.ruleName === 'unsupported_slab')).toBe(
      true,
    );
  });
});
