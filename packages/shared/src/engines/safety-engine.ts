import type { Block } from '../models/block.js';
import type { SafetySimulationResult } from '../models/check-extra.js';
import type { ScheduleInfo } from '../models/schedule.js';
import { utcDayIndex } from './schedule-engine.js';

export interface SafetyEngine {
  analyze(blocks: Block[], schedules: ScheduleInfo[]): SafetySimulationResult;
}

export function safetyAnalyzeLevel0(
  _blocks: Block[],
  _schedules: ScheduleInfo[],
): SafetySimulationResult {
  return { hazards: [], passed: true, message: '安全管理（スタブ）' };
}

const PASS_MSG = '上下同時作業などの顕在化した危険は検出されませんでした。';

function blockById(blocks: Block[]): Map<string, Block> {
  const m = new Map<string, Block>();
  for (const b of blocks) {
    m.set(b.id, b);
  }
  return m;
}

function intervalsOverlap(a: ScheduleInfo, b: ScheduleInfo): boolean {
  const as = utcDayIndex(a.startDate);
  const ae = utcDayIndex(a.endDate);
  const bs = utcDayIndex(b.startDate);
  const be = utcDayIndex(b.endDate);
  return as <= be && bs <= ae;
}

/** 水平距離（XZ） */
function horizontalDist(a: Block, b: Block): number {
  const dx = a.position.x - b.position.x;
  const dz = a.position.z - b.position.z;
  return Math.hypot(dx, dz);
}

const VERTICAL_SEPARATION_M = 1.2;
const HORIZONTAL_PROXIMITY_M = 4;

/**
 * Level 2: 工程が重なる上下離れた作業の簡易検出
 */
export function safetyAnalyzeFromBlocks(
  blocks: Block[],
  schedules: ScheduleInfo[],
): SafetySimulationResult {
  if (schedules.length === 0) {
    return {
      hazards: [],
      passed: true,
      message: '工程情報がありません。安全管理の時間的重なりは評価していません。',
    };
  }

  const bmap = blockById(blocks);
  const hazards: SafetySimulationResult['hazards'] = [];
  let hid = 0;

  for (let i = 0; i < schedules.length; i++) {
    for (let j = i + 1; j < schedules.length; j++) {
      const sa = schedules[i]!;
      const sb = schedules[j]!;
      if (!intervalsOverlap(sa, sb)) continue;
      const ba = bmap.get(sa.blockId);
      const bb = bmap.get(sb.blockId);
      if (!ba || !bb) continue;
      const dy = Math.abs(ba.position.y - bb.position.y);
      if (dy < VERTICAL_SEPARATION_M) continue;
      if (horizontalDist(ba, bb) > HORIZONTAL_PROXIMITY_M) continue;

      hid += 1;
      const lower = ba.position.y <= bb.position.y ? ba : bb;
      const upper = ba.position.y > bb.position.y ? ba : bb;
      hazards.push({
        id: `hazard-${String(hid)}`,
        kind: 'concurrent_vertical_work',
        description: `「${lower.name}」と「${upper.name}」が工程期間内に重なり、かつ上下に離れた位置にあります。`,
        severity: 'high',
        riskLevel: 'high',
        blockIds: [ba.id, bb.id],
        blockNames: [ba.name, bb.name],
        periodDescription: `${sa.startDate.slice(0, 10)} 〜 ${sa.endDate.slice(0, 10)} / ${sb.startDate.slice(0, 10)} 〜 ${sb.endDate.slice(0, 10)}`,
      });
    }
  }

  const passed = hazards.length === 0;
  return {
    hazards,
    passed,
    message: passed ? PASS_MSG : undefined,
  };
}
