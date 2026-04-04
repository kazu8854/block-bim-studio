import type { Dimensions } from '../models/block.js';

/** 直方体ブロックの体積 (m³)、表面積 (m²)、代表長さ (m) */
export function computeBaseQuantitiesFromDimensions(dimensions: Dimensions): {
  Length: number;
  Area: number;
  Volume: number;
} {
  const { width: w, height: h, depth: d } = dimensions;
  const volume = w * h * d;
  const area = 2 * (w * h + w * d + h * d);
  const length = Math.max(w, h, d);
  return { Length: length, Area: area, Volume: volume };
}
