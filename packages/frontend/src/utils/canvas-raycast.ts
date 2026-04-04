import { Plane, Raycaster, Vector2, Vector3 } from 'three';
import type { Camera, WebGLRenderer } from 'three';

/**
 * Intersect a screen point with the horizontal plane y = 0 (meters).
 */
export function clientPointToFloor(
  clientX: number,
  clientY: number,
  camera: Camera,
  gl: WebGLRenderer,
): Vector3 | null {
  const rect = gl.domElement.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((clientY - rect.top) / rect.height) * 2 + 1;
  const raycaster = new Raycaster();
  raycaster.setFromCamera(new Vector2(x, y), camera);
  const plane = new Plane(new Vector3(0, 1, 0), 0);
  const out = new Vector3();
  const hit = raycaster.ray.intersectPlane(plane, out);
  return hit ? out : null;
}
