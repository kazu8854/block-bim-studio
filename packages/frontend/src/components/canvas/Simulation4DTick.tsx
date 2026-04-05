import { useFrame } from '@react-three/fiber';
import { useSchedule4dStore } from '@/stores/schedule4dStore';

/** 再生中は仮想プロジェクト日を進める（Canvas 内のみ） */
export function Simulation4DTick() {
  useFrame((_s, deltaSec) => {
    useSchedule4dStore.getState().tick(deltaSec * 1000);
  });
  return null;
}
