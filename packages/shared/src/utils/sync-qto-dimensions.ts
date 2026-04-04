import type { Block } from '../models/block.js';
import { computeBaseQuantitiesFromDimensions } from './quantities-from-dimensions.js';

/** 寸法に合わせて Qto_BaseQuantities を上書き（属性パネル「変更を適用」用） */
export function syncQtoBaseQuantitiesWithDimensions(block: Block): Block {
  const q = computeBaseQuantitiesFromDimensions(block.dimensions);
  const idx = block.propertySets.findIndex((p) => p.name === 'Qto_BaseQuantities');
  if (idx < 0) {
    return {
      ...block,
      propertySets: [
        ...block.propertySets,
        {
          name: 'Qto_BaseQuantities',
          properties: { Length: q.Length, Area: q.Area, Volume: q.Volume },
        },
      ],
    };
  }
  const nextSets = block.propertySets.map((ps) => {
    if (ps.name !== 'Qto_BaseQuantities') return ps;
    return {
      ...ps,
      properties: {
        ...ps.properties,
        Length: q.Length,
        Area: q.Area,
        Volume: q.Volume,
      },
    };
  });
  return { ...block, propertySets: nextSets };
}
