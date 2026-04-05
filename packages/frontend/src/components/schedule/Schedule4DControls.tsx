import Box from '@cloudscape-design/components/box';
import Button from '@cloudscape-design/components/button';
import Header from '@cloudscape-design/components/header';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { isoFromUtcDayIndex } from '@block-bim-studio/shared';
import { useSchedule4dStore } from '@/stores/schedule4dStore';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 8] as const;

export function Schedule4DControls() {
  const hasSchedules = useSchedule4dStore((s) => s.hasSchedules);
  const active = useSchedule4dStore((s) => s.active);
  const playing = useSchedule4dStore((s) => s.playing);
  const virtualDay = useSchedule4dStore((s) => s.virtualDay);
  const rangeMin = useSchedule4dStore((s) => s.rangeMin);
  const rangeMax = useSchedule4dStore((s) => s.rangeMax);
  const speed = useSchedule4dStore((s) => s.speed);
  const play = useSchedule4dStore((s) => s.play);
  const pause = useSchedule4dStore((s) => s.pause);
  const stop = useSchedule4dStore((s) => s.stop);
  const setSpeed = useSchedule4dStore((s) => s.setSpeed);
  const setVirtualDay = useSchedule4dStore((s) => s.setVirtualDay);

  if (!hasSchedules) {
    return (
      <Box color="text-body-secondary" fontSize="body-s">
        プロジェクトに工程（schedules）があると 4D プレビューが利用できます。
      </Box>
    );
  }

  const span = rangeMax - rangeMin;
  const sliderDisabled = span <= 0;

  return (
    <SpaceBetween size="m">
      <Header variant="h3">4D シミュレーション</Header>
      <Box fontSize="body-s" color="text-body-secondary">
        工程の開始日順にキャンバス上のブロックを表示し、進行に応じて色分けします（未着手は非表示、進行中は琥珀、完了は緑）。
      </Box>
      <SpaceBetween direction="horizontal" size="xs">
        <Button disabled={playing} onClick={() => play()}>
          再生
        </Button>
        <Button disabled={!playing} onClick={() => pause()}>
          一時停止
        </Button>
        <Button
          onClick={() => {
            stop();
          }}
        >
          停止
        </Button>
      </SpaceBetween>
      <div>
        <Box fontSize="body-s" margin={{ bottom: 'xs' }}>
          速度
        </Box>
        <select
          aria-label="4D 再生速度"
          value={String(speed)}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ minWidth: 120 }}
        >
          {SPEED_OPTIONS.map((v) => (
            <option key={v} value={String(v)}>
              {String(v)}×
            </option>
          ))}
        </select>
      </div>
      <div>
        <Box fontSize="body-s" margin={{ bottom: 'xs' }}>
          タイムライン（UTC 日）
        </Box>
        <input
          aria-label="4D タイムライン"
          type="range"
          disabled={sliderDisabled}
          min={rangeMin}
          max={rangeMax}
          step={span > 120 ? 1 : 0.05}
          value={Math.min(rangeMax, Math.max(rangeMin, virtualDay))}
          onChange={(e) => setVirtualDay(Number(e.target.value))}
          style={{ width: '100%', maxWidth: 480 }}
        />
        <Box fontSize="body-s" color="text-body-secondary" margin={{ top: 'xs' }}>
          現在: {isoFromUtcDayIndex(Math.floor(virtualDay))}
          {active ? '（プレビュー中）' : ''}
        </Box>
      </div>
    </SpaceBetween>
  );
}
