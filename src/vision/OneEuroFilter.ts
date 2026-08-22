class LowPassFilter {
  private y: number = 0;
  private s: number = 0;
  private initialized: boolean = false;

  constructor(private alpha: number = 0.5) {}

  public filter(val: number, alpha?: number): number {
    if (alpha !== undefined) this.alpha = alpha;
    if (!this.initialized) {
      this.s = val;
      this.initialized = true;
      return val;
    }
    this.s = this.alpha * val + (1 - this.alpha) * this.s;
    return this.s;
  }

  public last(): number {
    return this.s;
  }

  public reset(): void {
    this.initialized = false;
  }
}

export class OneEuroFilter {
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number = 0;

  constructor(
    private minCutoff: number = 1.0,
    private beta: number = 0.007,
    private dCutoff: number = 1.0
  ) {
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  public filter(val: number, timestamp: number = performance.now()): number {
    if (this.lastTime === 0) {
      this.lastTime = timestamp;
      return this.xFilter.filter(val);
    }

    const dt = Math.max((timestamp - this.lastTime) / 1000.0, 0.0001);
    this.lastTime = timestamp;

    const prevX = this.xFilter.last();
    const dx = (val - prevX) / dt;
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt));

    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(val, this.alpha(cutoff, dt));
  }

  public reset(): void {
    this.lastTime = 0;
    this.xFilter.reset();
    this.dxFilter.reset();
  }
}

export class LandmarkFilterSet {
  private xFilters: OneEuroFilter[] = [];
  private yFilters: OneEuroFilter[] = [];

  constructor(count: number = 21, minCutoff: number = 1.2, beta: number = 0.008) {
    for (let i = 0; i < count; i++) {
      this.xFilters.push(new OneEuroFilter(minCutoff, beta));
      this.yFilters.push(new OneEuroFilter(minCutoff, beta));
    }
  }

  public filterPoint(index: number, x: number, y: number, time: number): { x: number; y: number } {
    if (index >= this.xFilters.length) return { x, y };
    return {
      x: this.xFilters[index].filter(x, time),
      y: this.yFilters[index].filter(y, time)
    };
  }

  public reset(): void {
    this.xFilters.forEach(f => f.reset());
    this.yFilters.forEach(f => f.reset());
  }
}
