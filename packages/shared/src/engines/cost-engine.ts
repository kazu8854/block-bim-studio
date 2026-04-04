import type { Block } from '../models/block.js';
import type { CostResult } from '../models/simulation-result.js';
import {
  getBlockQuantities,
  getBlockUnitPrice,
} from '../utils/block-simulation-helpers.js';

export interface CostEngine {
  calculate(blocks: Block[]): CostResult;
}

export function calculateCostLevel0(_blocks: Block[]): CostResult {
  return {
    byType: {},
    total: 0,
    uncostedBlocks: [],
  };
}

/**
 * Level 2: 体積×単価（¥/m³）を基本とし、体積が無い場合は面積×単価、それも無ければ単価を 1 個分として扱う。
 */
export function calculateCostFromBlocks(blocks: Block[]): CostResult {
  const byType: CostResult['byType'] = {};
  const uncostedBlocks: string[] = [];
  let grand = 0;

  for (const b of blocks) {
    const price = getBlockUnitPrice(b);
    if (price === null) {
      uncostedBlocks.push(b.id);
      continue;
    }
    const q = getBlockQuantities(b);
    let amount = 0;
    if (q.volume > 0) {
      amount = q.volume * price;
    } else if (q.area > 0) {
      amount = q.area * price;
    } else {
      amount = price;
    }

    const t = b.ifcType;
    if (!byType[t]) {
      byType[t] = { cost: 0, count: 0 };
    }
    const row = byType[t]!;
    row.cost += amount;
    row.count += 1;
    grand += amount;
  }

  return {
    byType,
    total: grand,
    uncostedBlocks,
  };
}
