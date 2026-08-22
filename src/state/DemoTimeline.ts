import { EffectManager } from './EffectManager';
import { VisualEffectState } from '../types/effects';

export interface TimelineEntry {
  startSec: number;
  endSec: number;
  state: VisualEffectState;
}

export class DemoTimeline {
  private effectManager: EffectManager;
  private isRunning: boolean = false;
  private currentTimeSec: number = 0;
  private totalDurationSec: number = 34.0;

  private timeline: TimelineEntry[] = [
    { startSec: 0.0,  endSec: 4.0,  state: VisualEffectState.RECTANGLE_TRACKING },
    { startSec: 4.0,  endSec: 8.0,  state: VisualEffectState.TRIANGLE_EFFECT },
    { startSec: 8.0,  endSec: 11.0, state: VisualEffectState.GLOW_BLOCKS },
    { startSec: 11.0, endSec: 12.5, state: VisualEffectState.BLUR_TRANSITION },
    { startSec: 12.5, endSec: 14.5, state: VisualEffectState.ANGULAR_OBJECT },
    { startSec: 14.5, endSec: 17.5, state: VisualEffectState.THERMAL },
    { startSec: 17.5, endSec: 22.0, state: VisualEffectState.RECTANGLE_DOTS },
    { startSec: 22.0, endSec: 29.0, state: VisualEffectState.LARGE_GEOMETRY },
    { startSec: 29.0, endSec: 34.0, state: VisualEffectState.PURPLE_PRISM }
  ];

  constructor(effectManager: EffectManager) {
    this.effectManager = effectManager;
  }

  public start(): void {
    this.isRunning = true;
    this.currentTimeSec = 0.0;
  }

  public stop(): void {
    this.isRunning = false;
  }

  public update(dt: number): { state: VisualEffectState; time: number } {
    if (!this.isRunning) {
      this.effectManager.update(dt);
      return { state: this.effectManager.getMode(), time: this.currentTimeSec };
    }

    this.currentTimeSec = (this.currentTimeSec + dt) % this.totalDurationSec;

    const currentEntry = this.timeline.find(
      e => this.currentTimeSec >= e.startSec && this.currentTimeSec < e.endSec
    );

    if (currentEntry) {
      this.effectManager.setMode(currentEntry.state);
    }

    this.effectManager.update(dt);
    return { state: this.effectManager.getMode(), time: this.currentTimeSec };
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getCurrentTime(): number {
    return this.currentTimeSec;
  }
}
