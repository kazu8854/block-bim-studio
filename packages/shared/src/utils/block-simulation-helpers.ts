import type { Block, PropertyValue } from '../models/block.js';
import { computeBaseQuantitiesFromDimensions } from './quantities-from-dimensions.js';

function psetProps(
  block: Block,
  name: string,
): Record<string, PropertyValue> | undefined {
  return block.propertySets.find((p) => p.name === name)?.properties;
}

function num(v: PropertyValue | undefined): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Qto を優先し、無効なら寸法から再計算 */
export function getBlockQuantities(block: Block): {
  volume: number;
  area: number;
  length: number;
} {
  const p = psetProps(block, 'Qto_BaseQuantities');
  const vol = num(p?.Volume);
  if (vol > 0) {
    return {
      volume: vol,
      area: num(p?.Area),
      length: num(p?.Length),
    };
  }
  const q = computeBaseQuantitiesFromDimensions(block.dimensions);
  return { volume: q.Volume, area: q.Area, length: q.Length };
}

/** Pset_Cost.UnitPrice（>0）または null */
export function getBlockUnitPrice(block: Block): number | null {
  const p = psetProps(block, 'Pset_Cost');
  const u = p?.UnitPrice;
  if (typeof u === 'number' && u > 0) return u;
  if (typeof u === 'string') {
    const n = Number(u);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}
