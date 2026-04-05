import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  BlockGenerationResultSchema,
  BlockSchema,
  ImageAnalysisResultSchema,
  type Block,
  type BlockGenerationResult,
  type ImageAnalysisResult,
  type StructureSuggestion,
} from '@block-bim-studio/shared';
import type { AIPort } from './ai-port.js';
import { parseJsonLoose } from './ai-json-utils.js';
import { z } from 'zod';

const SuggestionsWrapperSchema = z.object({
  suggestions: z.array(
    z.object({
      description: z.string(),
      reason: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      suggestedBlocks: z.array(BlockSchema),
    }),
  ),
});

const BlocksWrapperSchema = z.object({
  blocks: z.array(BlockSchema),
  confidence: z.number().min(0).max(1).optional(),
});

const ImageWrapperSchema = ImageAnalysisResultSchema.omit({ message: true });

function mediaTypeFromBase64(b64: string): 'image/png' | 'image/jpeg' {
  try {
    const buf = Buffer.from(b64, 'base64');
    if (
      buf.length >= 4 &&
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    ) {
      return 'image/png';
    }
  } catch {
    /* ignore */
  }
  return 'image/jpeg';
}

export class BedrockAdapter implements AIPort {
  private readonly client: BedrockRuntimeClient;
  private readonly modelId: string;

  constructor() {
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
    });
    this.modelId =
      process.env.BEDROCK_MODEL_ID ??
      'anthropic.claude-3-5-sonnet-20240620-v1:0';
  }

  private async invokeClaudeText(user: string, system?: string): Promise<string> {
    const body = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      system: system ?? undefined,
      messages: [{ role: 'user', content: user }],
    };
    const out = await this.client.send(
      new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: new TextEncoder().encode(JSON.stringify(body)),
      }),
    );
    const json = JSON.parse(
      new TextDecoder().decode(out.body),
    ) as { content?: Array<{ type?: string; text?: string }> };
    const text = json.content?.find((c) => c.type === 'text')?.text;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Bedrock empty response');
    }
    return text;
  }

  private async invokeClaudeVision(
    prompt: string,
    system: string,
    imageBase64: string,
  ): Promise<string> {
    const mediaType = mediaTypeFromBase64(imageBase64);
    const body = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4096,
      system,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: imageBase64,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    };
    const out = await this.client.send(
      new InvokeModelCommand({
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: new TextEncoder().encode(JSON.stringify(body)),
      }),
    );
    const json = JSON.parse(
      new TextDecoder().decode(out.body),
    ) as { content?: Array<{ type?: string; text?: string }> };
    const text = json.content?.find((c) => c.type === 'text')?.text;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Bedrock empty response');
    }
    return text;
  }

  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    return this.invokeClaudeText(prompt, systemPrompt);
  }

  async generateBlocks(description: string): Promise<BlockGenerationResult> {
    const system = `You output ONLY valid JSON. No markdown. Schema:
{"blocks":[...Block...],"confidence":0.0-1.0}
Each Block: id (uuid string), name, ifcType (IfcWall|IfcColumn|IfcBeam|IfcSlab|IfcWindow|IfcDoor|IfcPipeSegment|IfcDuctSegment), category (structure|opening|equipment), position{x,y,z}, rotation{x,y,z}, dimensions{width,height,depth positive}, propertySets[{name,properties:object}].`;
    const text = await this.invokeClaudeText(
      `Create BIM blocks for: ${description}`,
      system,
    );
    const parsed = parseJsonLoose(text);
    const w = BlocksWrapperSchema.parse(parsed);
    return BlockGenerationResultSchema.parse({
      blocks: w.blocks,
      description,
      confidence: w.confidence ?? 0.7,
    });
  }

  async analyzeImage(imageBase64: string): Promise<ImageAnalysisResult> {
    const head = Buffer.from(imageBase64, 'base64').subarray(0, 8);
    if (head.length >= 5 && head.slice(0, 5).toString('ascii') === '%PDF-') {
      return {
        detectedElements: [],
        sourceImageSize: { width: 0, height: 0 },
        message:
          'Bedrock 視覚モデルでは PDF を直接解釈できません。PNG または JPEG を使用してください。',
      };
    }
    const system = `You output ONLY valid JSON. No markdown. Schema:
{"detectedElements":[{"block":{...Block...},"confidence":0-100}],"sourceImageSize":{"width":number,"height":number}}`;
    const text = await this.invokeClaudeVision(
      'Identify building elements in this image and return the JSON schema.',
      system,
      imageBase64,
    );
    const parsed = parseJsonLoose(text);
    const img = ImageWrapperSchema.parse(parsed);
    return {
      ...img,
      message:
        img.detectedElements.length === 0
          ? '要素を自動検出できませんでした。別の画像を試してください。'
          : undefined,
    };
  }

  async suggestStructure(blocks: Block[]): Promise<StructureSuggestion[]> {
    const system = `You output ONLY valid JSON. No markdown. Schema:
{"suggestions":[{"description":string,"reason":string,"priority":"high"|"medium"|"low","suggestedBlocks":[...Block...]}]}`;
    const summary = blocks
      .map(
        (b) =>
          `${b.name}(${b.ifcType}) at (${String(b.position.x)},${String(b.position.y)},${String(b.position.z)})`,
      )
      .join('; ');
    const text = await this.invokeClaudeText(
      `Current blocks: ${summary}. Suggest structural improvements (additional blocks to add).`,
      system,
    );
    const parsed = parseJsonLoose(text);
    const w = SuggestionsWrapperSchema.parse(parsed);
    return w.suggestions;
  }
}
