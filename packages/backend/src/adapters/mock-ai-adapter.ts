import {
  buildPropertySetsForNewIfcBlock,
  type Block,
  type BlockGenerationResult,
  type IfcElementType,
  type ImageAnalysisResult,
  type StructureSuggestion,
} from '@block-bim-studio/shared';
import type { AIPort } from './ai-port.js';

function categoryForIfc(ifcType: IfcElementType): Block['category'] {
  if (ifcType === 'IfcWindow' || ifcType === 'IfcDoor') return 'opening';
  if (ifcType === 'IfcPipeSegment' || ifcType === 'IfcDuctSegment') {
    return 'equipment';
  }
  return 'structure';
}

function mockBlock(
  name: string,
  ifcType: IfcElementType,
  position: Block['position'],
  dimensions: Block['dimensions'],
): Block {
  return {
    id: crypto.randomUUID(),
    name,
    ifcType,
    category: categoryForIfc(ifcType),
    position,
    rotation: { x: 0, y: 0, z: 0 },
    dimensions,
    propertySets: buildPropertySetsForNewIfcBlock(ifcType, dimensions),
  };
}

/** ローカル検証・フロント開発用。実 LLM なしでスキーマ準拠のサンプルを返す。 */
export class MockAIAdapter implements AIPort {
  async chat(_prompt: string, _systemPrompt?: string): Promise<string> {
    return '{"ok":true,"note":"mock-ai-chat"}';
  }

  async generateBlocks(description: string): Promise<BlockGenerationResult> {
    const dims = { width: 2, height: 2.5, depth: 0.2 };
    const wall = mockBlock(
      'AIモック壁',
      'IfcWall',
      { x: -1.5, y: dims.height / 2, z: 0 },
      dims,
    );
    return {
      blocks: [wall],
      description,
      confidence: 0.85,
    };
  }

  async analyzeImage(_imageBase64: string): Promise<ImageAnalysisResult> {
    const dims = { width: 1.2, height: 2.2, depth: 0.25 };
    const wall = mockBlock(
      '画像検出モック',
      'IfcWall',
      { x: 2, y: dims.height / 2, z: 0 },
      dims,
    );
    return {
      detectedElements: [{ block: wall, confidence: 78 }],
      sourceImageSize: { width: 1024, height: 768 },
    };
  }

  async suggestStructure(blocks: Block[]): Promise<StructureSuggestion[]> {
    if (blocks.length < 3) return [];
    const dims = { width: 0.45, height: 3, depth: 0.45 };
    const column = mockBlock(
      '提案コラム',
      'IfcColumn',
      { x: 2, y: dims.height / 2, z: 2 },
      dims,
    );
    return [
      {
        description:
          '隅付近に通し柱を追加し、水平力に対するねじれ剛性を補強する案（モック）。',
        reason:
          'MockAIAdapter のデモ用です。本番では Ollama / Bedrock が解析します。',
        priority: 'medium',
        suggestedBlocks: [column],
      },
    ];
  }
}
