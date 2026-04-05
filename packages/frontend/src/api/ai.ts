import type {
  Block,
  BlockGenerationResult,
  ImageAnalysisResult,
  StructureSuggestion,
} from '@block-bim-studio/shared';
import { fetchJson } from '@/api/http';

export type SuggestStructureResult = {
  suggestions: StructureSuggestion[];
  message?: string;
};

export async function suggestStructure(projectId: string): Promise<SuggestStructureResult> {
  return fetchJson<SuggestStructureResult>('/api/ai/suggest-structure', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
  });
}

export async function generateFromText(text: string): Promise<BlockGenerationResult> {
  return fetchJson<BlockGenerationResult>('/api/ai/generate-from-text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function generateFromImage(
  imageBase64: string,
): Promise<ImageAnalysisResult> {
  return fetchJson<ImageAnalysisResult>('/api/ai/generate-from-image', {
    method: 'POST',
    body: JSON.stringify({ imageBase64 }),
  });
}

export const AI_TEXT_MAX_CHARS = 1000;
export const AI_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  const okType =
    file.type === 'image/png' ||
    file.type === 'image/jpeg' ||
    file.type === 'application/pdf';
  if (!okType) return 'PNG / JPEG / PDF のみ対応しています。';
  if (file.size > AI_IMAGE_MAX_BYTES) return 'ファイルは 10MB 以下にしてください。';
  return null;
}

export async function readFileAsBase64(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function mergeBlocksAvoidingIds(
  existing: Block[],
  incoming: Block[],
): Block[] {
  const ids = new Set(existing.map((b) => b.id));
  return incoming.map((b) =>
    ids.has(b.id) ? { ...b, id: crypto.randomUUID() } : b,
  );
}
