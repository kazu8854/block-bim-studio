import Box from '@cloudscape-design/components/box';
import FormField from '@cloudscape-design/components/form-field';
import Header from '@cloudscape-design/components/header';
import Modal from '@cloudscape-design/components/modal';
import SpaceBetween from '@cloudscape-design/components/space-between';
import type { GanttChartData, GanttTaskRow } from '@block-bim-studio/shared';
import { utcDayIndex } from '@block-bim-studio/shared';
import { useMemo, useState } from 'react';

const LABEL_W = 168;
const ROW_H = 36;
const BAR_H = 22;
const PAD_Y = 8;

export type GanttScale = 'day' | 'week' | 'month';

export type GanttChartProps = {
  data: GanttChartData;
  criticalBlockIds?: ReadonlySet<string>;
  scale: GanttScale;
  /** 4D 再生位置（UTC 日インデックス）。未指定なら非表示 */
  playheadUtcDay?: number | null;
};

function pxPerDay(scale: GanttScale): number {
  switch (scale) {
    case 'day':
      return 18;
    case 'week':
      return 6;
    case 'month':
      return 2;
    default:
      return 12;
  }
}

function barLeftWidth(
  task: GanttTaskRow,
  minD: number,
  px: number,
): { left: number; width: number } {
  const s = utcDayIndex(task.startDate);
  const e = utcDayIndex(task.endDate);
  const left = (s - minD) * px;
  const width = Math.max(px, (e - s + 1) * px);
  return { left, width };
}

function taskIndexMap(tasks: GanttTaskRow[]): Map<string, number> {
  const m = new Map<string, number>();
  tasks.forEach((t, i) => m.set(t.blockId, i));
  return m;
}

export function GanttChart({
  data,
  criticalBlockIds,
  scale,
  playheadUtcDay,
}: GanttChartProps) {
  const { tasks, dependencyEdges, scaleStart, scaleEnd, message } = data;
  const [detailTask, setDetailTask] = useState<GanttTaskRow | null>(null);

  const { minD, svgW, svgH } = useMemo(() => {
    if (tasks.length === 0) {
      const d0 = utcDayIndex(scaleStart);
      const d1 = utcDayIndex(scaleEnd);
      const min = Math.min(d0, d1);
      const max = Math.max(d0, d1);
      const pad = 4;
      const span = Math.max(1, max - min + 1 + pad * 2);
      const px = pxPerDay(scale);
      return {
        minD: min - pad,
        svgW: LABEL_W + span * px,
        svgH: PAD_Y * 2 + Math.max(1, tasks.length) * ROW_H,
      };
    }
    let min = Infinity;
    let max = -Infinity;
    for (const t of tasks) {
      min = Math.min(min, utcDayIndex(t.startDate));
      max = Math.max(max, utcDayIndex(t.endDate));
    }
    const pad = 2;
    min -= pad;
    max += pad;
    const span = Math.max(1, max - min + 1);
    const px = pxPerDay(scale);
    return {
      minD: min,
      svgW: LABEL_W + span * px,
      svgH: PAD_Y * 2 + tasks.length * ROW_H,
    };
  }, [tasks, scaleStart, scaleEnd, scale]);

  const px = pxPerDay(scale);
  const idxById = useMemo(() => taskIndexMap(tasks), [tasks]);

  const edgePaths = useMemo(() => {
    return dependencyEdges
      .map((edge) => {
        const fi = idxById.get(edge.fromBlockId);
        const ti = idxById.get(edge.toBlockId);
        if (fi === undefined || ti === undefined) return null;
        const fromTask = tasks[fi]!;
        const toTask = tasks[ti]!;
        const fromGeom = barLeftWidth(fromTask, minD, px);
        const toGeom = barLeftWidth(toTask, minD, px);
        const y1 = PAD_Y + fi * ROW_H + BAR_H / 2;
        const y2 = PAD_Y + ti * ROW_H + BAR_H / 2;
        const x1 = LABEL_W + fromGeom.left + fromGeom.width;
        const x2 = LABEL_W + toGeom.left;
        const midX = (x1 + x2) / 2;
        const d = `M ${String(x1)} ${String(y1)} C ${String(midX)} ${String(y1)}, ${String(midX)} ${String(y2)}, ${String(x2)} ${String(y2)}`;
        return { d, key: `${edge.fromBlockId}-${edge.toBlockId}-${edge.type}` };
      })
      .filter(Boolean) as { d: string; key: string }[];
  }, [dependencyEdges, tasks, idxById, minD, px]);

  if (tasks.length === 0) {
    return (
      <SpaceBetween size="s">
        {message ? (
          <Box color="text-body-secondary">{message}</Box>
        ) : (
          <Box color="text-body-secondary">表示する工程がありません。</Box>
        )}
      </SpaceBetween>
    );
  }

  return (
    <SpaceBetween size="s">
      {message ? (
        <Box fontSize="body-s" color="text-body-secondary">
          {message}
        </Box>
      ) : null}
      <div style={{ overflowX: 'auto' }}>
        <svg
          width={svgW}
          height={svgH}
          role="img"
          aria-label="ガントチャート"
        >
          <defs>
            <marker
              id="gantt-arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,0 L8,4 L0,8 z" fill="#5f6b7a" />
            </marker>
          </defs>
          {edgePaths.map((e) => (
            <path
              key={e.key}
              d={e.d}
              fill="none"
              stroke="#5f6b7a"
              strokeWidth={1.25}
              markerEnd="url(#gantt-arrow)"
            />
          ))}
          {playheadUtcDay != null &&
          Number.isFinite(playheadUtcDay) &&
          tasks.length > 0 ? (
            <line
              x1={Math.min(
                svgW - 1,
                Math.max(LABEL_W, LABEL_W + (playheadUtcDay - minD) * px),
              )}
              x2={Math.min(
                svgW - 1,
                Math.max(LABEL_W, LABEL_W + (playheadUtcDay - minD) * px),
              )}
              y1={0}
              y2={svgH}
              stroke="#d13212"
              strokeWidth={2}
              strokeDasharray="4 3"
              opacity={0.95}
              pointerEvents="none"
            />
          ) : null}
          {tasks.map((t, i) => {
            const { left, width } = barLeftWidth(t, minD, px);
            const y = PAD_Y + i * ROW_H;
            const critical = criticalBlockIds?.has(t.blockId) ?? false;
            const fill = critical ? '#ba2e0f' : '#0972d3';
            const stroke = critical ? '#7d2107' : '#033160';
            return (
              <g key={t.blockId}>
                <text
                  x={8}
                  y={y + BAR_H - 4}
                  fontSize={13}
                  fill="#16191f"
                >
                  {t.name.length > 18 ? `${t.name.slice(0, 17)}…` : t.name}
                </text>
                <rect
                  x={LABEL_W + left}
                  y={y}
                  width={width}
                  height={BAR_H}
                  rx={4}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={1}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setDetailTask(t)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailTask(t);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${t.name} の工程詳細を開く`}
                />
              </g>
            );
          })}
        </svg>
      </div>
      <Modal
        visible={detailTask !== null}
        onDismiss={() => setDetailTask(null)}
        closeAriaLabel="閉じる"
        header={detailTask?.name ?? '工程詳細'}
        footer={null}
      >
        {detailTask ? (
          <SpaceBetween size="s">
            <Box fontSize="body-s">ブロック ID: {detailTask.blockId}</Box>
            <Box fontSize="body-s">開始: {detailTask.startDate}</Box>
            <Box fontSize="body-s">終了: {detailTask.endDate}</Box>
            <Box fontSize="body-s">
              工期: {String(detailTask.durationDays)} 日 / 状態:{' '}
              {detailTask.status}
            </Box>
            {detailTask.dependencyBlockIds.length ? (
              <Box fontSize="body-s">
                先行: {detailTask.dependencyBlockIds.join(', ')}
              </Box>
            ) : null}
          </SpaceBetween>
        ) : null}
      </Modal>
    </SpaceBetween>
  );
}

export function GanttScaleSelect(props: {
  scale: GanttScale;
  onChange: (s: GanttScale) => void;
}) {
  return (
    <FormField label="表示スケール">
      <select
        aria-label="ガントの時間スケール"
        value={props.scale}
        onChange={(e) => props.onChange(e.target.value as GanttScale)}
        style={{ minWidth: 120 }}
      >
        <option value="day">日</option>
        <option value="week">週</option>
        <option value="month">月</option>
      </select>
    </FormField>
  );
}

export function GanttChartSection(props: {
  data: GanttChartData | null;
  criticalIds: ReadonlySet<string>;
  scale: GanttScale;
  onScaleChange: (s: GanttScale) => void;
  playheadUtcDay?: number | null;
}) {
  return (
    <SpaceBetween size="m">
      <Header
        variant="h3"
        actions={
          <GanttScaleSelect
            scale={props.scale}
            onChange={props.onScaleChange}
          />
        }
      >
        ガントチャート
      </Header>
      {props.data ? (
        <GanttChart
          data={props.data}
          criticalBlockIds={props.criticalIds}
          scale={props.scale}
          playheadUtcDay={props.playheadUtcDay}
        />
      ) : (
        <Box color="text-body-secondary">読み込み後に表示されます。</Box>
      )}
    </SpaceBetween>
  );
}
