import type { Block } from '@block-bim-studio/shared';
import type { Camera, Group, WebGLRenderer } from 'three';
import { create } from 'zustand';

export type CameraPersistState = {
  position: [number, number, number];
  target: [number, number, number];
};

/** Snapshot for HTML5 DnD raycast; widened to avoid duplicate @types/three clashes in workspace */
export type ViewportBinding = {
  camera: Camera;
  gl: WebGLRenderer;
  width: number;
  height: number;
};

export type SnapGuideSegment = {
  start: [number, number, number];
  end: [number, number, number];
};

export type TransformMode = 'translate' | 'rotate';

type CanvasState = {
  selectedBlockId: string | null;
  /** Object3D groups keyed by block id for TransformControls */
  blockRefs: Record<string, Group>;
  camera: CameraPersistState;
  orbitEnabled: boolean;
  transformMode: TransformMode;
  snapGuides: SnapGuideSegment[];
  /** スナップが有効なときガイドを強調（色・太さ） */
  snapGuideEmphasis: boolean;
  viewport: ViewportBinding | null;
  /** While TransformControls drags this block, skip syncing from project store */
  transformDraggingBlockId: string | null;
  /** AI 構造提案の半透明プレビュー用（シーンには出すが選択・変形対象外） */
  aiPreviewBlocks: Block[];

  selectBlock: (id: string | null) => void;
  clearSelection: () => void;
  setBlockRef: (id: string, group: Group | null) => void;
  setCamera: (partial: Partial<CameraPersistState>) => void;
  setOrbitEnabled: (enabled: boolean) => void;
  setTransformMode: (mode: TransformMode) => void;
  setSnapGuides: (
    guides: SnapGuideSegment[],
    emphasis?: boolean,
  ) => void;
  clearSnapGuides: () => void;
  setViewport: (binding: ViewportBinding | null) => void;
  setTransformDraggingBlockId: (id: string | null) => void;
  setAiPreviewBlocks: (blocks: Block[]) => void;
  clearAiPreviewBlocks: () => void;
};

const defaultCamera: CameraPersistState = {
  position: [12, 10, 12],
  target: [0, 0, 0],
};

export const useCanvasStore = create<CanvasState>((set) => ({
  selectedBlockId: null,
  blockRefs: {},
  camera: defaultCamera,
  orbitEnabled: true,
  transformMode: 'translate',
  snapGuides: [],
  snapGuideEmphasis: false,
  viewport: null,
  transformDraggingBlockId: null,
  aiPreviewBlocks: [],

  selectBlock: (id) => set({ selectedBlockId: id }),

  clearSelection: () => set({ selectedBlockId: null }),

  setBlockRef: (id, group) =>
    set((s) => {
      const next = { ...s.blockRefs };
      if (group) next[id] = group;
      else delete next[id];
      return { blockRefs: next };
    }),

  setCamera: (partial) =>
    set((s) => ({ camera: { ...s.camera, ...partial } })),

  setOrbitEnabled: (orbitEnabled) => set({ orbitEnabled }),

  setTransformMode: (transformMode) => set({ transformMode }),

  setSnapGuides: (snapGuides, emphasis = false) =>
    set({ snapGuides, snapGuideEmphasis: emphasis }),

  clearSnapGuides: () => set({ snapGuides: [], snapGuideEmphasis: false }),

  setViewport: (viewport) => set({ viewport }),

  setTransformDraggingBlockId: (transformDraggingBlockId) =>
    set({ transformDraggingBlockId }),

  setAiPreviewBlocks: (aiPreviewBlocks) => set({ aiPreviewBlocks }),

  clearAiPreviewBlocks: () => set({ aiPreviewBlocks: [] }),
}));
