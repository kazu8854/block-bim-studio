import { z } from 'zod';

export const DashboardDataSchema = z.object({
  projectId: z.string().uuid(),
  blockCount: z.number().int().nonnegative(),
  totalCostEstimate: z.number().nonnegative().optional(),
  scheduleProgressPercent: z.number().min(0).max(100),
  quantityByType: z.record(z.string(), z.number().nonnegative()),
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;
