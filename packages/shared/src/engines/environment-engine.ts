import type { Block } from '../models/block.js';
import type {
  EnvironmentEnvelopeDetail,
  EnvironmentSimulationResult,
  EnvironmentWindowDetail,
} from '../models/check-extra.js';

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
    windowDetails: [],
    envelopeDetails: [],
    message: undefined,
  };
}

const DEFAULT_LAMBDA_WM_K = 1.2;
const DEFAULT_THICKNESS_M = 0.15;

function numProp(block: Block, keys: string[]): number | undefined {
  for (const ps of block.propertySets) {
    for (const k of keys) {
      const v = ps.properties[k];
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string') {
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
      }
    }
  }
  return undefined;
}

/** 窓の方位に応じた年間日射量 kWh/m²（水平面換算の粗い係数） */
function windowAnnualIrradianceKwhM2(rotationY: number): number {
  const southComponent = Math.cos(rotationY);
  const base = 880;
  const amp = 320;
  return Math.min(1280, Math.max(680, base + amp * southComponent));
}

function facingLabel(rotationY: number): string {
  const deg = ((((rotationY * 180) / Math.PI) % 360) + 360) % 360;
  if (deg >= 337.5 || deg < 22.5) return '南';
  if (deg < 67.5) return '南西';
  if (deg < 112.5) return '西';
  if (deg < 157.5) return '北西';
  if (deg < 202.5) return '北';
  if (deg < 247.5) return '北東';
  if (deg < 292.5) return '東';
  return '南東';
}

function envelopeSurfaceAreaM2(b: Block): number {
  const { width: w, height: h, depth: d } = b.dimensions;
  return 2 * (w * h + h * d + w * d);
}

/**
 * Level 2: 窓の方位別日射、外皮の概算 U×A（W/K）
 */
export function environmentSimulateFromBlocks(
  blocks: Block[],
): EnvironmentSimulationResult {
  const windowDetails: EnvironmentWindowDetail[] = [];
  let solarSum = 0;

  for (const b of blocks) {
    if (b.ifcType !== 'IfcWindow') continue;
    const area = Math.max(0, b.dimensions.width * b.dimensions.height);
    const irr = windowAnnualIrradianceKwhM2(b.rotation.y);
    const est = area * irr;
    solarSum += est;
    windowDetails.push({
      blockId: b.id,
      blockName: b.name,
      facing: facingLabel(b.rotation.y),
      glazingAreaM2: Math.round(area * 10000) / 10000,
      annualIrradianceKwhM2: Math.round(irr),
      estimatedSolarKwhYear: Math.round(est * 100) / 100,
    });
  }

  const envelopeDetails: EnvironmentEnvelopeDetail[] = [];
  let heatLossWK = 0;

  for (const b of blocks) {
    if (b.category !== 'structure') continue;
    if (b.ifcType === 'IfcWindow' || b.ifcType === 'IfcDoor') continue;
    const lambda =
      numProp(b, [
        'ThermalConductivity',
        'thermalConductivity',
        'Lambda',
        'lambda',
      ]) ?? DEFAULT_LAMBDA_WM_K;
    const t =
      numProp(b, ['Thickness', 'thickness']) ?? DEFAULT_THICKNESS_M;
    const thickness = Math.max(0.05, t);
    const u = lambda / thickness;
    const a = envelopeSurfaceAreaM2(b);
    const q = u * a;
    heatLossWK += q;
    envelopeDetails.push({
      blockId: b.id,
      blockName: b.name,
      ifcType: b.ifcType,
      grossAreaM2: Math.round(a * 100) / 100,
      uValueWm2K: Math.round(u * 1000) / 1000,
      heatLossWK: Math.round(q * 100) / 100,
    });
  }

  const metrics = [
    { name: '年間日射エネルギー（窓合計・概算）', value: solarSum, unit: 'kWh/年' },
    {
      name: '外皮熱損失 UA 合計（概算）',
      value: heatLossWK,
      unit: 'W/K',
    },
  ];

  const message =
    windowDetails.length === 0
      ? '窓ブロック（IfcWindow）がありません。日射量は算出していません。'
      : undefined;

  return {
    solarGainKwh: Math.round(solarSum * 100) / 100,
    heatLossKwh: Math.round(heatLossWK * 100) / 100,
    metrics,
    windowDetails,
    envelopeDetails,
    message,
  };
}
