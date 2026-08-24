import { describe, it, expect } from 'vitest';
import { GestureEngine } from '../vision/GestureEngine';
import { HandLandmarks } from '../types/vision';

describe('GestureEngine Structured Event System', () => {
  it('recognizes pinch gestures when thumb and index are close', () => {
    const engine = new GestureEngine();
    const mockHand: HandLandmarks = {
      id: 'Right-0',
      handedness: 'Right',
      score: 0.95,
      landmarks: Array(21).fill(null).map(() => ({ x: 0.5, y: 0.5, z: 0, screenX: 640, screenY: 360 })),
      wrist: { x: 0.5, y: 0.5, z: 0, screenX: 640, screenY: 360 },
      thumbTip: { x: 0.505, y: 0.405, z: 0, screenX: 645, screenY: 285 },
      indexTip: { x: 0.5, y: 0.4, z: 0, screenX: 640, screenY: 280 },
      middleTip: { x: 0.5, y: 0.38, z: 0, screenX: 640, screenY: 270 },
      ringTip: { x: 0.5, y: 0.39, z: 0, screenX: 640, screenY: 275 },
      pinkyTip: { x: 0.5, y: 0.42, z: 0, screenX: 640, screenY: 300 },
      palmCenter: { x: 0.5, y: 0.5, z: 0, screenX: 640, screenY: 360 },
      boundingBox: { minX: 600, minY: 260, maxX: 680, maxY: 380, width: 80, height: 120 },
      velocity: { vx: 0, vy: 0, speed: 0 }
    };

    const metrics = engine.processHands([mockHand], 1280, 720);
    expect(metrics.isPinching).toBe(true);
    expect(metrics.primaryGesture).toBe('PINCH');
  });

  it('calculates two-hand distance and angle correctly', () => {
    const engine = new GestureEngine();
    const hand1: HandLandmarks = {
      id: 'Left-0',
      handedness: 'Left',
      score: 0.95,
      landmarks: Array(21).fill(null).map(() => ({ x: 0.3, y: 0.5, z: 0, screenX: 384, screenY: 360 })),
      wrist: { x: 0.3, y: 0.5, z: 0, screenX: 384, screenY: 360 },
      thumbTip: { x: 0.3, y: 0.45, z: 0, screenX: 384, screenY: 324 },
      indexTip: { x: 0.3, y: 0.4, z: 0, screenX: 384, screenY: 288 },
      middleTip: { x: 0.3, y: 0.38, z: 0, screenX: 384, screenY: 273 },
      ringTip: { x: 0.3, y: 0.39, z: 0, screenX: 384, screenY: 280 },
      pinkyTip: { x: 0.3, y: 0.42, z: 0, screenX: 384, screenY: 302 },
      palmCenter: { x: 0.3, y: 0.5, z: 0, screenX: 384, screenY: 360 },
      boundingBox: { minX: 340, minY: 260, maxX: 420, maxY: 380, width: 80, height: 120 },
      velocity: { vx: 0, vy: 0, speed: 0 }
    };

    const hand2: HandLandmarks = {
      id: 'Right-0',
      handedness: 'Right',
      score: 0.95,
      landmarks: Array(21).fill(null).map(() => ({ x: 0.7, y: 0.5, z: 0, screenX: 896, screenY: 360 })),
      wrist: { x: 0.7, y: 0.5, z: 0, screenX: 896, screenY: 360 },
      thumbTip: { x: 0.7, y: 0.45, z: 0, screenX: 896, screenY: 324 },
      indexTip: { x: 0.7, y: 0.4, z: 0, screenX: 896, screenY: 288 },
      middleTip: { x: 0.7, y: 0.38, z: 0, screenX: 896, screenY: 273 },
      ringTip: { x: 0.7, y: 0.39, z: 0, screenX: 896, screenY: 280 },
      pinkyTip: { x: 0.7, y: 0.42, z: 0, screenX: 896, screenY: 302 },
      palmCenter: { x: 0.7, y: 0.5, z: 0, screenX: 896, screenY: 360 },
      boundingBox: { minX: 850, minY: 260, maxX: 930, maxY: 380, width: 80, height: 120 },
      velocity: { vx: 0, vy: 0, speed: 0 }
    };

    const metrics = engine.processHands([hand1, hand2], 1280, 720);
    expect(metrics.twoHandDistance).toBeGreaterThan(0.3);
    expect(metrics.primaryGesture).toBe('TWO_HAND_SCALE');
  });
});
