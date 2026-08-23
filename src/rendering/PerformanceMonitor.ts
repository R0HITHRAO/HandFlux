import { PerformanceMetrics, QualityLevel } from '../types/performance';

export class PerformanceMonitor {
  private renderFrameCount: number = 0;
  private renderLastTime: number = performance.now();
  private renderFps: number = 60;

  private visionInferenceCount: number = 0;
  private visionLastTime: number = performance.now();
  private visionFps: number = 30;
  private visionLatencyMs: number = 12;

  private quality: QualityLevel = 'AUTO';
  private resolvedQuality: QualityLevel = 'HIGH';

  // Hysteresis counters
  private lowFpsDurationMs: number = 0;
  private highFpsDurationMs: number = 0;

  public recordRenderFrame(now: number = performance.now()): void {
    this.renderFrameCount++;
    const dt = now - this.renderLastTime;
    if (dt >= 800) {
      const instantFps = (this.renderFrameCount * 1000) / dt;
      // Smooth exponential moving average
      this.renderFps = Math.round(this.renderFps * 0.4 + instantFps * 0.6);
      this.renderFrameCount = 0;
      this.renderLastTime = now;
      this.updateHysteresis(dt);
    }
  }

  public recordVisionInference(latencyMs: number, now: number = performance.now()): void {
    this.visionInferenceCount++;
    this.visionLatencyMs = Math.round(this.visionLatencyMs * 0.7 + latencyMs * 0.3);
    const dt = now - this.visionLastTime;
    if (dt >= 800) {
      const instantFps = (this.visionInferenceCount * 1000) / dt;
      this.visionFps = Math.round(this.visionFps * 0.4 + instantFps * 0.6);
      this.visionInferenceCount = 0;
      this.visionLastTime = now;
    }
  }

  private updateHysteresis(dt: number): void {
    if (this.quality !== 'AUTO') {
      this.resolvedQuality = this.quality;
      return;
    }

    if (this.renderFps < 35) {
      this.lowFpsDurationMs += dt;
      this.highFpsDurationMs = 0;
      if (this.lowFpsDurationMs >= 2000) {
        this.resolvedQuality = 'LOW';
      }
    } else if (this.renderFps > 52) {
      this.highFpsDurationMs += dt;
      this.lowFpsDurationMs = 0;
      if (this.highFpsDurationMs >= 4000) {
        this.resolvedQuality = 'HIGH';
      }
    } else {
      this.lowFpsDurationMs = 0;
      this.highFpsDurationMs = 0;
      if (this.resolvedQuality === 'LOW' && this.renderFps >= 42) {
        this.resolvedQuality = 'MEDIUM';
      }
    }
  }

  public getMetrics(): PerformanceMetrics {
    return {
      renderFps: this.renderFps,
      visionFps: this.visionFps,
      visionLatencyMs: this.visionLatencyMs,
      frameTimeMs: parseFloat((1000 / Math.max(1, this.renderFps)).toFixed(1)),
      qualityLevel: this.resolvedQuality,
      activeParticles: this.resolvedQuality === 'ULTRA' ? 600 : this.resolvedQuality === 'HIGH' ? 350 : 120,
      glslPasses: 3
    };
  }

  public getRenderScale(): number {
    if (this.resolvedQuality === 'LOW') return 0.75;
    if (this.resolvedQuality === 'MEDIUM') return 0.9;
    return 1.0;
  }

  public setQuality(q: QualityLevel): void {
    this.quality = q;
    this.resolvedQuality = q === 'AUTO' ? 'HIGH' : q;
  }
}
