import { VisualEffectState } from '../types/effects';
import { lerp } from '../utils/mathUtils';

export class EffectManager {
  private currentMode: VisualEffectState = VisualEffectState.RECTANGLE_TRACKING;
  private targetMode: VisualEffectState = VisualEffectState.RECTANGLE_TRACKING;
  private opacities: Map<VisualEffectState, number> = new Map();

  constructor() {
    Object.values(VisualEffectState).forEach(m => this.opacities.set(m, 0.0));
    this.opacities.set(VisualEffectState.RECTANGLE_TRACKING, 1.0);
  }

  public setMode(mode: VisualEffectState, instant: boolean = false): void {
    this.targetMode = mode;
    if (instant) {
      this.currentMode = mode;
      this.opacities.forEach((_, m) => this.opacities.set(m, m === mode ? 1.0 : 0.0));
    }
  }

  public getMode(): VisualEffectState {
    return this.targetMode;
  }

  public update(dt: number): void {
    const speed = 6.0; // Fast 350ms transition
    Object.values(VisualEffectState).forEach(m => {
      const target = m === this.targetMode ? 1.0 : 0.0;
      const curr = this.opacities.get(m) || 0.0;
      const next = lerp(curr, target, Math.min(1.0, dt * speed));
      this.opacities.set(m, next);
    });

    if ((this.opacities.get(this.targetMode) || 0) > 0.95) {
      this.currentMode = this.targetMode;
    }
  }

  public getOpacity(mode: VisualEffectState): number {
    return this.opacities.get(mode) || 0.0;
  }

  public isRawCamera(): boolean {
    return this.targetMode === VisualEffectState.RAW_CAMERA;
  }

  public isThermal(): boolean {
    return this.targetMode === VisualEffectState.THERMAL;
  }

  public getThermalIntensity(): number {
    return this.getOpacity(VisualEffectState.THERMAL);
  }

  public getBlurIntensity(): number {
    return this.getOpacity(VisualEffectState.BLUR_TRANSITION);
  }
}
