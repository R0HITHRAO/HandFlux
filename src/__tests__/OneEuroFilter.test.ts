import { describe, it, expect } from 'vitest';
import { OneEuroFilter, LandmarkFilterSet } from '../vision/OneEuroFilter';

describe('OneEuroFilter', () => {
  it('smooths noisy signal while preserving steady states', () => {
    const filter = new OneEuroFilter(1.0, 0.007);
    const t0 = 1000;
    
    // First sample initializes filter
    expect(filter.filter(10, t0)).toBe(10);

    // Minor jitter should be smoothed
    const smoothed1 = filter.filter(10.2, t0 + 16);
    expect(smoothed1).toBeLessThan(10.2);
    expect(smoothed1).toBeGreaterThan(10.0);

    // Fast movement adapts cutoff and tracks forward
    const fastMove = filter.filter(30.0, t0 + 32);
    expect(fastMove).toBeGreaterThan(12.0);
    expect(fastMove).toBeLessThan(30.0);
  });

  it('handles landmark filter set for 21 joints', () => {
    const filterSet = new LandmarkFilterSet(21);
    const p1 = filterSet.filterPoint(0, 0.5, 0.5, 1000);
    expect(p1.x).toBe(0.5);
    expect(p1.y).toBe(0.5);

    const p2 = filterSet.filterPoint(0, 0.52, 0.51, 1016);
    expect(p2.x).toBeLessThan(0.52);
    expect(p2.y).toBeLessThan(0.51);

    filterSet.reset();
  });
});
