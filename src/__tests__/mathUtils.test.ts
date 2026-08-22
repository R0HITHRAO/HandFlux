import { describe, it, expect } from 'vitest';
import { distance2D, lerp, clamp, angleBetween, midpoint2D, normalizeScreenCoords, screenToThreeWorld } from '../utils/mathUtils';

describe('mathUtils', () => {
  it('calculates 2D Euclidean distance correctly', () => {
    expect(distance2D({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(distance2D({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });

  it('interpolates linearly with lerp', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(10, 20, -1)).toBe(10); // Clamped
  });

  it('clamps values within bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('calculates angle between two points in radians', () => {
    expect(angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 })).toBeCloseTo(0);
    expect(angleBetween({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
  });

  it('calculates 2D landmark midpoint', () => {
    const p1 = { x: 0.2, y: 0.4, screenX: 200, screenY: 400 };
    const p2 = { x: 0.6, y: 0.8, screenX: 600, screenY: 800 };
    const mid = midpoint2D(p1, p2);
    expect(mid.x).toBeCloseTo(0.4);
    expect(mid.y).toBeCloseTo(0.6);
    expect(mid.screenX).toBe(400);
    expect(mid.screenY).toBe(600);
  });

  it('normalizes screen coordinates to NDC space [-1, 1]', () => {
    const ndc = normalizeScreenCoords(640, 360, 1280, 720);
    expect(ndc.ndcX).toBeCloseTo(0);
    expect(ndc.ndcY).toBeCloseTo(0);
  });

  it('transforms screen pixels to Three.js world space coordinates', () => {
    const worldCenter = screenToThreeWorld(640, 360, 1280, 720, 5, 60);
    expect(worldCenter.x).toBeCloseTo(0, 1);
    expect(worldCenter.y).toBeCloseTo(0, 1);
    expect(worldCenter.z).toBe(0);
  });
});
