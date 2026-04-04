import { z } from 'zod';

export const DependencyTypeEnum = z.enum(['FS', 'SS', 'FF', 'SF']);

export const ProgressStatusEnum = z.enum([
  'not_started',
  'in_progress',
  'completed',
]);

export const DependencySchema = z.object({
  blockId: z.string().uuid(),
  type: DependencyTypeEnum,
});

export const ScheduleInfoSchema = z.object({
  blockId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  durationDays: z.number().int().positive(),
  dependencies: z.array(DependencySchema),
  status: ProgressStatusEnum,
});

export type ScheduleInfo = z.infer<typeof ScheduleInfoSchema>;
export type Dependency = z.infer<typeof DependencySchema>;
export type DependencyType = z.infer<typeof DependencyTypeEnum>;
export type ProgressStatus = z.infer<typeof ProgressStatusEnum>;
