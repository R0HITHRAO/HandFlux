import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
import { lerp } from '../utils/mathUtils';

export class EffectStateMachine {
  private currentState: VisualEffectState = VisualEffectState.IDLE;
  private targetState: VisualEffectState = VisualEffectState.IDLE;
  private transitionAlpha: number = 1.0;
  private stateOpacities: Map<VisualEffectState, number> = new Map();

  constructor() {
    Object.values(VisualEffectState).forEach(s => this.stateOpacities.set(s, 0.0));
    this.stateOpacities.set(VisualEffectState.IDLE, 1.0);
  }

  public setState(state: VisualEffectState, instant: boolean = false): void {
    if (this.targetState === state) return;
    this.targetState = state;
    if (instant) {
      this.currentState = state;
      this.transitionAlpha = 1.0;
      this.stateOpacities.forEach((_, s) => this.stateOpacities.set(s, s === state ? 1.0 : 0.0));
    }
  }

  public update(dt: number): void {
    const blendSpeed = 4.0; // Blend rate per second
    
    Object.values(VisualEffectState).forEach(state => {
      const targetOpacity = state === this.targetState ? 1.0 : 0.0;
      const currOpacity = this.stateOpacities.get(state) || 0.0;
      const newOpacity = lerp(currOpacity, targetOpacity, dt * blendSpeed);
      this.stateOpacities.set(state, newOpacity);
    });

    if ((this.stateOpacities.get(this.targetState) || 0) > 0.95) {
      this.currentState = this.targetState;
    }
  }

  public getOpacity(state: VisualEffectState): number {
    return this.stateOpacities.get(state) || 0.0;
  }

  public getCurrentState(): VisualEffectState {
    return this.targetState;
  }

  public getThermalIntensity(): number {
    return this.getOpacity(VisualEffectState.THERMAL);
  }

  public getBlurIntensity(): number {
    return this.getOpacity(VisualEffectState.BLUR_TRANSITION);
  }
}
