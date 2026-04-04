import { TransformControls } from '@react-three/drei';
import { useCallback, useEffect, useRef } from 'react';
import type { TransformControls as TransformControlsImpl } from 'three-stdlib';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { useSnap } from '@/hooks/useSnap';

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

export function SelectionHandler() {
  const selectedId = useCanvasStore((s) => s.selectedBlockId);
  const object = useCanvasStore((s) =>
    s.selectedBlockId ? (s.blockRefs[s.selectedBlockId] ?? null) : null,
  );
  const transformMode = useCanvasStore((s) => s.transformMode);
  const setOrbitEnabled = useCanvasStore((s) => s.setOrbitEnabled);
  const setSnapGuides = useCanvasStore((s) => s.setSnapGuides);
  const clearSnapGuides = useCanvasStore((s) => s.clearSnapGuides);
  const project = useProjectStore((s) => s.project);
  const updateBlock = useProjectStore((s) => s.updateBlock);
  const removeBlock = useProjectStore((s) => s.removeBlock);
  const { snapBlockXZ } = useSnap();
  const tcRef = useRef<TransformControlsImpl>(null);

  const block =
    project && selectedId
      ? project.blocks.find((b) => b.id === selectedId) ?? null
      : null;

  const commitTranslate = useCallback(() => {
    if (!block || !object || !project) return;
    const pos = object.position;
    const rot = object.rotation;
    const draft = {
      ...block,
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: { x: rot.x, y: rot.y, z: rot.z },
    };
    const { position, guides } = snapBlockXZ(draft, project.blocks, {
      x: pos.x,
      z: pos.z,
    });
    object.position.set(position.x, position.y, position.z);
    updateBlock({
      ...draft,
      position,
      rotation: { x: rot.x, y: rot.y, z: rot.z },
    });
    setSnapGuides(guides);
    window.setTimeout(() => clearSnapGuides(), 900);
  }, [block, object, project, snapBlockXZ, updateBlock, setSnapGuides, clearSnapGuides]);

  const commitRotate = useCallback(() => {
    if (!block || !object) return;
    const rot = object.rotation;
    updateBlock({
      ...block,
      rotation: { x: rot.x, y: rot.y, z: rot.z },
    });
  }, [block, object, updateBlock]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTextInputTarget(e.target)) return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) removeBlock(selectedId);
        return;
      }
      if (e.key === 'g' || e.key === 'G') {
        useCanvasStore.getState().setTransformMode('translate');
        return;
      }
      if ((e.key === 'r' || e.key === 'R') && !e.shiftKey) {
        useCanvasStore.getState().setTransformMode('rotate');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, removeBlock]);

  useEffect(() => {
    const tc = tcRef.current;
    if (!tc || !block) return;
    const onDraggingChanged = (e: { value: boolean }) => {
      setOrbitEnabled(!e.value);
      useCanvasStore
        .getState()
        .setTransformDraggingBlockId(e.value ? block.id : null);
      if (e.value) return;
      const mode = useCanvasStore.getState().transformMode;
      if (mode === 'translate') commitTranslate();
      else commitRotate();
    };
    type TcEvents = {
      addEventListener: (n: string, fn: (e: { value: boolean }) => void) => void;
      removeEventListener: (n: string, fn: (e: { value: boolean }) => void) => void;
    };
    const tce = tc as unknown as TcEvents;
    tce.addEventListener('dragging-changed', onDraggingChanged);
    return () => {
      tce.removeEventListener('dragging-changed', onDraggingChanged);
    };
  }, [block, commitTranslate, commitRotate, setOrbitEnabled]);

  if (!object || !block) return null;

  return (
    <TransformControls
      ref={tcRef}
      object={object as never}
      mode={transformMode}
    />
  );
}
