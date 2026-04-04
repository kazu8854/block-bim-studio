import type { Block } from '@block-bim-studio/shared';
import type { AIPort } from '../adapters/ai-port.js';
import type { DbPort } from '../adapters/db-port.js';

export class AIUsecase {
  constructor(
    private readonly ai: AIPort,
    private readonly db: DbPort,
  ) {}

  async suggestForProject(projectId: string) {
    const p = await this.db.getProject(projectId);
    if (!p) return null;
    return this.ai.suggestStructure(p.blocks);
  }

  async generateFromText(description: string) {
    return this.ai.generateBlocks(description);
  }

  async generateFromImage(imageBase64: string) {
    return this.ai.analyzeImage(imageBase64);
  }

  async suggestFromBlocks(blocks: Block[]) {
    return this.ai.suggestStructure(blocks);
  }
}
