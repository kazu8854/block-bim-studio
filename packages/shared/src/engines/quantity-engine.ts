import type { Block } from '../models/block.js';
import type { QuantityResult } from '../models/simulation-result.js';

export interface QuantityEngine {
  calculate(blocks: Block[]): QuantityResult;
}

/** Level 0: 空の集計（tasks.md の固定 count: 0 に相当する total.count = 0） */
export function calculateQuantityLevel0(_blocks: Block[]): QuantityResult {
  return {
    byType: {},
    total: { volume: 0, area: 0, count: 0 },
  };
}
