import type { AIPort } from './ai-port.js';
import { MockAIAdapter } from './mock-ai-adapter.js';

/**
 * Phase 0: 固定レスポンスの Mock のみ。後続フェーズで Bedrock / Ollama を接続する。
 */
export async function createAIAdapter(): Promise<AIPort> {
  return new MockAIAdapter();
}
