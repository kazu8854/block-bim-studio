import type { Block } from '../models/block.js';
import type { StructureCheckResult } from '../models/simulation-result.js';

export interface StructureCheckEngine {
  check(blocks: Block[]): StructureCheckResult;
}

export function structureCheckLevel0(_blocks: Block[]): StructureCheckResult {
  return { violations: [], passed: true };
}
