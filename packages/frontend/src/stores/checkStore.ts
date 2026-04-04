import type {
  EnvironmentSimulationResult,
  RegulationCheckResult,
  SafetySimulationResult,
  StructureCheckResult,
} from '@block-bim-studio/shared';
import { create } from 'zustand';

type CheckState = {
  structure: StructureCheckResult | null;
  regulation: RegulationCheckResult | null;
  environment: EnvironmentSimulationResult | null;
  safety: SafetySimulationResult | null;
  loading: boolean;
  error: string | null;
  setResults: (r: {
    structure: StructureCheckResult | null;
    regulation: RegulationCheckResult | null;
    environment: EnvironmentSimulationResult | null;
    safety: SafetySimulationResult | null;
  }) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  clear: () => void;
};

export const useCheckStore = create<CheckState>((set) => ({
  structure: null,
  regulation: null,
  environment: null,
  safety: null,
  loading: false,
  error: null,

  setResults: (r) =>
    set({
      structure: r.structure,
      regulation: r.regulation,
      environment: r.environment,
      safety: r.safety,
    }),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  clear: () =>
    set({
      structure: null,
      regulation: null,
      environment: null,
      safety: null,
      error: null,
    }),
}));
