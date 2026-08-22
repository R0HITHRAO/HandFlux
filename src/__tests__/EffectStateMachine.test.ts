import { describe, it, expect } from 'vitest';
import { EffectStateMachine } from '../state/EffectStateMachine';
import { VisualEffectState } from '../types/effects';

describe('EffectStateMachine', () => {
  it('initializes with IDLE state and smooth blending', () => {
    const sm = new EffectStateMachine();
    expect(sm.getCurrentState()).toBe(VisualEffectState.IDLE);
    expect(sm.getOpacity(VisualEffectState.IDLE)).toBe(1.0);
    expect(sm.getOpacity(VisualEffectState.THERMAL)).toBe(0.0);
  });

  it('blends smoothly between states over time', () => {
    const sm = new EffectStateMachine();
    sm.setState(VisualEffectState.THERMAL);

    // Before update, target is set
    expect(sm.getCurrentState()).toBe(VisualEffectState.THERMAL);
    expect(sm.getOpacity(VisualEffectState.THERMAL)).toBe(0.0);

    // Update with 0.1s delta
    sm.update(0.1);
    expect(sm.getOpacity(VisualEffectState.THERMAL)).toBeGreaterThan(0.0);

    // Update with 1.0s delta to reach full target
    sm.update(1.0);
    expect(sm.getOpacity(VisualEffectState.THERMAL)).toBeGreaterThan(0.9);
  });

  it('supports instant state transitions', () => {
    const sm = new EffectStateMachine();
    sm.setState(VisualEffectState.PURPLE_PRISM, true);
    expect(sm.getOpacity(VisualEffectState.PURPLE_PRISM)).toBe(1.0);
    expect(sm.getOpacity(VisualEffectState.IDLE)).toBe(0.0);
  });
});
