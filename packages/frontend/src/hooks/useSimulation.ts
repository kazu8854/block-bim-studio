import {
  ClashSimulationResponseSchema,
  CostSimulationResponseSchema,
  QuantitySimulationResponseSchema,
} from '@block-bim-studio/shared';
import { useCallback } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';

const jsonHeaders = { 'Content-Type': 'application/json' };

export function useSimulation(projectId: string | undefined) {
  const quantity = useSimulationStore((s) => s.quantity);
  const cost = useSimulationStore((s) => s.cost);
  const clash = useSimulationStore((s) => s.clash);
  const loading = useSimulationStore((s) => s.loading);
  const error = useSimulationStore((s) => s.error);
  const setResults = useSimulationStore((s) => s.setResults);
  const setLoading = useSimulationStore((s) => s.setLoading);
  const setError = useSimulationStore((s) => s.setError);
  const clear = useSimulationStore((s) => s.clear);

  const runAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const body = JSON.stringify({ projectId });
      const [rq, rc, rcl] = await Promise.all([
        fetch('/api/simulation/quantity', {
          method: 'POST',
          headers: jsonHeaders,
          body,
        }),
        fetch('/api/simulation/cost', {
          method: 'POST',
          headers: jsonHeaders,
          body,
        }),
        fetch('/api/simulation/clash', {
          method: 'POST',
          headers: jsonHeaders,
          body,
        }),
      ]);
      if (!rq.ok) {
        setError(`数量算出に失敗しました (${String(rq.status)})`);
        return;
      }
      if (!rc.ok) {
        setError(`コスト概算に失敗しました (${String(rc.status)})`);
        return;
      }
      if (!rcl.ok) {
        setError(`干渉チェックに失敗しました (${String(rcl.status)})`);
        return;
      }
      const qRaw = await rq.json();
      const cRaw = await rc.json();
      const clRaw = await rcl.json();
      const q = QuantitySimulationResponseSchema.parse(qRaw);
      const c = CostSimulationResponseSchema.parse(cRaw);
      const cl = ClashSimulationResponseSchema.parse(clRaw);
      setResults(
        {
          byType: q.byType,
          total: q.total,
        },
        {
          byType: c.byType,
          total: c.total,
          uncostedBlocks: c.uncostedBlocks,
        },
        {
          clashes: cl.clashes,
          message: cl.message,
        },
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'シミュレーションに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [projectId, setError, setLoading, setResults]);

  return {
    quantity,
    cost,
    clash,
    loading,
    error,
    runAll,
    clear,
  };
}
