import { Line } from '@react-three/drei';
import { useCanvasStore } from '@/stores/canvasStore';

export function SnapGuide() {
  const guides = useCanvasStore((s) => s.snapGuides);
  return (
    <>
      {guides.map((g, i) => (
        <Line
          key={`${String(i)}-${g.start.join(',')}`}
          points={[g.start, g.end]}
          color="#00acc1"
          lineWidth={2}
          dashed={false}
        />
      ))}
    </>
  );
}
