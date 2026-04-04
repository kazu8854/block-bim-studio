import { useCheckStore } from '@/stores/checkStore';
import { useProjectStore } from '@/stores/projectStore';

/** 安全管理で検出されたブロック上に赤い警告マーカー（E6.2） */
export function CheckSafetyOverlay() {
  const hazards = useCheckStore((s) => s.safety?.hazards ?? []);
  const blocks = useProjectStore((s) => s.project?.blocks ?? []);
  const ids = new Set<string>();
  for (const h of hazards) {
    for (const id of h.blockIds) {
      ids.add(id);
    }
  }
  const flagged = blocks.filter((b) => ids.has(b.id));
  return (
    <>
      {flagged.map((b) => (
        <mesh
          key={`safety-${b.id}`}
          position={[
            b.position.x,
            b.position.y + b.dimensions.height / 2 + 0.35,
            b.position.z,
          ]}
          rotation={[-Math.PI / 2, 0, 0]}
          raycast={() => null}
        >
          <coneGeometry args={[0.22, 0.45, 6]} />
          <meshStandardMaterial
            color="#ba2e0f"
            emissive="#3d0a00"
            emissiveIntensity={0.75}
          />
        </mesh>
      ))}
    </>
  );
}
