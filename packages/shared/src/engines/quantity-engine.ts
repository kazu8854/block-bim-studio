import type { Block } from '../models/block.js';
import type { QuantityResult } from '../models/simulation-result.js';
import { getBlockQuantities } from '../utils/block-simulation-helpers.js';

export interface QuantityEngine {
  calculate(blocks: Block[]): QuantityResult;
}

/** Level 0: 空の集計 */
export function calculateQuantityLevel0(_blocks: Block[]): QuantityResult {
  return {
    byType: {},
    total: { volume: 0, area: 0, count: 0 },
  };
}

/** Level 2: Qto_BaseQuantities（または寸法）からタイプ別集計 */
export function calculateQuantityFromBlocks(blocks: Block[]): QuantityResult {
  const byType: QuantityResult['byType'] = {};
  let totalVol = 0;
  let totalArea = 0;
  let totalCount = 0;

  for (const b of blocks) {
    const q = getBlockQuantities(b);
    const t = b.ifcType;
    if (!byType[t]) {
      byType[t] = { volume: 0, area: 0, length: 0, count: 0 };
    }
    const row = byType[t]!;
    row.volume += q.volume;
    row.area += q.area;
    row.length += q.length;
    row.count += 1;
    totalVol += q.volume;
    totalArea += q.area;
    totalCount += 1;
  }

  return {
    byType,
    total: { volume: totalVol, area: totalArea, count: totalCount },
  };
}
