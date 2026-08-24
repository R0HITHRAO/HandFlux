export type QualityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' | 'AUTO';

export interface PerformanceMetrics {
  cameraFps: number;
  visionFps: number;
  renderFps: number;
  visionTimeMs: number;
  visionLatencyMs: number;
  arUpdateTimeMs: number;
  renderTimeMs: number;
  totalFrameTimeMs: number;
  frameTimeMs: number;
  qualityLevel: QualityLevel;
  activeParticles: number;
  dpr: number;
  renderScale: number;
}
