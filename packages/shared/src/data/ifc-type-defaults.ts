import type { IfcElementType } from '../models/block.js';

/**
 * カタログ／新規ブロック用の Pset_Common・Pset_Cost 既定値（グループ B0）
 * 単価は体積ベース概算（¥/m³）としてコストエンジンで使用する。
 */
export type IfcTypeCommonAndCostDefaults = {
  material: string;
  fireRating: string;
  unitPricePerM3: number;
  currency: string;
};

export const IFC_TYPE_DEFAULT_COMMON_AND_COST: Record<
  IfcElementType,
  IfcTypeCommonAndCostDefaults
> = {
  IfcWall: {
    material: 'RC',
    fireRating: '1時間',
    unitPricePerM3: 50_000,
    currency: 'JPY',
  },
  IfcColumn: {
    material: 'RC',
    fireRating: '2時間',
    unitPricePerM3: 55_000,
    currency: 'JPY',
  },
  IfcBeam: {
    material: 'S',
    fireRating: '1時間',
    unitPricePerM3: 48_000,
    currency: 'JPY',
  },
  IfcSlab: {
    material: 'RC',
    fireRating: '1時間',
    unitPricePerM3: 52_000,
    currency: 'JPY',
  },
  IfcWindow: {
    material: 'アルミサッシ',
    fireRating: 'N/A',
    unitPricePerM3: 120_000,
    currency: 'JPY',
  },
  IfcDoor: {
    material: '木製',
    fireRating: '30分',
    unitPricePerM3: 80_000,
    currency: 'JPY',
  },
  IfcPipeSegment: {
    material: 'PVC',
    fireRating: 'N/A',
    unitPricePerM3: 35_000,
    currency: 'JPY',
  },
  IfcDuctSegment: {
    material: '亜鉛めっき鋼板',
    fireRating: 'N/A',
    unitPricePerM3: 42_000,
    currency: 'JPY',
  },
};
