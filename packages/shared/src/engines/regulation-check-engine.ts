import type { Block } from '../models/block.js';
import type { ProjectMetadata } from '../models/project.js';
import type { RegulationCheckResult } from '../models/simulation-result.js';

export interface RegulationCheckEngine {
  check(blocks: Block[], metadata: ProjectMetadata): RegulationCheckResult;
}

export function regulationCheckLevel0(
  _blocks: Block[],
  _metadata: ProjectMetadata,
): RegulationCheckResult {
  return { items: [], allCompliant: true };
}
