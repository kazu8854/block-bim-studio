/**
 * LLM 出力から JSON を取り出してパースする（フェンス除去・先頭オブジェクト抽出のフォールバック）。
 */
export function extractJsonText(raw: string): string {
  let t = raw.trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)```$/m.exec(t);
  if (fence) t = fence[1]!.trim();
  return t;
}

export function parseJsonLoose(raw: string): unknown {
  const t = extractJsonText(raw);
  try {
    return JSON.parse(t) as unknown;
  } catch {
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(t.slice(start, end + 1)) as unknown;
    }
    throw new Error('AI_JSON_PARSE_FAILED');
  }
}
