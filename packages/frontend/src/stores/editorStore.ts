import type { Block, Project } from '@block-bim-studio/shared';
import { create } from 'zustand';
import type { BlockCatalogEntry } from '@/data/block-catalog';
import {
  createDefaultPropertySets,
  ensureDefaultPropertySets,
} from '@/utils/default-property-sets';

type EditorState = {
  project: Project | null;
  selectedBlockId: string | null;
  setProject: (project: Project | null) => void;
  selectBlock: (id: string | null) => void;
  addBlockFromCatalog: (entry: BlockCatalogEntry) => void;
  updateBlock: (block: Block) => void;
  removeBlock: (id: string) => void;
  clearSelection: () => void;
};

const zeroVec = (): { x: number; y: number; z: number } => ({
  x: 0,
  y: 0,
  z: 0,
});

export const useEditorStore = create<EditorState>((set, get) => ({
  project: null,
  selectedBlockId: null,

  setProject: (project) =>
    set({
      project,
      selectedBlockId: null,
    }),

  selectBlock: (id) => set({ selectedBlockId: id }),

  clearSelection: () => set({ selectedBlockId: null }),

  addBlockFromCatalog: (entry) => {
    const { project } = get();
    if (!project) return;
    const block: Block = ensureDefaultPropertySets({
      id: crypto.randomUUID(),
      name: entry.name,
      ifcType: entry.ifcType,
      category: entry.category,
      position: zeroVec(),
      rotation: zeroVec(),
      dimensions: { ...entry.defaultDimensions },
      propertySets: createDefaultPropertySets(),
    });
    const next: Project = {
      ...project,
      blocks: [...project.blocks, block],
      updatedAt: new Date().toISOString(),
    };
    set({ project: next, selectedBlockId: block.id });
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
    const { project, selectedBlockId } = get();
    if (!project) return;
    set({
      project: {
        ...project,
        blocks: project.blocks.filter((b) => b.id !== id),
        schedules: project.schedules.filter((s) => s.blockId !== id),
        updatedAt: new Date().toISOString(),
      },
      selectedBlockId: selectedBlockId === id ? null : selectedBlockId,
    });
  },
}));
