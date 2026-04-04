import type { ClashResult, CostResult, QuantityResult } from '@block-bim-studio/shared';
import { create } from 'zustand';

type SimulationState = {
  quantity: QuantityResult | null;
  cost: CostResult | null;
  clash: ClashResult | null;
  loading: boolean;
  error: string | null;
  setResults: (q: QuantityResult, c: CostResult, cl: ClashResult) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  clear: () => void;
};

export const useSimulationStore = create<SimulationState>((set) => ({
  quantity: null,
  cost: null,
  clash: null,
  loading: false,
  error: null,
  setResults: (quantity, cost, clash) =>
    set({ quantity, cost, clash, error: null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clear: () =>
    set({
      quantity: null,
      cost: null,
      clash: null,
      error: null,
    }),
}));
