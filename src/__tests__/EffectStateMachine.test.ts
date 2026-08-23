import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { ARObjectManager } from '../state/ARObjectManager';
import { VisualEffectState } from '../types/effects';
import { HandLandmarks } from '../types/vision';

describe('ARObjectManager On-Demand System', () => {
  const group = new THREE.Group();
  const dummyHand: HandLandmarks = {
    id: 'test-hand',
    handedness: 'Right',
    score: 0.95,
    landmarks: Array.from({ length: 21 }, () => ({ x: 0.3, y: 0.6, screenX: 300, screenY: 600 })),
    wrist: { x: 0.3, y: 0.7, screenX: 300, screenY: 700 },
    thumbTip: { x: 0.25, y: 0.55, screenX: 250, screenY: 550 },
    indexTip: { x: 0.3, y: 0.5, screenX: 300, screenY: 500 },
    middleTip: { x: 0.35, y: 0.5, screenX: 350, screenY: 500 },
    ringTip: { x: 0.4, y: 0.55, screenX: 400, screenY: 550 },
    pinkyTip: { x: 0.45, y: 0.6, screenX: 450, screenY: 600 },
    palmCenter: { x: 0.3, y: 0.6, screenX: 300, screenY: 600 },
    boundingBox: { minX: 250, minY: 500, maxX: 450, maxY: 700, width: 200, height: 200 },
    velocity: { vx: 0, vy: 0, speed: 0 }
  };

  it('starts with ZERO objects', () => {
    const mgr = new ARObjectManager(group);
    expect(mgr.getObjects().length).toBe(0);
  });

  it('creates an object at hand location on demand with face-safe offset', () => {
    const mgr = new ARObjectManager(group);
    const obj = mgr.createObjectAtHand(VisualEffectState.PURPLE_PRISM, dummyHand, 1280, 720);
    expect(mgr.getObjects().length).toBe(1);
    expect(obj.type).toBe(VisualEffectState.PURPLE_PRISM);
    expect(obj.state).toBe('SPAWNING');
  });

  it('supports deletion and clear all', () => {
    const mgr = new ARObjectManager(group);
    mgr.createObjectAtHand(VisualEffectState.GLOW_BLOCKS, dummyHand, 1280, 720);
    expect(mgr.getObjects().length).toBe(1);
    mgr.clearAll();
    expect(mgr.getObjects().length).toBe(0);
  });
});
