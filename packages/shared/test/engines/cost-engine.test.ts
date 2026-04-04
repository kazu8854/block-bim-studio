import type { Block } from '../../src/models/block.js';
import { describe, expect, it } from 'vitest';
import { calculateCostFromBlocks } from '../../src/engines/cost-engine.js';
import { buildPropertySetsForNewIfcBlock } from '../../src/utils/new-block-property-sets.js';

function blockWithCost(
  id: string,
  ifcType: Block['ifcType'],
  dims: { w: number; h: number; d: number },
  unitPrice: number,
): Block {
  const sets = buildPropertySetsForNewIfcBlock(ifcType, {
    width: dims.w,
    height: dims.h,
    depth: dims.d,
  });
  const costIdx = sets.findIndex((s) => s.name === 'Pset_Cost');
  const next = [...sets];
  next[costIdx] = {
    name: 'Pset_Cost',
    properties: { UnitPrice: unitPrice, Currency: 'JPY' },
  };
  return {
    id,
    name: 'X',
    ifcType,
    category: 'structure',
    position: { x: 0, y: dims.h / 2, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: { width: dims.w, height: dims.h, depth: dims.d },
    propertySets: next,
  };
}

describe('cost-engine Level 2', () => {
  it('体積×単価でコストを算出する', () => {
    const b = blockWithCost(
      '10000000-0000-4000-8000-000000000011',
      'IfcWall',
      { w: 2, h: 2, d: 2 },
      1000,
    );
    const r = calculateCostFromBlocks([b]);
    expect(r.uncostedBlocks).toHaveLength(0);
    expect(r.total).toBeCloseTo(8 * 1000, 6);
    expect(r.byType.IfcWall?.cost).toBeCloseTo(8000, 6);
  });

  it('単価未設定ブロックは uncostedBlocks に入る', () => {
    const sets = buildPropertySetsForNewIfcBlock('IfcWall', {
      width: 1,
      height: 1,
      depth: 1,
    });
    const costIdx = sets.findIndex((s) => s.name === 'Pset_Cost');
    const next = [...sets];
    next[costIdx] = {
      name: 'Pset_Cost',
      properties: { UnitPrice: 0, Currency: 'JPY' },
    };
    const b: Block = {
      id: '10000000-0000-4000-8000-000000000012',
      name: 'N',
      ifcType: 'IfcWall',
      category: 'structure',
      position: { x: 0, y: 0.5, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      dimensions: { width: 1, height: 1, depth: 1 },
      propertySets: next,
    };
    const r = calculateCostFromBlocks([b]);
    expect(r.uncostedBlocks).toContain(b.id);
    expect(r.total).toBe(0);
  });
});
