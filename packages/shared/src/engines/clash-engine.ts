import type { Block } from '../models/block.js';
import type { ClashResult } from '../models/simulation-result.js';

export interface ClashEngine {
  detect(blocks: Block[]): ClashResult;
}

export function detectClashesLevel0(_blocks: Block[]): ClashResult {
  return { clashes: [] };
}
