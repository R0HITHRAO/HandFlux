import { HandLandmarks } from '../types/vision';
import { GestureMetrics } from '../types/gestures';
import { VisualEffectState } from '../types/effects';
import { ARObjectInstance } from '../types/objects';
import { PerformanceMetrics } from '../types/performance';

export interface HUDOptions {
  showLandmarks: boolean;
  showCoordinates: boolean;
  showGuides: boolean;
  showReticles: boolean;
  showBoundingBox: boolean;
  minimalMode?: boolean;
}

export class TechnicalHUDCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private fingerChains = [
    [0, 1, 2, 3, 4],
    [0, 5, 6, 7, 8],
    [0, 9, 10, 11, 12],
    [0, 13, 14, 15, 16],
    [0, 17, 18, 19, 20],
    [5, 9, 13, 17, 0]
  ];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('2D Context unavailable');
    this.ctx = context;
  }

  public render(
    hands: HandLandmarks[],
    gestures: GestureMetrics,
    activeTool: VisualEffectState,
    objects: ARObjectInstance[],
    selectedObjId: string | null,
    creationHoldProgress: number,
    options: HUDOptions,
    metrics: PerformanceMetrics,
    time: number = performance.now() * 0.001
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);
    if (hands.length === 0) return;

    // 1. FAST BATCHED HAND TRACKING OVERLAYS (Sleek Cyberpunk Style)
    for (let hIdx = 0; hIdx < hands.length; hIdx++) {
      const hand = hands[hIdx];

      // A. Layered Neon Bone Lines
      if (options.showLandmarks) {
        // Outer Translucent Glow
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.25)';
        ctx.lineWidth = 5.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let c = 0; c < this.fingerChains.length; c++) {
          const chain = this.fingerChains[c];
          for (let i = 0; i < chain.length; i++) {
            const pt = hand.landmarks[chain[i]];
            if (i === 0) ctx.moveTo(pt.screenX, pt.screenY);
            else ctx.lineTo(pt.screenX, pt.screenY);
          }
        }
        ctx.stroke();

        // Crisp Inner Cyan Bone
        ctx.strokeStyle = '#00f5ff';
        ctx.lineWidth = 2.0;
        ctx.stroke();
      }

      // B. Red/Magenta Joint Landmark Nodes
      if (options.showLandmarks) {
        ctx.beginPath();
        for (let i = 0; i < hand.landmarks.length; i++) {
          const pt = hand.landmarks[i];
          ctx.moveTo(pt.screenX + 3.2, pt.screenY);
          ctx.arc(pt.screenX, pt.screenY, 3.2, 0, 6.2831853);
        }
        ctx.fillStyle = '#ff0055';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // C. Primary Fingertip Interaction Points
      const indexTip = hand.indexTip;
      const thumbTip = hand.thumbTip;

      ctx.fillStyle = '#ff00dc';
      ctx.beginPath();
      ctx.arc(indexTip.screenX, indexTip.screenY, 6.5, 0, 6.2831853);
      ctx.fill();

      const ringPulse = 10.0 + Math.sin(time * 6.0) * 2.0;
      ctx.strokeStyle = '#ff00dc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(indexTip.screenX, indexTip.screenY, ringPulse, 0, 6.2831853);
      ctx.stroke();

      // D. Magenta Pinch Interaction Line
      const dx = thumbTip.screenX - indexTip.screenX;
      const dy = thumbTip.screenY - indexTip.screenY;
      const isPinchActive = (dx * dx + dy * dy) < 4900; // < 70px

      if (isPinchActive) {
        ctx.strokeStyle = '#ff00dc';
        ctx.lineWidth = 3.0;
        ctx.beginPath();
        ctx.moveTo(thumbTip.screenX, thumbTip.screenY);
        ctx.lineTo(indexTip.screenX, indexTip.screenY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(thumbTip.screenX, thumbTip.screenY, 6.0, 0, 6.2831853);
        ctx.fill();

        // Pinch-Hold Creation Radial Meter
        if (creationHoldProgress > 0.05 && activeTool !== VisualEffectState.NONE) {
          const midX = (thumbTip.screenX + indexTip.screenX) * 0.5;
          const midY = (thumbTip.screenY + indexTip.screenY) * 0.5;
          ctx.beginPath();
          ctx.arc(midX, midY, 24, -1.5707963, -1.5707963 + 6.2831853 * creationHoldProgress);
          ctx.strokeStyle = '#00f5ff';
          ctx.lineWidth = 3.5;
          ctx.stroke();
        }
      }
      // E. Laser Ray Indicator when pointing
      if (gestures.isPointing && gestures.pointerPosition) {
        const pX = gestures.pointerPosition.screenX;
        const pY = gestures.pointerPosition.screenY;
        ctx.strokeStyle = 'rgba(255, 0, 85, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(indexTip.screenX, indexTip.screenY);
        ctx.lineTo(pX, pY);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // 2. AR OBJECT SELECTION BRACKETS (Only in AR Mode)
    if (objects.length > 0) {
      const fovFactor = (2 * Math.tan(0.52359877) * 5);
      const invAspect = (w / h * fovFactor);

      for (let idx = 0; idx < objects.length; idx++) {
        const obj = objects[idx];
        const isSelected = obj.id === selectedObjId;
        const screenX = (obj.position.x / invAspect + 0.5) * w;
        const screenY = (0.5 - obj.position.y / fovFactor) * h;
        const tagColor = isSelected ? '#ff00dc' : '#00f5ff';
        const label = obj.type.toUpperCase();

        ctx.strokeStyle = tagColor;
        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        const sz = 22;
        ctx.strokeRect(screenX - sz, screenY - sz, sz * 2, sz * 2);

        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillStyle = tagColor;
        ctx.fillText('[' + label + ' #' + (idx + 1) + ']', screenX - sz, screenY - sz - 6);
      }
    }
  }
}
