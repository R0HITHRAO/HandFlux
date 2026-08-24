import { PerformanceMetrics, QualityLevel } from '../types/performance';

export class PerformanceMonitor {
  private cameraFrameCount: number = 0;
  private cameraLastTime: number = performance.now();
  private cameraFps: number = 30;

  private visionInferenceCount: number = 0;
  private visionLastTime: number = performance.now();
  private visionFps: number = 28;
  private visionTimeMs: number = 6.0;

  private renderFrameCount: number = 0;
  private renderLastTime: number = performance.now();
  private renderFps: number = 60;
  private arUpdateTimeMs: number = 0.8;
  private renderTimeMs: number = 4.2;
  private totalFrameTimeMs: number = 11.0;

  private quality: QualityLevel = 'AUTO';
  private resolvedQuality: QualityLevel = 'HIGH';
  private lowFpsDurationMs: number = 0;
  private highFpsDurationMs: number = 0;

  public recordCameraFrame(now: number = performance.now()): void {
    this.cameraFrameCount++;
    const dt = now - this.cameraLastTime;
    if (dt >= 800) {
      const instantFps = (this.cameraFrameCount * 1000) / dt;
      this.cameraFps = Math.round(this.cameraFps * 0.4 + instantFps * 0.6);
      this.cameraFrameCount = 0;
      this.cameraLastTime = now;
    }
  }

  public recordVisionInference(latencyMs: number, now: number = performance.now()): void {
    this.visionInferenceCount++;
    this.visionTimeMs = parseFloat((this.visionTimeMs * 0.7 + latencyMs * 0.3).toFixed(1));
    const dt = now - this.visionLastTime;
    if (dt >= 800) {
      const instantFps = (this.visionInferenceCount * 1000) / dt;
      this.visionFps = Math.round(this.visionFps * 0.4 + instantFps * 0.6);
      this.visionInferenceCount = 0;
      this.visionLastTime = now;
    }
  }

  public recordRenderTimings(updateMs: number, renderPassMs: number, totalMs: number, now: number = performance.now()): void {
    this.renderFrameCount++;
    this.arUpdateTimeMs = parseFloat((this.arUpdateTimeMs * 0.8 + updateMs * 0.2).toFixed(1));
    this.renderTimeMs = parseFloat((this.renderTimeMs * 0.8 + renderPassMs * 0.2).toFixed(1));
    this.totalFrameTimeMs = parseFloat((this.totalFrameTimeMs * 0.8 + totalMs * 0.2).toFixed(1));

    const dt = now - this.renderLastTime;
    if (dt >= 800) {
      const instantFps = (this.renderFrameCount * 1000) / dt;
      this.renderFps = Math.round(this.renderFps * 0.4 + instantFps * 0.6);
      this.renderFrameCount = 0;
      this.renderLastTime = now;
      this.updateHysteresis(dt);
    }
  }

  private updateHysteresis(dt: number): void {
    if (this.quality !== 'AUTO') {
      this.resolvedQuality = this.quality;
      return;
    }

    if (this.renderFps < 35 || this.totalFrameTimeMs > 25) {
      this.lowFpsDurationMs += dt;
      this.highFpsDurationMs = 0;
      if (this.lowFpsDurationMs >= 2000) {
        this.resolvedQuality = 'LOW';
      }
    } else if (this.renderFps > 52 && this.totalFrameTimeMs < 16.0) {
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
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;
    return {
      cameraFps: this.cameraFps,
      visionFps: this.visionFps,
      renderFps: this.renderFps,
      visionTimeMs: this.visionTimeMs,
      arUpdateTimeMs: this.arUpdateTimeMs,
      renderTimeMs: this.renderTimeMs,
      totalFrameTimeMs: this.totalFrameTimeMs,
      qualityLevel: this.resolvedQuality,
      activeParticles: this.resolvedQuality === 'ULTRA' ? 600 : this.resolvedQuality === 'HIGH' ? 350 : 120,
      dpr,
      renderScale: this.getRenderScale()
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
