import type { Block } from '../models/block.js';
import type { ScheduleInfo } from '../models/schedule.js';
import type { SafetySimulationResult } from '../models/check-extra.js';

export interface SafetyEngine {
  analyze(blocks: Block[], schedules: ScheduleInfo[]): SafetySimulationResult;
}

export function safetyAnalyzeLevel0(
  _blocks: Block[],
  _schedules: ScheduleInfo[],
): SafetySimulationResult {
  return { hazards: [], passed: true };
}
