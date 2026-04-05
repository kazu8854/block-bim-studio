import type { Project, ProgressStatus } from '@block-bim-studio/shared';
import { utcDayIndex } from '@block-bim-studio/shared';
import { create } from 'zustand';

/** 速度 1 のとき、実時間 1 秒あたり進むプロジェクト日数 */
const PROJECT_DAYS_PER_REAL_SEC = 4;

export type Schedule4dState = {
  /** 4D プレビュー中（開始日順の表示・色分け） */
  active: boolean;
  playing: boolean;
  speed: number;
  /** 連続タイムライン（ガントのプレイヘッド用） */
  virtualDay: number;
  rangeMin: number;
  rangeMax: number;
  startDayByBlockId: Record<string, number>;
  endDayByBlockId: Record<string, number>;
  storedStatusByBlockId: Record<string, ProgressStatus>;
  hasSchedules: boolean;
  syncFromProject: (project: Project | null) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  setVirtualDay: (d: number) => void;
  tick: (deltaMs: number) => void;
};

function rangeFromSchedules(schedules: Project['schedules']): {
  min: number;
  max: number;
} {
  if (schedules.length === 0) return { min: 0, max: 0 };
  let min = Infinity;
  let max = -Infinity;
  for (const s of schedules) {
    min = Math.min(min, utcDayIndex(s.startDate));
    max = Math.max(max, utcDayIndex(s.endDate));
  }
  return { min, max };
}

export const useSchedule4dStore = create<Schedule4dState>((set, get) => ({
  active: false,
  playing: false,
  speed: 1,
  virtualDay: 0,
  rangeMin: 0,
  rangeMax: 0,
  startDayByBlockId: {},
  endDayByBlockId: {},
  storedStatusByBlockId: {},
  hasSchedules: false,

  syncFromProject(project) {
    if (!project || project.schedules.length === 0) {
      set({
        hasSchedules: false,
        startDayByBlockId: {},
        endDayByBlockId: {},
        storedStatusByBlockId: {},
        rangeMin: 0,
        rangeMax: 0,
        active: false,
        playing: false,
        virtualDay: 0,
      });
      return;
    }
    const starts: Record<string, number> = {};
    const ends: Record<string, number> = {};
    const stat: Record<string, ProgressStatus> = {};
    for (const s of project.schedules) {
      starts[s.blockId] = utcDayIndex(s.startDate);
      ends[s.blockId] = utcDayIndex(s.endDate);
      stat[s.blockId] = s.status;
    }
    const { min, max } = rangeFromSchedules(project.schedules);
    set({
      hasSchedules: true,
      startDayByBlockId: starts,
      endDayByBlockId: ends,
      storedStatusByBlockId: stat,
      rangeMin: min,
      rangeMax: max,
      playing: false,
      virtualDay: min,
    });
  },

  play() {
    const s = get();
    if (!s.hasSchedules) return;
    const atEnd = s.virtualDay >= s.rangeMax;
    set({
      active: true,
      playing: true,
      virtualDay: atEnd ? s.rangeMin : Math.max(s.rangeMin, s.virtualDay),
    });
  },

  pause() {
    set({ playing: false });
  },

  stop() {
    const { rangeMin } = get();
    set({
      active: false,
      playing: false,
      virtualDay: rangeMin,
    });
  },

  setSpeed(speed) {
    set({ speed: Math.max(0.25, Math.min(8, speed)) });
  },

  setVirtualDay(d) {
    const { rangeMin, rangeMax, hasSchedules } = get();
    if (!hasSchedules) return;
    const clamped = Math.min(rangeMax, Math.max(rangeMin, d));
    set({ virtualDay: clamped, active: true, playing: false });
  },

  tick(deltaMs) {
    const s = get();
    if (!s.playing || !s.hasSchedules) return;
    const step = (deltaMs / 1000) * s.speed * PROJECT_DAYS_PER_REAL_SEC;
    let next = s.virtualDay + step;
    if (next >= s.rangeMax) {
      set({ virtualDay: s.rangeMax, playing: false });
    } else {
      set({ virtualDay: next });
    }
  },
}));
