import { z } from 'zod';

export const EnvironmentSimulationResultSchema = z.object({
  solarGainKwh: z.number(),
  heatLossKwh: z.number(),
  metrics: z.array(
    z.object({
      name: z.string(),
      value: z.number(),
      unit: z.string(),
    }),
  ),
});

export const SafetySimulationResultSchema = z.object({
  hazards: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    }),
  ),
  passed: z.boolean(),
});

export type EnvironmentSimulationResult = z.infer<
  typeof EnvironmentSimulationResultSchema
>;
export type SafetySimulationResult = z.infer<
  typeof SafetySimulationResultSchema
>;
