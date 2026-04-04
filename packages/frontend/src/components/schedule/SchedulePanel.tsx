import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { GanttChartData } from '@block-bim-studio/shared';
import {
  CriticalPathResponseSchema,
  GanttResponseSchema,
} from '@block-bim-studio/shared';
import { useCallback, useState } from 'react';
import { stripStub } from '@/api/stub';
import {
  GanttChartSection,
  type GanttScale,
} from '@/components/gantt/GanttChart';

const jsonHeaders = { 'Content-Type': 'application/json' };

export type SchedulePanelProps = {
  projectId: string | undefined;
};

export function SchedulePanel({ projectId }: SchedulePanelProps) {
  const [gantt, setGantt] = useState<GanttChartData | null>(null);
  const [cp, setCp] = useState<ReturnType<
    typeof CriticalPathResponseSchema.parse
  > | null>(null);
  const [scale, setScale] = useState<GanttScale>('day');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const body = JSON.stringify({ projectId });
      const [rg, rc] = await Promise.all([
        fetch('/api/schedule/gantt', {
          method: 'POST',
          headers: jsonHeaders,
          body,
        }),
        fetch('/api/schedule/critical-path', {
          method: 'POST',
          headers: jsonHeaders,
          body,
        }),
      ]);
      if (!rg.ok) {
        setError(`ガント取得に失敗しました (${String(rg.status)})`);
        return;
      }
      if (!rc.ok) {
        setError(`クリティカルパス取得に失敗しました (${String(rc.status)})`);
        return;
      }
      const gRaw = await rg.json();
      const cRaw = await rc.json();
      const gParsed = GanttResponseSchema.parse(gRaw);
      setGantt(stripStub(gParsed) as GanttChartData);
      setCp(CriticalPathResponseSchema.parse(cRaw));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : '工程データの取得に失敗しました',
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const clear = useCallback(() => {
    setGantt(null);
    setCp(null);
    setError(null);
  }, []);

  const criticalSet = new Set(cp?.criticalPath ?? []);

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button disabled={!projectId || loading} onClick={() => void load()}>
              工程を再計算
            </Button>
            <Button disabled={!gantt && !cp} onClick={clear}>
              結果をクリア
            </Button>
          </SpaceBetween>
        }
      >
        工程・ガント
      </Header>
      {error ? <Box color="text-status-error">{error}</Box> : null}
      {loading ? <Box color="text-body-secondary">読み込み中…</Box> : null}

      <GanttChartSection
        data={gantt}
        criticalIds={criticalSet}
        scale={scale}
        onScaleChange={setScale}
      />

      <Header variant="h3">クリティカルパス</Header>
      {cp ? (
        <SpaceBetween size="s">
          {cp.message ? (
            <Box fontSize="body-s" color="text-body-secondary">
              {cp.message}
            </Box>
          ) : null}
          <Box fontSize="body-s">
            プロジェクト期間: {cp.projectStartDate} 〜 {cp.projectEndDate}（
            {String(cp.totalDuration)} 日）
          </Box>
          <Box fontSize="body-s">
            クリティカル上のブロック:{' '}
            {cp.criticalPath.length
              ? cp.criticalPath.join(', ')
              : '（なし）'}
          </Box>
        </SpaceBetween>
      ) : (
        <Box color="text-body-secondary">
          「工程を再計算」でサーバから取得します。
        </Box>
      )}
    </SpaceBetween>
  );
}
