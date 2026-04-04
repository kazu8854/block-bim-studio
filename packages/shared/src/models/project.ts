import { z } from 'zod';
import { BlockSchema } from './block.js';
import { ScheduleInfoSchema } from './schedule.js';

export const ProjectStatusEnum = z.enum([
  'draft',
  'active',
  'completed',
  'archived',
]);

export const ProjectMetadataSchema = z.object({
  siteArea: z.number().positive().optional(),
  zoneType: z.string().optional(),
  buildingCoverageLimit: z.number().optional(),
  floorAreaRatioLimit: z.number().optional(),
});

export const ProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  status: ProjectStatusEnum,
  metadata: ProjectMetadataSchema,
  blocks: z.array(BlockSchema),
  schedules: z.array(ScheduleInfoSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: ProjectStatusEnum,
  blockCount: z.number().int().nonnegative(),
  totalCost: z.number().nonnegative().optional(),
  updatedAt: z.string().datetime(),
  thumbnailUrl: z.string().url().optional(),
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectStatus = z.infer<typeof ProjectStatusEnum>;
export type ProjectMetadata = z.infer<typeof ProjectMetadataSchema>;
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>;
