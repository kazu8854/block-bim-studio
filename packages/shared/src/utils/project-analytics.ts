import type { Block } from '../models/block.js';
import type { Project } from '../models/project.js';

/** Pset_Common.Material をキーにしたブロック数（無ければ unknown） */
export function quantityByMaterialFromBlocks(
  blocks: Block[],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const b of blocks) {
    const mat = b.propertySets.find((p) => p.name === 'Pset_Common')?.properties
      .Material;
    const key =
      typeof mat === 'string' && mat.length > 0 ? mat : 'unknown';
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

/** 全ブロック数に対する工程 status=completed の割合（%） */
export function scheduleProgressPercentFromProject(project: Project): number {
  const n = project.blocks.length;
  if (n === 0) return 0;
  const completed = project.blocks.filter((b) => {
    const s = project.schedules.find((x) => x.blockId === b.id);
    return s?.status === 'completed';
  }).length;
  return Math.round((100 * completed) / n);
}

/** IfcSlab の水平投影面積（幅×奥行）の合算を延べ床面積の近似とする */
export function estimateGrossFloorAreaM2(blocks: Block[]): number {
  let a = 0;
  for (const b of blocks) {
    if (b.ifcType === 'IfcSlab') {
      a += b.dimensions.width * b.dimensions.depth;
    }
  }
  return a;
}

/** 工程の最長スパン（日） */
export function scheduleSpanDaysFromProject(project: Project): number {
  if (project.schedules.length === 0) return 0;
  let minS = Infinity;
  let maxE = -Infinity;
  for (const s of project.schedules) {
    const ds = Date.parse(s.startDate);
    const de = Date.parse(s.endDate);
    if (Number.isFinite(ds)) minS = Math.min(minS, ds);
    if (Number.isFinite(de)) maxE = Math.max(maxE, de);
  }
  if (!Number.isFinite(minS) || !Number.isFinite(maxE) || maxE < minS) {
    return 0;
  }
  return Math.ceil((maxE - minS) / 86400000) + 1;
}
