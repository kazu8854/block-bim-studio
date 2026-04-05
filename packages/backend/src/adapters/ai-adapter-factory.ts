import type { AIPort } from './ai-port.js';
import { BedrockAdapter } from './bedrock-adapter.js';
import { MockAIAdapter } from './mock-ai-adapter.js';
import { OllamaAdapter } from './ollama-adapter.js';

/**
 * 環境変数と Ollama の起動状態に応じて AI アダプターを選択する。
 *
 * - MOCK_AWS≠true → BedrockAdapter（本番想定）
 * - MOCK_AWS=true かつ Ollama 応答あり → OllamaAdapter
 * - それ以外 → MockAIAdapter
 */
export async function createAIAdapter(): Promise<AIPort> {
  const isMock = process.env.MOCK_AWS === 'true';

  if (!isMock) {
    console.log('[AI] BedrockAdapter selected');
    return new BedrockAdapter();
  }

  const baseUrl = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 800);
    const res = await fetch(`${baseUrl}/api/tags`, { signal: ctrl.signal });
    clearTimeout(t);
    if (res.ok) {
      const model = process.env.OLLAMA_MODEL ?? 'qwen2.5';
      console.log(`[AI] OllamaAdapter selected (model: ${model}, ${baseUrl})`);
      return new OllamaAdapter(model, baseUrl);
    }
  } catch {
    /* Ollama 未起動 */
  }

  console.log('[AI] MockAIAdapter selected');
  return new MockAIAdapter();
}
