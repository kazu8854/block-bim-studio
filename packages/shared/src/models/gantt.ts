import { z } from 'zod';
import { ProgressStatusEnum } from './schedule.js';

export const GanttTaskRowSchema = z.object({
  blockId: z.string().uuid(),
  name: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  durationDays: z.number().int().positive(),
  dependencyBlockIds: z.array(z.string().uuid()),
  status: ProgressStatusEnum,
});

export const GanttChartDataSchema = z.object({
  tasks: z.array(GanttTaskRowSchema),
  scaleStart: z.string().datetime(),
  scaleEnd: z.string().datetime(),
});

export type GanttTaskRow = z.infer<typeof GanttTaskRowSchema>;
export type GanttChartData = z.infer<typeof GanttChartDataSchema>;
