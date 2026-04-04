import type { Block } from '../models/block.js';
import type { ClashResult } from '../models/simulation-result.js';

export interface ClashEngine {
  detect(blocks: Block[]): ClashResult;
}

export function detectClashesLevel0(_blocks: Block[]): ClashResult {
  return { clashes: [] };
}

const EPS = 1e-9;

type Aabb = {
  min: [number, number, number];
  max: [number, number, number];
};

function blockAabb(block: Block): Aabb {
  const { x, y, z } = block.position;
  const { width: w, height: h, depth: d } = block.dimensions;
  const hw = w / 2;
  const hh = h / 2;
  const hd = d / 2;
  return {
    min: [x - hw, y - hh, z - hd],
    max: [x + hw, y + hh, z + hd],
  };
}

function intersectVolume(
  a: Aabb,
  b: Aabb,
): { volume: number; center: [number, number, number] } | null {
  const ix0 = Math.max(a.min[0], b.min[0]);
  const iy0 = Math.max(a.min[1], b.min[1]);
  const iz0 = Math.max(a.min[2], b.min[2]);
  const ix1 = Math.min(a.max[0], b.max[0]);
  const iy1 = Math.min(a.max[1], b.max[1]);
  const iz1 = Math.min(a.max[2], b.max[2]);
  const dx = ix1 - ix0;
  const dy = iy1 - iy0;
  const dz = iz1 - iz0;
  if (dx <= EPS || dy <= EPS || dz <= EPS) return null;
  const volume = dx * dy * dz;
  if (volume <= EPS) return null;
  return {
    volume,
    center: [(ix0 + ix1) / 2, (iy0 + iy1) / 2, (iz0 + iz1) / 2],
  };
}

/** Level 2: 軸平行 AABB の重なり検出（回転は未考慮） */
export function detectClashesFromBlocks(blocks: Block[]): ClashResult {
  if (blocks.length <= 1) {
    return {
      clashes: [],
      message: 'ブロックが 2 未満のため干渉を判定できません。',
    };
  }

  const clashes: ClashResult['clashes'] = [];
  for (let i = 0; i < blocks.length; i++) {
    const ai = blockAabb(blocks[i]!);
    for (let j = i + 1; j < blocks.length; j++) {
      const bj = blockAabb(blocks[j]!);
      const hit = intersectVolume(ai, bj);
      if (!hit) continue;
      clashes.push({
        blockIdA: blocks[i]!.id,
        blockIdB: blocks[j]!.id,
        intersectionPoint: {
          x: hit.center[0],
          y: hit.center[1],
          z: hit.center[2],
        },
        intersectionVolume: hit.volume,
      });
    }
  }

  return { clashes };
}
