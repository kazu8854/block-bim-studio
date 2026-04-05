import { Canvas, useThree } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import type { DragEvent } from 'react';
import { Suspense, useEffect, useRef } from 'react';
import type { Camera, WebGLRenderer } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useDragDrop } from '@/hooks/useDragDrop';
import { snapBlockPlacementXZ } from '@/utils/snap-placement';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { clientPointToFloor } from '@/utils/canvas-raycast';
import { EMPTY_BLOCK_ARRAY } from '@/utils/empty-collections';
import { Block3D } from './Block3D';
import { SelectionHandler } from './SelectionHandler';
import { CheckSafetyOverlay } from './CheckSafetyOverlay';
import { SimulationOverlay } from './SimulationOverlay';
import { SnapGuide } from './SnapGuide';

function ViewportRegistrar() {
  const setViewport = useCanvasStore((s) => s.setViewport);
  const { camera, gl, size } = useThree();
  useEffect(() => {
    setViewport({
      camera: camera as unknown as Camera,
      gl: gl as unknown as WebGLRenderer,
      width: size.width,
      height: size.height,
    });
    return () => setViewport(null);
  }, [camera, gl, size.width, size.height, setViewport]);
  return null;
}

function CameraControls() {
  const orbitRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const setCameraState = useCanvasStore((s) => s.setCamera);
  const orbitEnabled = useCanvasStore((s) => s.orbitEnabled);

  useEffect(() => {
    const ctrl = orbitRef.current;
    if (!ctrl) return;
    const t = useCanvasStore.getState().camera.target;
    ctrl.target.set(t[0], t[1], t[2]);
    ctrl.update();
  }, []);

  return (
    <OrbitControls
      ref={orbitRef}
      enableDamping
      dampingFactor={0.08}
      enabled={orbitEnabled}
      onEnd={() => {
        const ctrl = orbitRef.current;
        if (!ctrl) return;
        setCameraState({
          position: [camera.position.x, camera.position.y, camera.position.z],
          target: [ctrl.target.x, ctrl.target.y, ctrl.target.z],
        });
      }}
    />
  );
}

function SceneContent() {
  const blocks = useProjectStore((s) => s.project?.blocks ?? EMPTY_BLOCK_ARRAY);
  const aiPreviewBlocks = useCanvasStore((s) => s.aiPreviewBlocks);
  const selectedId = useCanvasStore((s) => s.selectedBlockId);
  const clearSelection = useCanvasStore((s) => s.clearSelection);

  return (
    <>
      <color attach="background" args={['#f2f3f3']} />
      <ViewportRegistrar />
      <ambientLight intensity={0.62} />
      <directionalLight
        position={[10, 16, 8]}
        intensity={1.05}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <Grid
        infiniteGrid
        fadeDistance={70}
        fadeStrength={5}
        cellSize={0.5}
        sectionSize={5}
        sectionColor="#879596"
        cellColor="#d5dbdb"
        position={[0, 0, 0]}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.002, 0]}
        onClick={() => clearSelection()}
        receiveShadow
      >
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#eaecec" />
      </mesh>
      {blocks.map((b) => (
        <Block3D key={b.id} block={b} selected={b.id === selectedId} />
      ))}
      {aiPreviewBlocks.map((b) => (
        <Block3D key={`ai-${b.id}`} block={b} selected={false} ghost />
      ))}
      <SelectionHandler />
      <SnapGuide />
      <SimulationOverlay />
      <CheckSafetyOverlay />
      <CameraControls />
    </>
  );
}

export function Canvas3D() {
  const cam = useCanvasStore((s) => s.camera);
  const addBlockFromCatalog = useProjectStore((s) => s.addBlockFromCatalog);
  const { parsePaletteDropData } = useDragDrop();

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    const entry = parsePaletteDropData(e.dataTransfer);
    if (!entry) return;
    const { viewport } = useCanvasStore.getState();
    if (!viewport) return;
    const hit = clientPointToFloor(
      e.clientX,
      e.clientY,
      viewport.camera,
      viewport.gl,
    );
    if (!hit) return;
    addBlockFromCatalog(entry, {
      x: hit.x,
      y: entry.defaultDimensions.height / 2,
      z: hit.z,
    });
    const proj = useProjectStore.getState().project;
    const sel = useCanvasStore.getState().selectedBlockId;
    const placed = proj?.blocks.find((b) => b.id === sel);
    if (placed && proj) {
      const { position, guides } = snapBlockPlacementXZ(placed, proj.blocks);
      useProjectStore.getState().updateBlock({ ...placed, position });
      useCanvasStore.getState().setSnapGuides(guides, guides.length > 0);
      window.setTimeout(() => useCanvasStore.getState().clearSnapGuides(), 3200);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: 280,
        height: 'clamp(280px, 42vh, 520px)',
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{
          position: cam.position,
          fov: 50,
          near: 0.08,
          far: 800,
        }}
        style={{ width: '100%', height: '100%', borderRadius: 8 }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
