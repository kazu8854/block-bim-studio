import { Html } from '@react-three/drei';
import { isoFromUtcDayIndex } from '@block-bim-studio/shared';
import { useSchedule4dStore } from '@/stores/schedule4dStore';
import { useSimulationStore } from '@/stores/simulationStore';
import { Simulation4DTick } from './Simulation4DTick';

/** 干渉候補点・4D タイマー（B5.2 / Phase 3.3） */
export function SimulationOverlay() {
  const clashes = useSimulationStore((s) => s.clash?.clashes ?? []);
  const fourDActive = useSchedule4dStore((s) => s.active);
  const fourDPlaying = useSchedule4dStore((s) => s.playing);
  const fourDVirtual = useSchedule4dStore((s) => s.virtualDay);
  const fourDHas = useSchedule4dStore((s) => s.hasSchedules);

  return (
    <>
      <Simulation4DTick />
      {fourDActive && fourDHas ? (
        <Html fullscreen style={{ pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              padding: '6px 10px',
              borderRadius: 6,
              background: 'rgba(22, 25, 31, 0.82)',
              color: '#f0f1f2',
              fontSize: 12,
              maxWidth: 280,
              lineHeight: 1.35,
            }}
          >
            <strong>4D シミュレーション</strong>
            <div style={{ marginTop: 4 }}>
              {fourDPlaying ? '再生中' : '一時停止 / スクラブ'}
            </div>
            <div style={{ marginTop: 2, opacity: 0.9 }}>
              現在日: {isoFromUtcDayIndex(Math.floor(fourDVirtual))}
            </div>
            <div style={{ marginTop: 4, opacity: 0.75, fontSize: 11 }}>
              再生・速度は「工程・ガント」パネルから操作できます。
            </div>
          </div>
        </Html>
      ) : null}
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
