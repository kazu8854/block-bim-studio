import type { Block, PropertySet } from '@block-bim-studio/shared';

/** レガシー／欠損補完用。新規配置は `buildPropertySetsForNewIfcBlock`（shared）を使う。 */
const DEFAULT_SET_NAMES = new Set([
  'Pset_Common',
  'Qto_BaseQuantities',
  'Pset_Cost',
]);

export function createDefaultPropertySets(): PropertySet[] {
  return [
    {
      name: 'Pset_Common',
      properties: { Material: 'Generic', FireRating: 'N/A' },
    },
    {
      name: 'Qto_BaseQuantities',
      properties: { Length: 0, Area: 0, Volume: 0 },
    },
    {
      name: 'Pset_Cost',
      properties: { UnitPrice: 0, Currency: 'JPY' },
    },
  ];
}

/** 既定の 3 PropertySet が無ければマージする */
export function ensureDefaultPropertySets(block: Block): Block {
  const existing = new Set(block.propertySets.map((p) => p.name));
  const merged = [...block.propertySets];
  for (const def of createDefaultPropertySets()) {
    if (!existing.has(def.name)) {
      merged.push(def);
    }
  }
  return { ...block, propertySets: merged };
}

export function isDefaultPropertySetName(name: string): boolean {
  return DEFAULT_SET_NAMES.has(name);
}
