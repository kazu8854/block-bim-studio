import { z } from 'zod';

/** Phase 0: すべての成功レスポンスに付与するスタブメタ */
export const StubLevel0Schema = z.object({
  _stub: z.literal(true),
  _stubLevel: z.literal(0),
});

export type StubLevel0 = z.infer<typeof StubLevel0Schema>;
