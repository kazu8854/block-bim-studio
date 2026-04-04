import type { Block, IfcElementType } from '../models/block.js';
import { IfcElementTypeEnum } from '../models/block.js';
import type { IfcBinary } from './ifc-types.js';
import { getIfcApi } from './ifc-wasm-init.js';
import { IFCBUILDINGELEMENTPROXY } from 'web-ifc';
import { z } from 'zod';
import { buildPropertySetsForNewIfcBlock } from '../utils/new-block-property-sets.js';

export interface IfcParser {
  parse(buffer: IfcBinary): Promise<{ blocks: Block[]; warnings: string[] }>;
}

const IFC_TYPES = new Set(IfcElementTypeEnum.options);

function categoryForIfcType(ifcType: IfcElementType): Block['category'] {
  if (ifcType === 'IfcWindow' || ifcType === 'IfcDoor') return 'opening';
  if (ifcType === 'IfcPipeSegment' || ifcType === 'IfcDuctSegment') {
    return 'equipment';
  }
  return 'structure';
}

function expressIdFromRef(ref: unknown): number | null {
  if (typeof ref === 'number' && Number.isFinite(ref)) return ref;
  if (ref && typeof ref === 'object' && 'expressID' in ref) {
    const n = (ref as { expressID: number }).expressID;
    return typeof n === 'number' ? n : null;
  }
  return null;
}

function unwrapLabel(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && v !== null && 'value' in v) {
    return String((v as { value: unknown }).value);
  }
  return '';
}

function unwrapNominal(v: unknown): string | number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }
  if (v && typeof v === 'object' && v !== null && 'value' in v) {
    const raw = (v as { value: unknown }).value;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    if (typeof raw === 'string') {
      const n = Number(raw);
      return Number.isFinite(n) ? n : raw;
    }
  }
  return 0;
}

function parseCoordinates(coords: unknown): { x: number; y: number; z: number } {
  if (!Array.isArray(coords)) return { x: 0, y: 0, z: 0 };
  const xs = coords.map((c) => Number(unwrapNominal(c)));
  return {
    x: Number.isFinite(xs[0]) ? xs[0]! : 0,
    y: Number.isFinite(xs[1]) ? xs[1]! : 0,
    z: Number.isFinite(xs[2]) ? xs[2]! : 0,
  };
}

/** 親が同一軸の並進のみとみなして原点を合算（テンプレ階＋ローカル配置用） */
function placementAbsoluteOrigin(
  api: Awaited<ReturnType<typeof getIfcApi>>,
  mid: number,
  placementEid: number,
): { x: number; y: number; z: number } {
  const pl = api.GetLine(mid, placementEid, true, false);
  if (!pl) return { x: 0, y: 0, z: 0 };
  let ox = 0;
  let oy = 0;
  let oz = 0;
  const rel = pl.RelativePlacement;
  const rid = expressIdFromRef(rel);
  if (rid != null) {
    const ax = api.GetLine(mid, rid, true, false);
    const lid = expressIdFromRef(ax?.Location);
    if (lid != null) {
      const pt = api.GetLine(mid, lid, true, false);
      const o = parseCoordinates(pt?.Coordinates);
      ox += o.x;
      oy += o.y;
      oz += o.z;
    }
  }
  const parent = pl.PlacementRelTo;
  const pid = expressIdFromRef(parent);
  if (pid != null) {
    const p = placementAbsoluteOrigin(api, mid, pid);
    ox += p.x;
    oy += p.y;
    oz += p.z;
  }
  return { x: ox, y: oy, z: oz };
}

async function readPsetBlockBimExport(
  api: Awaited<ReturnType<typeof getIfcApi>>,
  mid: number,
  elementExpressId: number,
): Promise<Record<string, string | number> | null> {
  const psets = await api.properties.getPropertySets(mid, elementExpressId, true);
  for (const ps of psets ?? []) {
    const name = unwrapLabel(ps?.Name);
    if (name !== 'Pset_BlockBIMExport') continue;
    const props: Record<string, string | number> = {};
    const hp = ps.HasProperties ?? [];
    for (const h of hp) {
      const pid = expressIdFromRef(h);
      if (pid == null) continue;
      const pv = api.GetLine(mid, pid, true, false);
      const pname = unwrapLabel(pv?.Name);
      if (!pname) continue;
      props[pname] = unwrapNominal(pv?.NominalValue);
    }
    return props;
  }
  return null;
}

export async function parseIfc(
  buffer: IfcBinary,
): Promise<{ blocks: Block[]; warnings: string[] }> {
  const warnings: string[] = [];
  if (!buffer?.length) {
    throw new Error('IFC データが空です');
  }
  const api = await getIfcApi();
  let mid = -1;
  try {
    mid = api.OpenModel(new Uint8Array(buffer));
  } catch {
    throw new Error('IFC ファイルが破損しているか、サポート外の形式です');
  }
  if (mid < 0) {
    throw new Error('IFC ファイルを開けませんでした');
  }
  try {
    const ids = api.GetLineIDsWithType(mid, IFCBUILDINGELEMENTPROXY);
    const blocks: Block[] = [];
    for (let i = 0; i < ids.size(); i++) {
      const eid = ids.get(i);
      const proxy = api.GetLine(mid, eid, true, false);
      const placementEid = expressIdFromRef(proxy?.ObjectPlacement);
      const position =
        placementEid != null
          ? placementAbsoluteOrigin(api, mid, placementEid)
          : { x: 0, y: 0, z: 0 };

      const rawType = unwrapLabel(proxy?.ObjectType) || 'IfcWall';
      const ifcType = IFC_TYPES.has(rawType as IfcElementType)
        ? (rawType as IfcElementType)
        : (warnings.push(`未対応の要素タイプを IfcWall として読み替えました: ${rawType}`),
          'IfcWall' as IfcElementType);

      const name = unwrapLabel(proxy?.Name) || 'Imported block';

      const pset = await readPsetBlockBimExport(api, mid, eid);
      if (!pset) {
        warnings.push(`プロキシ expressID=${String(eid)} に Pset_BlockBIMExport がありません。スキップしました。`);
        continue;
      }

      const blockIdRaw = pset.BlockId;
      const blockId =
        typeof blockIdRaw === 'string' && z.string().uuid().safeParse(blockIdRaw).success
          ? blockIdRaw
          : crypto.randomUUID();

      const w = Number(pset.Width);
      const h = Number(pset.Height);
      const d = Number(pset.Depth);
      if (!(w > 0 && h > 0 && d > 0)) {
        warnings.push(`ブロック ${name} の寸法が不正のためスキップしました。`);
        continue;
      }

      const ry = Number(pset.RotationY);
      const rotation = {
        x: 0,
        y: Number.isFinite(ry) ? ry : 0,
        z: 0,
      };

      const category = categoryForIfcType(ifcType);
      const dimensions = { width: w, height: h, depth: d };

      const block: Block = {
        id: blockId,
        name,
        ifcType,
        category,
        position,
        rotation,
        dimensions,
        propertySets: buildPropertySetsForNewIfcBlock(ifcType, dimensions),
      };
      blocks.push(block);
    }
    return { blocks, warnings };
  } finally {
    api.CloseModel(mid);
  }
}

export async function parseIfcLevel0(
  buffer: IfcBinary,
): Promise<{ blocks: Block[]; warnings: string[] }> {
  return parseIfc(buffer);
}
