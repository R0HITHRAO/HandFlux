import { describe, it, expect } from 'vitest';
import { EffectStateMachine } from '../state/EffectStateMachine';
import { VisualEffectState } from '../types/effects';

describe('EffectStateMachine', () => {
  it('initializes with active state and smooth blending', () => {
    const sm = new EffectStateMachine();
    expect(sm.getCurrentState()).toBe(VisualEffectState.RECTANGLE_TRACKING);
    expect(sm.getOpacity(VisualEffectState.RECTANGLE_TRACKING)).toBe(1.0);
    expect(sm.getOpacity(VisualEffectState.THERMAL)).toBe(0.0);
  });

  it('blends smoothly between states over time', () => {
    const sm = new EffectStateMachine();
    sm.setState(VisualEffectState.THERMAL);

    expect(sm.getCurrentState()).toBe(VisualEffectState.THERMAL);
    expect(sm.getOpacity(VisualEffectState.THERMAL)).toBe(0.0);

    sm.update(0.1);
    expect(sm.getOpacity(VisualEffectState.THERMAL)).toBeGreaterThan(0.0);

    sm.update(1.0);
    expect(sm.getOpacity(VisualEffectState.THERMAL)).toBeGreaterThan(0.9);
  });

  it('supports instant state transitions', () => {
    const sm = new EffectStateMachine();
    sm.setState(VisualEffectState.PURPLE_PRISM, true);
    expect(sm.getOpacity(VisualEffectState.PURPLE_PRISM)).toBe(1.0);
    expect(sm.getOpacity(VisualEffectState.RECTANGLE_TRACKING)).toBe(0.0);
  });
});
