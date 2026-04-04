import { z } from 'zod';

export const QuantityResultSchema = z.object({
  byType: z.record(
    z.string(),
    z.object({
      volume: z.number().nonnegative(),
      area: z.number().nonnegative(),
      length: z.number().nonnegative(),
      count: z.number().int().nonnegative(),
    }),
  ),
  total: z.object({
    volume: z.number().nonnegative(),
    area: z.number().nonnegative(),
    count: z.number().int().nonnegative(),
  }),
});

export const CostResultSchema = z.object({
  byType: z.record(
    z.string(),
    z.object({
      cost: z.number().nonnegative(),
      count: z.number().int().nonnegative(),
    }),
  ),
  total: z.number().nonnegative(),
  uncostedBlocks: z.array(z.string()),
});

export const ClashResultSchema = z.object({
  clashes: z.array(
    z.object({
      blockIdA: z.string().uuid(),
      blockIdB: z.string().uuid(),
      intersectionPoint: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      intersectionVolume: z.number().positive(),
    }),
  ),
  message: z.string().optional(),
});

export const CriticalPathResultSchema = z.object({
  criticalPath: z.array(z.string().uuid()),
  totalDuration: z.number().int().nonnegative(),
  projectStartDate: z.string().datetime(),
  projectEndDate: z.string().datetime(),
  blockAnalysis: z.array(
    z.object({
      blockId: z.string().uuid(),
      earliestStart: z.string().datetime(),
      earliestFinish: z.string().datetime(),
      latestStart: z.string().datetime(),
      latestFinish: z.string().datetime(),
      floatDays: z.number().int().nonnegative(),
    }),
  ),
  message: z.string().optional(),
});

export const StructureCheckResultSchema = z.object({
  violations: z.array(
    z.object({
      blockId: z.string().uuid(),
      blockName: z.string(),
      ruleName: z.string(),
      description: z.string(),
      recommendation: z.string(),
    }),
  ),
  passed: z.boolean(),
  /** 全合格時やガイダンス用 */
  message: z.string().optional(),
});

export const RegulationCheckResultSchema = z.object({
  items: z.array(
    z.object({
      name: z.string(),
      calculatedValue: z.number(),
      limitValue: z.number(),
      unit: z.string(),
      compliant: z.boolean(),
      description: z.string().optional(),
    }),
  ),
  allCompliant: z.boolean(),
  message: z.string().optional(),
});

export type QuantityResult = z.infer<typeof QuantityResultSchema>;
export type CostResult = z.infer<typeof CostResultSchema>;
export type ClashResult = z.infer<typeof ClashResultSchema>;
export type CriticalPathResult = z.infer<typeof CriticalPathResultSchema>;
export type StructureCheckResult = z.infer<typeof StructureCheckResultSchema>;
export type RegulationCheckResult = z.infer<typeof RegulationCheckResultSchema>;
