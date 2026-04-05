import type { Block } from '../models/block.js';
import type { ClashResult } from '../models/simulation-result.js';

export interface ClashEngine {
  detect(blocks: Block[]): ClashResult;
}

export function detectClashesLevel0(_blocks: Block[]): ClashResult {
  return { clashes: [] };
}

const EPS = 1e-9;

type ClashAabb = {
  min: [number, number, number];
  max: [number, number, number];
};

function blockAabb(block: Block): ClashAabb {
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
  a: ClashAabb,
  b: ClashAabb,
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

const GRID_THRESHOLD = 40;

function maxExtent(a: ClashAabb): number {
  return Math.max(
    a.max[0] - a.min[0],
    a.max[1] - a.min[1],
    a.max[2] - a.min[2],
    EPS,
  );
}

function pickCellSize(aabbs: ClashAabb[]): number {
  let m = 0;
  for (const a of aabbs) {
    m = Math.max(m, maxExtent(a));
  }
  return Math.max(m, 0.25);
}

function pushClash(
  out: ClashResult['clashes'],
  blocks: Block[],
  i: number,
  j: number,
  ai: ClashAabb,
  aj: ClashAabb,
) {
  const hit = intersectVolume(ai, aj);
  if (!hit) return;
  out.push({
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

function detectClashesBrute(
  blocks: Block[],
  aabbs: ClashAabb[],
): ClashResult['clashes'] {
  const clashes: ClashResult['clashes'] = [];
  const n = blocks.length;
  for (let i = 0; i < n; i++) {
    const ai = aabbs[i]!;
    for (let j = i + 1; j < n; j++) {
      pushClash(clashes, blocks, i, j, ai, aabbs[j]!);
    }
  }
  return clashes;
}

function addBlockToGrid(
  buckets: Map<string, number[]>,
  index: number,
  a: ClashAabb,
  cellSize: number,
) {
  const ix0 = Math.floor(a.min[0] / cellSize);
  const iy0 = Math.floor(a.min[1] / cellSize);
  const iz0 = Math.floor(a.min[2] / cellSize);
  const ix1 = Math.floor(a.max[0] / cellSize);
  const iy1 = Math.floor(a.max[1] / cellSize);
  const iz1 = Math.floor(a.max[2] / cellSize);
  for (let xi = ix0; xi <= ix1; xi++) {
    for (let yi = iy0; yi <= iy1; yi++) {
      for (let zi = iz0; zi <= iz1; zi++) {
        const k = `${String(xi)},${String(yi)},${String(zi)}`;
        const arr = buckets.get(k) ?? [];
        arr.push(index);
        buckets.set(k, arr);
      }
    }
  }
}

function detectClashesGrid(
  blocks: Block[],
  aabbs: ClashAabb[],
): ClashResult['clashes'] {
  const cellSize = pickCellSize(aabbs);
  const buckets = new Map<string, number[]>();
  for (let i = 0; i < blocks.length; i++) {
    addBlockToGrid(buckets, i, aabbs[i]!, cellSize);
  }
  const pairSeen = new Set<string>();
  const clashes: ClashResult['clashes'] = [];
  for (const cell of buckets.values()) {
    for (let a = 0; a < cell.length; a++) {
      const i = cell[a]!;
      for (let b = a + 1; b < cell.length; b++) {
        const j = cell[b]!;
        const lo = i < j ? i : j;
        const hi = i < j ? j : i;
        const pk = `${String(lo)}:${String(hi)}`;
        if (pairSeen.has(pk)) continue;
        pairSeen.add(pk);
        pushClash(clashes, blocks, lo, hi, aabbs[lo]!, aabbs[hi]!);
      }
    }
  }
  return clashes;
}

/** 参照実装（テストで格子ブロードフェーズと突き合わせる） */
export function detectClashesFromBlocksBrute(blocks: Block[]): ClashResult {
  if (blocks.length <= 1) {
    return {
      clashes: [],
      message: 'ブロックが 2 未満のため干渉を判定できません。',
    };
  }
  const aabbs = blocks.map(blockAabb);
  return { clashes: detectClashesBrute(blocks, aabbs) };
}

/** Level 2: 軸平行 AABB の重なり検出（回転は未考慮） */
export function detectClashesFromBlocks(blocks: Block[]): ClashResult {
  if (blocks.length <= 1) {
    return {
      clashes: [],
      message: 'ブロックが 2 未満のため干渉を判定できません。',
    };
  }

  const aabbs = blocks.map(blockAabb);
  const clashes =
    blocks.length >= GRID_THRESHOLD
      ? detectClashesGrid(blocks, aabbs)
      : detectClashesBrute(blocks, aabbs);

  return { clashes };
}
