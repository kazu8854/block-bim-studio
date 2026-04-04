import type { Block } from '../models/block.js';
import type { CostResult } from '../models/simulation-result.js';

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
