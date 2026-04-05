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

export class OllamaAdapter implements AIPort {
  constructor(
    private readonly model: string,
    private readonly baseUrl: string,
  ) {}

  private async invoke(
    user: string,
    system?: string,
    images?: string[],
  ): Promise<string> {
    const messages: Array<Record<string, unknown>> = [];
    if (system) messages.push({ role: 'system', content: system });
    const userMsg: Record<string, unknown> = {
      role: 'user',
      content: user,
    };
    if (images?.length) userMsg.images = images;
    messages.push(userMsg);

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`Ollama chat failed: ${String(res.status)}`);
    }
    const data = (await res.json()) as {
      message?: { content?: string };
    };
    const text = data.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('Ollama empty response');
    }
    return text;
  }

  async chat(prompt: string, systemPrompt?: string): Promise<string> {
    return this.invoke(prompt, systemPrompt);
  }

  async generateBlocks(description: string): Promise<BlockGenerationResult> {
    const system = `You output ONLY valid JSON. No markdown. Schema:
{"blocks":[...Block...],"confidence":0.0-1.0}
Each Block: id (uuid string), name, ifcType (IfcWall|IfcColumn|IfcBeam|IfcSlab|IfcWindow|IfcDoor|IfcPipeSegment|IfcDuctSegment), category (structure|opening|equipment), position{x,y,z}, rotation{x,y,z}, dimensions{width,height,depth positive}, propertySets[{name,properties:object}].`;
    const text = await this.invoke(
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
    const system = `You output ONLY valid JSON. No markdown. Schema:
{"detectedElements":[{"block":{...Block...},"confidence":0-100}],"sourceImageSize":{"width":number,"height":number}}
Use reasonable defaults for Block fields if uncertain.`;
    const buf = Buffer.from(imageBase64, 'base64');
    const isPdf = buf.length >= 5 && buf.slice(0, 5).toString('ascii') === '%PDF-';
    const text = await this.invoke(
      isPdf
        ? 'A floor plan was uploaded as PDF (no raster). Propose one plausible IfcWall block in the required JSON schema.'
        : 'Identify building elements in this image and return the JSON schema.',
      system,
      isPdf ? undefined : [imageBase64],
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
    const text = await this.invoke(
      `Current blocks: ${summary}. Suggest structural improvements (additional blocks to add).`,
      system,
    );
    const parsed = parseJsonLoose(text);
    const w = SuggestionsWrapperSchema.parse(parsed);
    return w.suggestions;
  }
}
