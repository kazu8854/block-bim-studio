import type { BlockCategory, IfcElementType } from '@block-bim-studio/shared';

export type BlockCatalogEntry = {
  id: string;
  name: string;
  ifcType: IfcElementType;
  category: BlockCategory;
  defaultDimensions: { width: number; height: number; depth: number };
  description: string;
};

export const BLOCK_CATALOG: BlockCatalogEntry[] = [
  {
    id: 'wall-std',
    name: '壁（標準）',
    ifcType: 'IfcWall',
    category: 'structure',
    defaultDimensions: { width: 4, height: 3, depth: 0.2 },
    description: 'IfcWall — 構造体',
  },
  {
    id: 'column-std',
    name: '柱（標準）',
    ifcType: 'IfcColumn',
    category: 'structure',
    defaultDimensions: { width: 0.4, height: 3, depth: 0.4 },
    description: 'IfcColumn — 構造体',
  },
  {
    id: 'beam-std',
    name: '梁（標準）',
    ifcType: 'IfcBeam',
    category: 'structure',
    defaultDimensions: { width: 0.3, height: 0.6, depth: 4 },
    description: 'IfcBeam — 構造体',
  },
  {
    id: 'slab-std',
    name: 'スラブ（標準）',
    ifcType: 'IfcSlab',
    category: 'structure',
    defaultDimensions: { width: 4, height: 0.25, depth: 4 },
    description: 'IfcSlab — 構造体',
  },
  {
    id: 'window-std',
    name: '窓',
    ifcType: 'IfcWindow',
    category: 'opening',
    defaultDimensions: { width: 1.2, height: 1.4, depth: 0.15 },
    description: 'IfcWindow — 開口部',
  },
  {
    id: 'door-std',
    name: 'ドア',
    ifcType: 'IfcDoor',
    category: 'opening',
    defaultDimensions: { width: 0.9, height: 2.1, depth: 0.12 },
    description: 'IfcDoor — 開口部',
  },
  {
    id: 'pipe-std',
    name: '配管',
    ifcType: 'IfcPipeSegment',
    category: 'equipment',
    defaultDimensions: { width: 0.1, height: 0.1, depth: 2 },
    description: 'IfcPipeSegment — 設備',
  },
  {
    id: 'duct-std',
    name: 'ダクト',
    ifcType: 'IfcDuctSegment',
    category: 'equipment',
    defaultDimensions: { width: 0.4, height: 0.3, depth: 2 },
    description: 'IfcDuctSegment — 設備',
  },
];

export const CATEGORY_LABELS: Record<BlockCategory, string> = {
  structure: '構造体',
  opening: '開口部',
  equipment: '設備',
};

export function catalogByCategory(
  category: BlockCategory,
): BlockCatalogEntry[] {
  return BLOCK_CATALOG.filter((e) => e.category === category);
}

export function filterCatalogBySearch(
  entries: BlockCatalogEntry[],
  query: string,
): BlockCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.ifcType.toLowerCase().includes(q),
  );
}
