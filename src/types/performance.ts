export type QualityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' | 'AUTO';

export interface PerformanceMetrics {
  cameraFps: number;
  visionFps: number;
  renderFps: number;
  visionTimeMs: number;
  arUpdateTimeMs: number;
  renderTimeMs: number;
  totalFrameTimeMs: number;
  qualityLevel: QualityLevel;
  activeParticles: number;
  dpr: number;
  renderScale: number;
}
