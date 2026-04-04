import type { Block } from '@block-bim-studio/shared';
import { useCallback } from 'react';
import {
  type SnapGuideSegment,
  snapBlockPlacementXZ,
} from '@/utils/snap-placement';

export function useSnap() {
  const snapBlockXZ = useCallback(
    (
      block: Block,
      allBlocks: Block[],
      centerXZ?: { x: number; z: number },
    ): { position: Block['position']; guides: SnapGuideSegment[] } =>
      snapBlockPlacementXZ(block, allBlocks, centerXZ),
    [],
  );

  return { snapBlockXZ };
}
