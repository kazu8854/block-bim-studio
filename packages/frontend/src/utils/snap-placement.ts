import type { Block } from '@block-bim-studio/shared';

/** 10mm — block-to-block auto snap range (meters) */
export const SNAP_TOLERANCE_M = 0.01;

/** Grid step for placement (meters) */
export const GRID_STEP_M = 0.1;

export type SnapGuideSegment = {
  start: [number, number, number];
  end: [number, number, number];
};

function aabbXZ(block: Pick<Block, 'position' | 'dimensions'>) {
  const hw = block.dimensions.width / 2;
  const hz = block.dimensions.depth / 2;
  const { x, z } = block.position;
  return { xMin: x - hw, xMax: x + hw, zMin: z - hz, zMax: z + hz };
}

export function applyGridSnapXZ(
  x: number,
  z: number,
  step: number,
): { x: number; z: number } {
  return {
    x: Math.round(x / step) * step,
    z: Math.round(z / step) * step,
  };
}

function movingAabb(
  cx: number,
  cz: number,
  dimensions: Block['dimensions'],
) {
  const hw = dimensions.width / 2;
  const hz = dimensions.depth / 2;
  return {
    xMin: cx - hw,
    xMax: cx + hw,
    zMin: cz - hz,
    zMax: cz + hz,
  };
}

/**
 * Snap block center on XZ to nearest other block face within tolerance, after grid snap.
 */
export function applyEdgeSnapXZ(
  centerX: number,
  centerZ: number,
  dimensions: Block['dimensions'],
  excludeId: string,
  blocks: Block[],
  tolerance: number,
): { x: number; z: number; guides: SnapGuideSegment[] } {
  let x = centerX;
  let z = centerZ;
  const guides: SnapGuideSegment[] = [];

  let m = movingAabb(x, z, dimensions);

  let bestXDelta: number | null = null;
  for (const other of blocks) {
    if (other.id === excludeId) continue;
    const o = aabbXZ(other);
    const candidates = [
      o.xMax - m.xMin,
      o.xMin - m.xMax,
      o.xMin - m.xMin,
      o.xMax - m.xMax,
    ];
    for (const d of candidates) {
      if (Math.abs(d) <= tolerance) {
        if (bestXDelta === null || Math.abs(d) < Math.abs(bestXDelta)) {
          bestXDelta = d;
        }
      }
    }
  }
  if (bestXDelta !== null) {
    x += bestXDelta;
    m = movingAabb(x, z, dimensions);
    const edgeX =
      bestXDelta > 0 ? m.xMin : m.xMax;
    const z0 = Math.max(m.zMin, -5);
    const z1 = Math.min(m.zMax, 5);
    guides.push({
      start: [edgeX, 0, z0],
      end: [edgeX, 4, z1],
    });
  }

  let bestZDelta: number | null = null;
  for (const other of blocks) {
    if (other.id === excludeId) continue;
    const o = aabbXZ(other);
    const candidates = [
      o.zMax - m.zMin,
      o.zMin - m.zMax,
      o.zMin - m.zMin,
      o.zMax - m.zMax,
    ];
    for (const d of candidates) {
      if (Math.abs(d) <= tolerance) {
        if (bestZDelta === null || Math.abs(d) < Math.abs(bestZDelta)) {
          bestZDelta = d;
        }
      }
    }
  }
  if (bestZDelta !== null) {
    z += bestZDelta;
    m = movingAabb(x, z, dimensions);
    const edgeZ =
      bestZDelta > 0 ? m.zMin : m.zMax;
    const x0 = Math.max(m.xMin, -5);
    const x1 = Math.min(m.xMax, 5);
    guides.push({
      start: [x0, 0, edgeZ],
      end: [x1, 4, edgeZ],
    });
  }

  return { x, z, guides };
}

export function snapBlockPlacementXZ(
  block: Block,
  allBlocks: Block[],
  centerXZ?: { x: number; z: number },
): { position: Block['position']; guides: SnapGuideSegment[] } {
  const cx = centerXZ?.x ?? block.position.x;
  const cz = centerXZ?.z ?? block.position.z;
  const gridded = applyGridSnapXZ(cx, cz, GRID_STEP_M);
  const snapped = applyEdgeSnapXZ(
    gridded.x,
    gridded.z,
    block.dimensions,
    block.id,
    allBlocks,
    SNAP_TOLERANCE_M,
  );
  return {
    position: {
      x: snapped.x,
      y: block.position.y,
      z: snapped.z,
    },
    guides: snapped.guides,
  };
}
