import { z } from 'zod';
import { ProjectSummarySchema } from './project.js';

export const CompareMetricDeltaSchema = z.object({
  metric: z.string(),
  valuesByProjectId: z.record(z.string(), z.number()),
});

export const ProjectCompareResultSchema = z.object({
  projects: z.array(ProjectSummarySchema),
  deltas: z.array(CompareMetricDeltaSchema),
  message: z.string().optional(),
});

export type CompareMetricDelta = z.infer<typeof CompareMetricDeltaSchema>;
export type ProjectCompareResult = z.infer<typeof ProjectCompareResultSchema>;
