import type {
  Block,
  BlockGenerationResult,
  ImageAnalysisResult,
  StructureSuggestion,
} from '@block-bim-studio/shared';

export interface AIPort {
  chat(prompt: string, systemPrompt?: string): Promise<string>;
  generateBlocks(description: string): Promise<BlockGenerationResult>;
  analyzeImage(imageBase64: string): Promise<ImageAnalysisResult>;
  suggestStructure(blocks: Block[]): Promise<StructureSuggestion[]>;
}
