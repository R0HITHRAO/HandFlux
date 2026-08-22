import { describe, it, expect } from 'vitest';
import { EffectManager } from '../state/EffectManager';
import { VisualEffectState } from '../types/effects';

describe('EffectManager', () => {
  it('initializes with active state and smooth blending', () => {
    const em = new EffectManager();
    expect(em.getMode()).toBe(VisualEffectState.RECTANGLE_TRACKING);
    expect(em.getOpacity(VisualEffectState.RECTANGLE_TRACKING)).toBe(1.0);
    expect(em.getOpacity(VisualEffectState.THERMAL)).toBe(0.0);
  });

  it('blends smoothly between states over time', () => {
    const em = new EffectManager();
    em.setMode(VisualEffectState.THERMAL);

    expect(em.getMode()).toBe(VisualEffectState.THERMAL);
    expect(em.getOpacity(VisualEffectState.THERMAL)).toBe(0.0);

    em.update(0.1);
    expect(em.getOpacity(VisualEffectState.THERMAL)).toBeGreaterThan(0.0);

    em.update(1.0);
    expect(em.getOpacity(VisualEffectState.THERMAL)).toBeGreaterThan(0.9);
  });

  it('supports instant state transitions', () => {
    const em = new EffectManager();
    em.setMode(VisualEffectState.PURPLE_PRISM, true);
    expect(em.getOpacity(VisualEffectState.PURPLE_PRISM)).toBe(1.0);
    expect(em.getOpacity(VisualEffectState.RECTANGLE_TRACKING)).toBe(0.0);
  });
});
