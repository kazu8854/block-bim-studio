import type { Block } from '../models/block.js';
import type { EnvironmentSimulationResult } from '../models/check-extra.js';

export interface EnvironmentEngine {
  simulate(blocks: Block[]): EnvironmentSimulationResult;
}

export function environmentSimulateLevel0(
  _blocks: Block[],
): EnvironmentSimulationResult {
  return {
    solarGainKwh: 0,
    heatLossKwh: 0,
    metrics: [],
  };
}
