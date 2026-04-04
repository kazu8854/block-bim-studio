import { z } from 'zod';
import { IfcElementTypeEnum } from './block.js';

export const EnvironmentWindowDetailSchema = z.object({
  blockId: z.string().uuid(),
  blockName: z.string(),
  /** 方位ラベル（例: 南） */
  facing: z.string(),
  glazingAreaM2: z.number().nonnegative(),
  /** 年間面積あたり日射量 kWh/m²（概算） */
  annualIrradianceKwhM2: z.number().nonnegative(),
  /** 当該窓の年間日射エネルギー概算 kWh/年 */
  estimatedSolarKwhYear: z.number(),
});

export const EnvironmentEnvelopeDetailSchema = z.object({
  blockId: z.string().uuid(),
  blockName: z.string(),
  ifcType: IfcElementTypeEnum,
  grossAreaM2: z.number().nonnegative(),
  /** 概算 U 値 W/(m²·K) */
  uValueWm2K: z.number().nonnegative(),
  /** U×A（W/K） */
  heatLossWK: z.number().nonnegative(),
});

export const EnvironmentSimulationResultSchema = z.object({
  /** 窓を通じた年間日射エネルギー概算の合計 kWh/年 */
  solarGainKwh: z.number(),
  /** 外皮熱損失 UA 合計（W/K）。レガシー名 heatLossKwh だが単位は W/K */
  heatLossKwh: z.number(),
  metrics: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string(),
    }),
  ),
  windowDetails: z.array(EnvironmentWindowDetailSchema).default([]),
  envelopeDetails: z.array(EnvironmentEnvelopeDetailSchema).default([]),
  message: z.string().optional(),
});

export const SafetyHazardSchema = z.object({
  id: z.string(),
  kind: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  riskLevel: z.enum(['low', 'medium', 'high']),
  blockIds: z.array(z.string().uuid()),
  blockNames: z.array(z.string()),
  /** 該当工程の期間（表示用） */
  periodDescription: z.string(),
});

export const SafetySimulationResultSchema = z.object({
  hazards: z.array(SafetyHazardSchema),
  passed: z.boolean(),
  message: z.string().optional(),
});

export type EnvironmentWindowDetail = z.infer<typeof EnvironmentWindowDetailSchema>;
export type EnvironmentEnvelopeDetail = z.infer<
  typeof EnvironmentEnvelopeDetailSchema
>;
export type EnvironmentSimulationResult = z.infer<
  typeof EnvironmentSimulationResultSchema
>;
export type SafetyHazard = z.infer<typeof SafetyHazardSchema>;
export type SafetySimulationResult = z.infer<
  typeof SafetySimulationResultSchema
>;
