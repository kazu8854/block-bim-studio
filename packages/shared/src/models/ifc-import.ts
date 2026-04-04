import { z } from 'zod';
import { BlockSchema } from './block.js';

export const IfcImportResultSchema = z.object({
  blocks: z.array(BlockSchema),
  warnings: z.array(z.string()),
});

export type IfcImportResult = z.infer<typeof IfcImportResultSchema>;
