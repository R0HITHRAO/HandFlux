import { Landmark2D } from '../types/vision';

export function distance2D(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.max(0, Math.min(1, t));
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function angleBetween(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

export function midpoint2D(a: Landmark2D, b: Landmark2D): Landmark2D {
  return {
    x: (a.x + b.x) * 0.5,
    y: (a.y + b.y) * 0.5,
    screenX: (a.screenX + b.screenX) * 0.5,
    screenY: (a.screenY + b.screenY) * 0.5
  };
}

export function normalizeScreenCoords(x: number, y: number, width: number, height: number): { ndcX: number; ndcY: number } {
  return {
    ndcX: (x / width) * 2 - 1,
    ndcY: -(y / height) * 2 + 1
  };
}

export function screenToThreeWorld(
  screenX: number,
  screenY: number,
  width: number,
  height: number,
  cameraZ: number = 5,
  fov: number = 60
): { x: number; y: number; z: number } {
  const aspect = width / height;
  const vFov = (fov * Math.PI) / 180;
  const planeHeight = 2 * Math.tan(vFov / 2) * cameraZ;
  const planeWidth = planeHeight * aspect;

  const normalizedX = (screenX / width) - 0.5;
  const normalizedY = 0.5 - (screenY / height);

  return {
    x: normalizedX * planeWidth,
    y: normalizedY * planeHeight,
    z: 0
  };
}
