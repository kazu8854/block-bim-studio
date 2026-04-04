import { z } from 'zod';
import { BlockSchema } from './block.js';

export const BlockGenerationResultSchema = z.object({
  blocks: z.array(BlockSchema),
  description: z.string(),
  confidence: z.number().min(0).max(1),
});

export const ImageAnalysisResultSchema = z.object({
  detectedElements: z.array(
    z.object({
      block: BlockSchema,
      confidence: z.number().min(0).max(100),
    }),
  ),
  sourceImageSize: z.object({
    width: z.number(),
    height: z.number(),
  }),
});

export const StructureSuggestionSchema = z.object({
  description: z.string(),
  reason: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  suggestedBlocks: z.array(BlockSchema),
});

export type BlockGenerationResult = z.infer<typeof BlockGenerationResultSchema>;
export type ImageAnalysisResult = z.infer<typeof ImageAnalysisResultSchema>;
export type StructureSuggestion = z.infer<typeof StructureSuggestionSchema>;
