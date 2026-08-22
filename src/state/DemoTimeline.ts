import { VisualEffectState } from '../types/effects';
import { EffectStateMachine } from './EffectStateMachine';

export interface TimelineEntry {
  startSec: number;
  endSec: number;
  state: VisualEffectState;
}

export class DemoTimeline {
  // 34-second reference sequence timeline:
  // 0-4s: RECTANGLE_TRACKING (Blue/purple hatching)
  // 4-8s: TRIANGLE_EFFECT (Purple wedges)
  // 8-11s: GLOW_BLOCKS (Pink/green luminous blocks)
  // 11-12.5s: BLUR_TRANSITION (GPU camera blur)
  // 12.5-14.5s: ANGULAR_OBJECT (Multicolor polygon prism)
  // 14.5-17.5s: THERMAL (False-color camera)
  // 17.5-22s: RECTANGLE_DOTS (Pink halftone dotted plane)
  // 22-29s: LARGE_GEOMETRY (Big 3D folded horizontal structure)
  // 29-34s: PURPLE_PRISM (Translucent lavender crystal)
  private sequence: TimelineEntry[] = [
    { startSec: 0.0, endSec: 4.0, state: VisualEffectState.RECTANGLE_TRACKING },
    { startSec: 4.0, endSec: 8.0, state: VisualEffectState.TRIANGLE_EFFECT },
    { startSec: 8.0, endSec: 11.0, state: VisualEffectState.GLOW_BLOCKS },
    { startSec: 11.0, endSec: 12.5, state: VisualEffectState.BLUR_TRANSITION },
    { startSec: 12.5, endSec: 14.5, state: VisualEffectState.ANGULAR_OBJECT },
    { startSec: 14.5, endSec: 17.5, state: VisualEffectState.THERMAL },
    { startSec: 17.5, endSec: 22.0, state: VisualEffectState.RECTANGLE_DOTS },
    { startSec: 22.0, endSec: 29.0, state: VisualEffectState.LARGE_GEOMETRY },
    { startSec: 29.0, endSec: 34.0, state: VisualEffectState.PURPLE_PRISM }
  ];

  private totalDuration: number = 34.0;
  private currentTime: number = 0.0;
  private isPlaying: boolean = false;

  constructor(private stateMachine: EffectStateMachine) {}

  public start(): void {
    this.currentTime = 0.0;
    this.isPlaying = true;
  }

  public stop(): void {
    this.isPlaying = false;
  }

  public update(dt: number): { time: number; totalDuration: number; state: VisualEffectState } {
    if (!this.isPlaying) {
      return { time: this.currentTime, totalDuration: this.totalDuration, state: this.stateMachine.getCurrentState() };
    }

    this.currentTime += dt;
    if (this.currentTime >= this.totalDuration) {
      this.currentTime = 0.0; // Loop seamlessly
    }

    const activeEntry = this.sequence.find(e => this.currentTime >= e.startSec && this.currentTime < e.endSec);
    const targetState = activeEntry ? activeEntry.state : VisualEffectState.IDLE;

    this.stateMachine.setState(targetState);

    return {
      time: this.currentTime,
      totalDuration: this.totalDuration,
      state: targetState
    };
  }

  public seek(timeSec: number): void {
    this.currentTime = Math.max(0, Math.min(this.totalDuration, timeSec));
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
