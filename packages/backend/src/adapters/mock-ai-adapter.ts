import type { Block } from '@block-bim-studio/shared';
import type { AIPort } from './ai-port.js';

export class MockAIAdapter implements AIPort {
  async chat(_prompt: string, _systemPrompt?: string): Promise<string> {
    return 'mock-ai-chat-response';
  }

  async generateBlocks(description: string) {
    return {
      blocks: [],
      description,
      confidence: 0,
    };
  }

  async analyzeImage(_imageBase64: string) {
    return {
      detectedElements: [],
      sourceImageSize: { width: 0, height: 0 },
    };
  }

  async suggestStructure(_blocks: Block[]) {
    return [];
  }
}
