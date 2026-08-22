import { PerformanceMetrics, QualityLevel } from '../types/performance';

export class PerformanceMonitor {
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 60;
  private quality: QualityLevel = 'AUTO';
  private resolvedQuality: QualityLevel = 'HIGH';

  public update(visionLatencyMs: number = 16): PerformanceMetrics {
    this.frameCount++;
    const now = performance.now();
    const dt = now - this.lastTime;

    if (dt >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / dt);
      this.frameCount = 0;
      this.lastTime = now;
      this.adaptQuality();
    }

    return {
      renderFps: this.fps,
      visionFps: Math.min(this.fps, 30),
      visionLatencyMs: Math.round(visionLatencyMs),
      frameTimeMs: parseFloat((1000 / Math.max(1, this.fps)).toFixed(1)),
      qualityLevel: this.resolvedQuality,
      activeParticles: this.resolvedQuality === 'ULTRA' ? 600 : this.resolvedQuality === 'HIGH' ? 350 : 150,
      glslPasses: 3
    };
  }

  private adaptQuality(): void {
    if (this.quality !== 'AUTO') {
      this.resolvedQuality = this.quality;
      return;
    }
    if (this.fps < 35) {
      this.resolvedQuality = 'LOW';
    } else if (this.fps < 50) {
      this.resolvedQuality = 'MEDIUM';
    } else if (this.fps >= 58) {
      this.resolvedQuality = 'HIGH';
    }
  }

  public setQuality(q: QualityLevel): void {
    this.quality = q;
  }
}
