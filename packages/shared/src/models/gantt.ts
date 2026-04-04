import { z } from 'zod';
import { DependencyTypeEnum, ProgressStatusEnum } from './schedule.js';

export const GanttTaskRowSchema = z.object({
  blockId: z.string().uuid(),
  name: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  durationDays: z.number().int().positive(),
  dependencyBlockIds: z.array(z.string().uuid()),
  status: ProgressStatusEnum,
});

/** 矢印描画用（先行 → 後続） */
export const GanttDependencyEdgeSchema = z.object({
  fromBlockId: z.string().uuid(),
  toBlockId: z.string().uuid(),
  type: DependencyTypeEnum,
});

export const GanttChartDataSchema = z.object({
  tasks: z.array(GanttTaskRowSchema),
  /** 依存関係の矢印 */
  dependencyEdges: z.array(GanttDependencyEdgeSchema).default([]),
  scaleStart: z.string().datetime(),
  scaleEnd: z.string().datetime(),
  /** 検証・ガイダンス用 */
  message: z.string().optional(),
});

export type GanttTaskRow = z.infer<typeof GanttTaskRowSchema>;
export type GanttDependencyEdge = z.infer<typeof GanttDependencyEdgeSchema>;
export type GanttChartData = z.infer<typeof GanttChartDataSchema>;
