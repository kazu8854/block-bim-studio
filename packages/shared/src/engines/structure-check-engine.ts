import type { Block } from '../models/block.js';
import type { StructureCheckResult } from '../models/simulation-result.js';
import { blockAabb, xzOverlap, yOverlap } from '../utils/block-aabb.js';

export interface StructureCheckEngine {
  check(blocks: Block[]): StructureCheckResult;
}

const PASS_MSG = '全ての構造ルールを満たしています。';

export function structureCheckLevel0(_blocks: Block[]): StructureCheckResult {
  return { violations: [], passed: true, message: PASS_MSG };
}

const BEAM_SPAN_LIMIT_M = 8;

function isBeam(b: Block): boolean {
  return b.ifcType === 'IfcBeam';
}

function isWall(b: Block): boolean {
  return b.ifcType === 'IfcWall';
}

function isColumn(b: Block): boolean {
  return b.ifcType === 'IfcColumn';
}

function isSlab(b: Block): boolean {
  return b.ifcType === 'IfcSlab';
}

function structuralSupportCandidate(b: Block): boolean {
  return isWall(b) || isColumn(b) || isBeam(b);
}

/** 梁のスパン（水平面内の長い方） */
function beamSpanM(b: Block): number {
  return Math.max(b.dimensions.width, b.dimensions.depth);
}

/**
 * Level 2: 梁スパン、未支持壁・スラブのルールベース検査（簡易幾何）
 */
export function structureCheckFromBlocks(blocks: Block[]): StructureCheckResult {
  const violations: StructureCheckResult['violations'] = [];

  if (blocks.length === 0) {
    return { violations: [], passed: true, message: PASS_MSG };
  }

  for (const b of blocks) {
    if (!isBeam(b)) continue;
    const span = beamSpanM(b);
    if (span > BEAM_SPAN_LIMIT_M) {
      violations.push({
        blockId: b.id,
        blockName: b.name,
        ruleName: 'beam_span_limit',
        description: `梁のスパンが ${BEAM_SPAN_LIMIT_M}m を超えています（${span.toFixed(2)}m）。`,
        recommendation:
          'スパンを分割するか、中間支承（柱・壁）を追加してください。',
      });
    }
  }

  for (const w of blocks) {
    if (!isWall(w)) continue;
    const aw = blockAabb(w);
    const supported = blocks.some((o) => {
      if (o.id === w.id) return false;
      if (!structuralSupportCandidate(o)) return false;
      return xzOverlap(aw, blockAabb(o), 0.08) && yOverlap(aw, blockAabb(o), 0.25);
    });
    if (!supported) {
      violations.push({
        blockId: w.id,
        blockName: w.name,
        ruleName: 'unsupported_wall',
        description:
          '壁が柱・他の壁・梁による支持（平面・高さ方向の重なり）が見つかりません。',
        recommendation:
          '交点付近に柱を配置するか、直交する壁・梁でスパンを区切ってください。',
      });
    }
  }

  for (const s of blocks) {
    if (!isSlab(s)) continue;
    const asb = blockAabb(s);
    const slabBottom = asb.minY;
    const supported = blocks.some((o) => {
      if (o.id === s.id) return false;
      if (!(isBeam(o) || isWall(o))) return false;
      const ao = blockAabb(o);
      const topNearSlab =
        ao.maxY >= slabBottom - 0.35 && ao.maxY <= slabBottom + 0.45;
      return topNearSlab && xzOverlap(asb, ao, 0.1);
    });
    if (!supported) {
      violations.push({
        blockId: s.id,
        blockName: s.name,
        ruleName: 'unsupported_slab',
        description:
          'スラブ下面付近に、重なる梁または壁による支持が見つかりません。',
        recommendation:
          'スラブ下に梁を渡すか、周辺に壁を配置して支持を確保してください。',
      });
    }
  }

  const passed = violations.length === 0;
  return {
    violations,
    passed,
    message: passed ? PASS_MSG : undefined,
  };
}
