import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ARObjectManager } from '../state/ARObjectManager';
import { VisualEffectState } from '../types/effects';
import { HandLandmarks } from '../types/vision';

describe('Performance & Stress Benchmark', () => {
  it('handles 100 consecutive create and delete cycles with zero object leaks', () => {
    const sceneGroup = new THREE.Group();
    const manager = new ARObjectManager(sceneGroup);

    const mockHand: HandLandmarks = {
      id: 'Right-0',
      handedness: 'Right',
      score: 0.95,
      landmarks: Array(21).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0, screenX: 640, screenY: 360 })),
      wrist: { x: 0.5, y: 0.5, z: 0, screenX: 640, screenY: 360 },
      thumbTip: { x: 0.52, y: 0.48, z: 0, screenX: 660, screenY: 340 },
      indexTip: { x: 0.5, y: 0.4, z: 0, screenX: 640, screenY: 280 },
      middleTip: { x: 0.5, y: 0.38, z: 0, screenX: 640, screenY: 270 },
      ringTip: { x: 0.5, y: 0.39, z: 0, screenX: 640, screenY: 275 },
      pinkyTip: { x: 0.5, y: 0.42, z: 0, screenX: 640, screenY: 300 },
      palmCenter: { x: 0.5, y: 0.5, z: 0, screenX: 640, screenY: 360 },
      boundingBox: { minX: 600, minY: 260, maxX: 680, maxY: 380, width: 80, height: 120 },
      velocity: { vx: 0, vy: 0, speed: 0 }
    };

    for (let i = 0; i < 100; i++) {
      const tool = (i % 2 === 0) ? VisualEffectState.PURPLE_PRISM : VisualEffectState.RECTANGLE_TRACKING;
      const obj = manager.createObjectAtHand(tool, mockHand, 1280, 720);
      expect(obj).not.toBeNull();
      expect(manager.getObjects().length).toBeGreaterThan(0);
      expect(sceneGroup.children.length).toBeGreaterThan(0);

      manager.deleteSelected();
      expect(manager.getObjects().length).toBe(0);
      expect(sceneGroup.children.length).toBe(0);
    }

    expect(manager.getObjects().length).toBe(0);
    expect(sceneGroup.children.length).toBe(0);
  });

  it('strictly bounds maximum object count to 5', () => {
    const sceneGroup = new THREE.Group();
    const manager = new ARObjectManager(sceneGroup);

    const mockHand: HandLandmarks = {
      id: 'Right-0',
      handedness: 'Right',
      score: 0.95,
      landmarks: Array(21).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0, screenX: 640, screenY: 360 })),
      wrist: { x: 0.5, y: 0.5, z: 0, screenX: 640, screenY: 360 },
      thumbTip: { x: 0.52, y: 0.48, z: 0, screenX: 660, screenY: 340 },
      indexTip: { x: 0.5, y: 0.4, z: 0, screenX: 640, screenY: 280 },
      middleTip: { x: 0.5, y: 0.38, z: 0, screenX: 640, screenY: 270 },
      ringTip: { x: 0.5, y: 0.39, z: 0, screenX: 640, screenY: 275 },
      pinkyTip: { x: 0.5, y: 0.42, z: 0, screenX: 640, screenY: 300 },
      palmCenter: { x: 0.5, y: 0.5, z: 0, screenX: 640, screenY: 360 },
      boundingBox: { minX: 600, minY: 260, maxX: 680, maxY: 380, width: 80, height: 120 },
      velocity: { vx: 0, vy: 0, speed: 0 }
    };

    for (let i = 0; i < 10; i++) {
      manager.createObjectAtHand(VisualEffectState.PURPLE_PRISM, mockHand, 1280, 720);
    }

    expect(manager.getObjects().length).toBe(5);
    expect(sceneGroup.children.length).toBe(5);

    manager.clearAll();
    expect(manager.getObjects().length).toBe(0);
    expect(sceneGroup.children.length).toBe(0);
  });
});
