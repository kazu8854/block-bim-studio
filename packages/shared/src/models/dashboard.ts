import { z } from 'zod';

export const DashboardDataSchema = z.object({
  projectId: z.string().uuid(),
  blockCount: z.number().int().nonnegative(),
  totalCostEstimate: z.number().nonnegative().optional(),
  scheduleProgressPercent: z.number().min(0).max(100),
  /** 材料名（Pset_Common.Material）別ブロック数 */
  quantityByType: z.record(z.string(), z.number().nonnegative()),
  /** IFC 要素タイプ別コスト内訳（概算） */
  costByIfcType: z.record(z.string(), z.number().nonnegative()),
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;
