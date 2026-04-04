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
  return {
    items: [],
    allCompliant: true,
    message: '法規チェック（スタブ）',
  };
}

type Limits = { coveragePct: number; farPct: number };

function resolveLimits(metadata: ProjectMetadata): Limits | null {
  const bc = metadata.buildingCoverageLimit;
  const fr = metadata.floorAreaRatioLimit;
  if (bc != null || fr != null) {
    return {
      coveragePct: bc ?? 60,
      farPct: fr ?? 200,
    };
  }
  const zt = metadata.zoneType ?? '';
  if (zt.includes('第一種低層')) return { coveragePct: 50, farPct: 80 };
  if (zt.includes('第二種低層')) return { coveragePct: 60, farPct: 100 };
  if (zt.includes('第一種中高')) return { coveragePct: 60, farPct: 200 };
  if (zt.includes('第二種中高')) return { coveragePct: 60, farPct: 200 };
  if (zt.length > 0) return { coveragePct: 60, farPct: 200 };
  return null;
}

/** 単層モデル向けの建築面積・延床面積の粗い代理 */
function footprintAreaM2(blocks: Block[]): number {
  let s = 0;
  for (const b of blocks) {
    if (b.category !== 'structure') continue;
    s += b.dimensions.width * b.dimensions.depth;
  }
  return s;
}

function grossFloorAreaM2(blocks: Block[]): number {
  const slabs = blocks.filter((b) => b.ifcType === 'IfcSlab');
  if (slabs.length > 0) {
    return slabs.reduce(
      (acc, b) => acc + b.dimensions.width * b.dimensions.depth,
      0,
    );
  }
  return footprintAreaM2(blocks);
}

const CORRIDOR_RE = /廊下|通路|corridor|Corridor/i;

function isCorridorLike(b: Block): boolean {
  return CORRIDOR_RE.test(b.name);
}

const MIN_CORRIDOR_WIDTH_M = 1.2;

/**
 * Level 2: 建ぺい率・容積率（敷地情報＋粗い面積）、避難経路幅員
 */
export function regulationCheckFromBlocks(
  blocks: Block[],
  metadata: ProjectMetadata,
): RegulationCheckResult {
  const items: RegulationCheckResult['items'] = [];

  const site = metadata.siteArea;
  if (site == null || site <= 0) {
    return {
      items: [],
      allCompliant: false,
      message:
        '敷地面積（siteArea）が未設定のため、建ぺい率・容積率は判定できません。',
    };
  }

  const limits = resolveLimits(metadata);
  if (!limits) {
    return {
      items: [],
      allCompliant: false,
      message:
        '用途地域または建ぺい率・容積率の上限が未設定です。metadata.zoneType または buildingCoverageLimit / floorAreaRatioLimit を設定してください。',
    };
  }

  const fp = footprintAreaM2(blocks);
  const gfa = grossFloorAreaM2(blocks);
  const covRatioPct = (fp / site) * 100;
  const farRatioPct = (gfa / site) * 100;

  const covOk = covRatioPct <= limits.coveragePct + 1e-6;
  items.push({
    name: '建ぺい率',
    calculatedValue: Math.round(covRatioPct * 100) / 100,
    limitValue: limits.coveragePct,
    unit: '%',
    compliant: covOk,
    description: covOk
      ? '建築面積（構造ブロック水平投影の合計近似）が上限内です。'
      : '建築面積が敷地に対して大きすぎます。平面を見直すか敷地を広げてください。',
  });

  const farOk = farRatioPct <= limits.farPct + 1e-6;
  items.push({
    name: '容積率',
    calculatedValue: Math.round(farRatioPct * 100) / 100,
    limitValue: limits.farPct,
    unit: '%',
    compliant: farOk,
    description: farOk
      ? '延べ床面積（スラブ面積合計、なければ建築面積代理）が上限内です。'
      : '延べ床面積が用途地域の上限を超える見込みです。階数・体積を見直してください。',
  });

  const corridors = blocks.filter(isCorridorLike);
  if (corridors.length === 0) {
    items.push({
      name: '避難経路幅員',
      calculatedValue: 0,
      limitValue: MIN_CORRIDOR_WIDTH_M,
      unit: 'm',
      compliant: true,
      description:
        '名称に「廊下」「通路」を含むブロックがありません（チェック対象なし）。',
    });
  } else {
    for (const c of corridors) {
      const w = Math.min(c.dimensions.width, c.dimensions.depth);
      const ok = w >= MIN_CORRIDOR_WIDTH_M - 1e-6;
      items.push({
        name: `避難経路幅員（${c.name}）`,
        calculatedValue: Math.round(w * 1000) / 1000,
        limitValue: MIN_CORRIDOR_WIDTH_M,
        unit: 'm',
        compliant: ok,
        description: ok
          ? '廊下・通路ブロックの幅が基準以上です。'
          : `幅が ${String(MIN_CORRIDOR_WIDTH_M)}m 未満です。`,
      });
    }
  }

  const allCompliant = items.every((i) => i.compliant);
  return {
    items,
    allCompliant,
    message: allCompliant ? '法規チェック項目はすべて適合しています。' : undefined,
  };
}
