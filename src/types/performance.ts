export type QualityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'ULTRA' | 'AUTO';

export interface PerformanceMetrics {
  renderFps: number;
  visionFps: number;
  visionLatencyMs: number;
  frameTimeMs: number;
  qualityLevel: QualityLevel;
  activeParticles: number;
  glslPasses: number;
}
