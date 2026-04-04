import type { Block, IfcElementType } from '@block-bim-studio/shared';
import type { ThreeEvent } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import type { Group } from 'three';
import { useCanvasStore } from '@/stores/canvasStore';

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
};

export function Block3D({ block, selected }: Block3DProps) {
  const groupRef = useRef<Group>(null);
  const setBlockRef = useCanvasStore((s) => s.setBlockRef);
  const selectBlock = useCanvasStore((s) => s.selectBlock);
  const draggingBlockId = useCanvasStore((s) => s.transformDraggingBlockId);

  useLayoutEffect(() => {
    const id = block.id;
    const node = groupRef.current;
    if (node) setBlockRef(id, node);
    return () => setBlockRef(id, null);
  }, [block.id, setBlockRef]);

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
  const color = COLORS[block.ifcType];

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectBlock(block.id);
  };

  return (
    <group ref={groupRef as never} onClick={onClick}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} metalness={0.12} roughness={0.65} />
      </mesh>
      {selected ? (
        <mesh raycast={() => null}>
          <boxGeometry args={[width + 0.04, height + 0.04, depth + 0.04]} />
          <meshBasicMaterial color="#ff9800" wireframe transparent opacity={0.9} />
        </mesh>
      ) : null}
    </group>
  );
}
