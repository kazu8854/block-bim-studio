import type { Block, Project, ScheduleInfo } from '@block-bim-studio/shared';
import { buildPropertySetsForNewIfcBlock } from '@block-bim-studio/shared';
import { create } from 'zustand';
import type { BlockCatalogEntry } from '@/data/block-catalog';
import { ensureDefaultPropertySets } from '@/utils/default-property-sets';
import { useCanvasStore } from './canvasStore';

type ProjectState = {
  project: Project | null;
  setProject: (project: Project | null) => void;
  addBlockFromCatalog: (
    entry: BlockCatalogEntry,
    position?: { x: number; y: number; z: number },
  ) => void;
  updateBlock: (block: Block) => void;
  removeBlock: (id: string) => void;
  upsertSchedule: (schedule: ScheduleInfo) => void;
  removeScheduleForBlock: (blockId: string) => void;
};

const zeroVec = (): { x: number; y: number; z: number } => ({
  x: 0,
  y: 0,
  z: 0,
});

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,

  setProject: (project) => {
    useCanvasStore.getState().clearSelection();
    useCanvasStore.getState().clearSnapGuides();
    set({ project });
  },

  addBlockFromCatalog: (entry, position) => {
    const { project } = get();
    if (!project) return;
    const pos =
      position !== undefined
        ? position
        : {
            x: 0,
            y: entry.defaultDimensions.height / 2,
            z: 0,
          };
    const block: Block = ensureDefaultPropertySets({
      id: crypto.randomUUID(),
      name: entry.name,
      ifcType: entry.ifcType,
      category: entry.category,
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: zeroVec(),
      dimensions: { ...entry.defaultDimensions },
      propertySets: buildPropertySetsForNewIfcBlock(
        entry.ifcType,
        entry.defaultDimensions,
      ),
    });
    const next: Project = {
      ...project,
      blocks: [...project.blocks, block],
      updatedAt: new Date().toISOString(),
    };
    set({ project: next });
    useCanvasStore.getState().selectBlock(block.id);
  },

  updateBlock: (block) => {
    const { project } = get();
    if (!project) return;
    const blocks = project.blocks.map((b) =>
      b.id === block.id ? ensureDefaultPropertySets(block) : b,
    );
    set({
      project: {
        ...project,
        blocks,
        updatedAt: new Date().toISOString(),
      },
    });
  },

  removeBlock: (id) => {
    const { project } = get();
    if (!project) return;
    const { selectedBlockId } = useCanvasStore.getState();
    set({
      project: {
        ...project,
        blocks: project.blocks.filter((b) => b.id !== id),
        schedules: project.schedules
          .filter((s) => s.blockId !== id)
          .map((s) => ({
            ...s,
            dependencies: s.dependencies.filter((d) => d.blockId !== id),
          })),
        updatedAt: new Date().toISOString(),
      },
    });
    if (selectedBlockId === id) {
      useCanvasStore.getState().clearSelection();
    }
  },

  upsertSchedule: (schedule) => {
    const { project } = get();
    if (!project) return;
    const rest = project.schedules.filter((s) => s.blockId !== schedule.blockId);
    set({
      project: {
        ...project,
        schedules: [...rest, schedule],
        updatedAt: new Date().toISOString(),
      },
    });
  },

  removeScheduleForBlock: (blockId) => {
    const { project } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        schedules: project.schedules.filter((s) => s.blockId !== blockId),
        updatedAt: new Date().toISOString(),
      },
    });
  },
}));
