import type { Block, IfcElementType } from '@block-bim-studio/shared';
import type { ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import type { Group } from 'three';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCheckStore } from '@/stores/checkStore';
import { useSchedule4dStore } from '@/stores/schedule4dStore';

const COLORS: Record<IfcElementType, string> = {
  IfcWall: '#795548',
  IfcColumn: '#607d8b',
  IfcBeam: '#8d6e63',
  IfcSlab: '#9e9e9e',
  IfcWindow: '#29b6f6',
  IfcDoor: '#a1887f',
  IfcPipeSegment: '#5c6bc0',
  IfcDuctSegment: '#78909c',
};

export type Block3DProps = {
  block: Block;
  selected: boolean;
  /** AI 提案プレビュー: 半透明・クリック無効・Transform 対象外 */
  ghost?: boolean;
};

export function Block3D({ block, selected, ghost = false }: Block3DProps) {
  const groupRef = useRef<Group>(null);
  const setBlockRef = useCanvasStore((s) => s.setBlockRef);
  const selectBlock = useCanvasStore((s) => s.selectBlock);
  const draggingBlockId = useCanvasStore((s) => s.transformDraggingBlockId);
  const structureViolation = useCheckStore(
    (s) =>
      s.structure?.violations.some((v) => v.blockId === block.id) ?? false,
  );
  const fourDActive = useSchedule4dStore((s) => s.active);
  const fourDVirtual = useSchedule4dStore((s) => s.virtualDay);
  const fourDStart = useSchedule4dStore((s) => s.startDayByBlockId[block.id]);
  const fourDEnd = useSchedule4dStore((s) => s.endDayByBlockId[block.id]);

  useLayoutEffect(() => {
    if (ghost) return;
    const id = block.id;
    const node = groupRef.current;
    if (node) setBlockRef(id, node);
    return () => setBlockRef(id, null);
  }, [ghost, block.id, setBlockRef]);

  useLayoutEffect(() => {
    const g = groupRef.current;
    if (!g) return;
    if (draggingBlockId === block.id) return;
    g.position.set(block.position.x, block.position.y, block.position.z);
    g.rotation.set(block.rotation.x, block.rotation.y, block.rotation.z);
  }, [
    block.id,
    block.position.x,
    block.position.y,
    block.position.z,
    block.rotation.x,
    block.rotation.y,
    block.rotation.z,
    draggingBlockId,
  ]);

  const { width, height, depth } = block.dimensions;
  let color = COLORS[block.ifcType];
  if (!ghost && fourDActive && fourDStart !== undefined) {
    if (fourDVirtual < fourDStart) {
      return null;
    }
    if (fourDEnd !== undefined && fourDVirtual > fourDEnd) {
      color = '#1b5e20';
    } else {
      color = '#f57f17';
    }
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (ghost) return;
    e.stopPropagation();
    selectBlock(block.id);
  };

  return (
    <group ref={groupRef as never} onClick={ghost ? undefined : onClick}>
      <mesh castShadow={!ghost} receiveShadow={!ghost}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial
          color={color}
          metalness={0.12}
          roughness={0.65}
          transparent={ghost}
          opacity={ghost ? 0.42 : 1}
          depthWrite={!ghost}
        />
      </mesh>
      {structureViolation ? (
        <mesh raycast={() => null}>
          <boxGeometry args={[width + 0.12, height + 0.12, depth + 0.12]} />
          <meshBasicMaterial
            color="#ff9800"
            transparent
            opacity={0.38}
            depthWrite={false}
          />
        </mesh>
      ) : null}
      {selected ? (
        <mesh raycast={() => null}>
          <boxGeometry args={[width + 0.04, height + 0.04, depth + 0.04]} />
          <meshBasicMaterial color="#ff9800" wireframe transparent opacity={0.9} />
        </mesh>
      ) : null}
    </group>
  );
}
