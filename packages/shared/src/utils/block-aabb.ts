import type { Block } from '../models/block.js';

export type AxisAlignedBox = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
};

/** ブロックを軸平行直方体（位置＝中心）として扱う */
export function blockAabb(block: Block): AxisAlignedBox {
  const { position: p, dimensions: d } = block;
  return {
    minX: p.x - d.width / 2,
    maxX: p.x + d.width / 2,
    minY: p.y - d.height / 2,
    maxY: p.y + d.height / 2,
    minZ: p.z - d.depth / 2,
    maxZ: p.z + d.depth / 2,
  };
}

export function xzOverlap(
  a: AxisAlignedBox,
  b: AxisAlignedBox,
  margin = 0,
): boolean {
  return (
    a.maxX + margin > b.minX &&
    a.minX - margin < b.maxX &&
    a.maxZ + margin > b.minZ &&
    a.minZ - margin < b.maxZ
  );
}

export function yOverlap(
  a: AxisAlignedBox,
  b: AxisAlignedBox,
  margin = 0.2,
): boolean {
  return a.maxY + margin > b.minY && a.minY - margin < b.maxY;
}
