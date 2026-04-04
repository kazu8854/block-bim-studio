import type { Dimensions, IfcElementType, PropertySet } from '../models/block.js';
import { IFC_TYPE_DEFAULT_COMMON_AND_COST } from '../data/ifc-type-defaults.js';
import { computeBaseQuantitiesFromDimensions } from './quantities-from-dimensions.js';

/**
 * パレットから配置したブロック用の 3 PropertySet（B0）
 */
export function buildPropertySetsForNewIfcBlock(
  ifcType: IfcElementType,
  dimensions: Dimensions,
): PropertySet[] {
  const def = IFC_TYPE_DEFAULT_COMMON_AND_COST[ifcType];
  const q = computeBaseQuantitiesFromDimensions(dimensions);
  return [
    {
      name: 'Pset_Common',
      properties: {
        Material: def.material,
        FireRating: def.fireRating,
      },
    },
    {
      name: 'Qto_BaseQuantities',
      properties: {
        Length: q.Length,
        Area: q.Area,
        Volume: q.Volume,
      },
    },
    {
      name: 'Pset_Cost',
      properties: {
        UnitPrice: def.unitPricePerM3,
        Currency: def.currency,
      },
    },
  ];
}
