import type {
  Block,
  BlockGenerationResult,
  ImageAnalysisResult,
  StructureSuggestion,
} from '@block-bim-studio/shared';
import type { AIPort } from '../adapters/ai-port.js';
import type { DbPort } from '../adapters/db-port.js';

export const AI_TEXT_MAX_LENGTH = 1000;
export const AI_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export type SuggestStructureOutcome = {
  suggestions: StructureSuggestion[];
  message?: string;
};

function isPngJpegOrPdf(buf: Buffer): boolean {
  if (
    buf.length >= 4 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return true;
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return true;
  }
  if (buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-') {
    return true;
  }
  return false;
}

export class AIUsecase {
  constructor(
    private readonly ai: AIPort,
    private readonly db: DbPort,
  ) {}

  validateImageBase64(imageBase64: string): void {
    let buf: Buffer;
    try {
      buf = Buffer.from(imageBase64, 'base64');
    } catch {
      throw new Error('INVALID_IMAGE_BASE64');
    }
    if (buf.length === 0) throw new Error('EMPTY_IMAGE');
    if (buf.length > AI_IMAGE_MAX_BYTES) throw new Error('IMAGE_TOO_LARGE');
    if (!isPngJpegOrPdf(buf)) throw new Error('UNSUPPORTED_IMAGE_TYPE');
  }

  async suggestForProject(
    projectId: string,
  ): Promise<SuggestStructureOutcome | null> {
    const p = await this.db.getProject(projectId);
    if (!p) return null;
    return this.suggestFromBlocks(p.blocks);
  }

  async suggestFromBlocks(blocks: Block[]): Promise<SuggestStructureOutcome> {
    if (blocks.length < 3) {
      return {
        suggestions: [],
        message:
          '構造提案には、キャンバス上にブロックが3個以上必要です。ブロックを追加してから再度お試しください。',
      };
    }
    const suggestions = await this.ai.suggestStructure(blocks);
    return { suggestions };
  }

  async generateFromText(description: string): Promise<BlockGenerationResult> {
    if (description.length > AI_TEXT_MAX_LENGTH) {
      throw new Error('TEXT_TOO_LONG');
    }
    try {
      return await this.ai.generateBlocks(description);
    } catch {
      throw new Error('AI_GENERATION_FAILED');
    }
  }

  async generateFromImage(imageBase64: string): Promise<ImageAnalysisResult> {
    this.validateImageBase64(imageBase64);
    try {
      return await this.ai.analyzeImage(imageBase64);
    } catch {
      throw new Error('AI_IMAGE_ANALYSIS_FAILED');
    }
  }
}
