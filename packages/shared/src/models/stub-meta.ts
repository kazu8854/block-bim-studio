import { z } from 'zod';

/** Phase 0: すべての成功レスポンスに付与するスタブメタ */
export const StubLevel0Schema = z.object({
  _stub: z.literal(true),
  _stubLevel: z.literal(0),
});

export type StubLevel0 = z.infer<typeof StubLevel0Schema>;

/** グループ A: プロジェクト REST API など本実装（Level 2） */
export const StubLevel2ProjectSchema = z.object({
  _stub: z.literal(false),
  _stubLevel: z.literal(2),
});

export type StubLevel2Project = z.infer<typeof StubLevel2ProjectSchema>;

/** シミュレーション API（グループ B）— メタ形状は Level 2 プロジェクト API と同一 */
export const StubLevel2SimulationSchema = StubLevel2ProjectSchema;
export type StubLevel2Simulation = z.infer<typeof StubLevel2SimulationSchema>;
