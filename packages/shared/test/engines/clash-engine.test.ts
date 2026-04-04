import type { Block } from '../../src/models/block.js';
import { describe, expect, it } from 'vitest';
import { detectClashesFromBlocks } from '../../src/engines/clash-engine.js';

function box(
  id: string,
  center: { x: number; y: number; z: number },
  dims: { width: number; height: number; depth: number },
): Block {
  return {
    id,
    name: 'B',
    ifcType: 'IfcWall',
    category: 'structure',
    position: center,
    rotation: { x: 0, y: 0, z: 0 },
    dimensions: dims,
    propertySets: [],
  };
}

describe('clash-engine Level 2', () => {
  it('1 個以下はメッセージのみ', () => {
    const r = detectClashesFromBlocks([box('10000000-0000-4000-8000-000000000021', { x: 0, y: 1, z: 0 }, { width: 2, height: 2, depth: 2 })]);
    expect(r.clashes).toHaveLength(0);
    expect(r.message).toBeDefined();
  });

  it('重なる AABB で干渉を検出する', () => {
    const a = box('10000000-0000-4000-8000-000000000031', { x: 0, y: 1, z: 0 }, {
      width: 2,
      height: 2,
      depth: 2,
    });
    const b = box('10000000-0000-4000-8000-000000000032', { x: 0, y: 1, z: 0 }, {
      width: 2,
      height: 2,
      depth: 2,
    });
    const r = detectClashesFromBlocks([a, b]);
    expect(r.clashes.length).toBeGreaterThanOrEqual(1);
    expect(r.clashes[0]!.intersectionVolume).toBeGreaterThan(0);
  });

  it('離れたブロックでは干渉なし', () => {
    const a = box('10000000-0000-4000-8000-000000000041', { x: 0, y: 1, z: 0 }, {
      width: 1,
      height: 1,
      depth: 1,
    });
    const b = box('10000000-0000-4000-8000-000000000042', { x: 10, y: 1, z: 0 }, {
      width: 1,
      height: 1,
      depth: 1,
    });
    const r = detectClashesFromBlocks([a, b]);
    expect(r.clashes).toHaveLength(0);
  });
});
