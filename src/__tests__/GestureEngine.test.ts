import { describe, it, expect } from 'vitest';
import { GestureEngine } from '../vision/GestureEngine';
import { SimulatedHandTracker } from '../vision/SimulatedHandTracker';

describe('GestureEngine', () => {
  const tracker = new SimulatedHandTracker();
  const engine = new GestureEngine();

  it('handles empty hand list gracefully', () => {
    const metrics = engine.processHands([], 1280, 720);
    expect(metrics.primaryGesture).toBe('UNKNOWN');
    expect(metrics.twoHandDistance).toBe(0);
    expect(metrics.isPinching).toBe(false);
  });

  it('extracts two-hand distance, angle, and midpoint from tracked hands', () => {
    const hands = tracker.getSimulatedHands(1280, 720);
    expect(hands.length).toBe(2);

    const metrics = engine.processHands(hands, 1280, 720);
    expect(metrics.twoHandDistance).toBeGreaterThan(0.2);
    expect(metrics.twoHandMidpoint.screenX).toBeGreaterThan(300);
    expect(metrics.twoHandMidpoint.screenY).toBeGreaterThan(200);
  });
});
