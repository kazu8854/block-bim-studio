import { useSimulationStore } from '@/stores/simulationStore';

/** 干渉候補点を赤マーカーで表示（B5.2） */
export function SimulationOverlay() {
  const clashes = useSimulationStore((s) => s.clash?.clashes ?? []);
  return (
    <>
      {clashes.map((c, i) => (
        <mesh
          key={`${c.blockIdA}-${c.blockIdB}-${String(i)}`}
          position={[
            c.intersectionPoint.x,
            c.intersectionPoint.y,
            c.intersectionPoint.z,
          ]}
          raycast={() => null}
        >
          <sphereGeometry args={[0.14, 20, 20]} />
          <meshStandardMaterial
            color="#ba2e0f"
            emissive="#3d0a00"
            emissiveIntensity={0.6}
          />
        </mesh>
      ))}
    </>
  );
}
