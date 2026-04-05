import { Line } from '@react-three/drei';
import { useCanvasStore } from '@/stores/canvasStore';

export function SnapGuide() {
  const guides = useCanvasStore((s) => s.snapGuides);
  const emphasis = useCanvasStore((s) => s.snapGuideEmphasis);
  return (
    <>
      {guides.map((g, i) => (
        <Line
          key={`${String(i)}-${g.start.join(',')}`}
          points={[g.start, g.end]}
          color={emphasis ? '#e65100' : '#00acc1'}
          lineWidth={emphasis ? 5 : 2}
          dashed={false}
        />
      ))}
    </>
  );
}
