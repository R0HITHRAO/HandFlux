import { HandLandmarks } from '../types/vision';
import { GestureMetrics } from '../types/gestures';
import { VisualEffectState, EFFECT_CONFIGS } from '../types/effects';
import { ARObjectInstance } from '../types/objects';

export interface HUDOptions {
  showLandmarks: boolean;
  showCoordinates: boolean;
  showGuides: boolean;
  showReticles: boolean;
  showBoundingBox: boolean;
}

export class TechnicalHUDCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // Pre-allocated chain indices for zero array allocation in loop
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
    renderFps: number,
    visionFps: number,
    time: number = performance.now() * 0.001
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. TOP-LEFT DUAL FPS & ACTIVE TOOL
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ff00dc';
    ctx.fillText('RENDER: ' + renderFps + ' FPS | VISION: ' + visionFps + ' FPS', 24, 38);

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ff00';
    const toolName = EFFECT_CONFIGS[activeTool]?.name || 'NONE';
    ctx.fillText('CURRENT TOOL: ' + toolName + ' | OBJECTS: ' + objects.length + '/5', 24, 60);

    // 2. VERTICAL INTERACTION METER (LEFT)
    const meterX = 24;
    const meterY = 90;
    const meterWidth = 18;
    const meterHeight = Math.min(320, h - 210);

    let meterPercent = 0;
    let meterLabel = 'SIGNAL';

    if (gestures.isPinching) {
      meterPercent = Math.min(100, Math.max(0, Math.round((1.0 - gestures.pinchDistance / 0.18) * 100)));
      meterLabel = 'PINCH';
    } else if (hands.length >= 2) {
      meterPercent = Math.min(100, Math.max(0, Math.round(gestures.twoHandDistance * 140)));
      meterLabel = 'SPAN';
    } else if (hands.length === 1) {
      meterPercent = Math.min(100, Math.max(0, Math.round(gestures.spread * 100)));
      meterLabel = 'SPREAD';
    }

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('100', meterX + meterWidth + 8, meterY + 12);
    ctx.fillText('0', meterX + meterWidth + 8, meterY + meterHeight);

    ctx.fillStyle = '#ff00dc';
    ctx.fillText(meterLabel + ': ' + meterPercent + '%', meterX, meterY - 12);

    // Meter border & fill
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

    ctx.strokeStyle = 'rgba(0, 255, 0, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 8; i++) {
      const lineY = meterY + (meterHeight / 8) * i;
      ctx.moveTo(meterX, lineY);
      ctx.lineTo(meterX + meterWidth, lineY);
    }
    ctx.stroke();

    if (meterPercent > 0) {
      const fillHeight = (meterHeight * meterPercent) / 100;
      const fillY = meterY + meterHeight - fillHeight;
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(meterX + 2, fillY, meterWidth - 4, fillHeight);
    }

    if (hands.length === 0) return;

    // 3. FAST BATCHED HAND TRACKING OVERLAYS
    for (let hIdx = 0; hIdx < hands.length; hIdx++) {
      const hand = hands[hIdx];

      // A. Batched Green Skeleton Bones
      if (options.showLandmarks) {
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.35)';
        ctx.lineWidth = 6.0;
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

        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // B. Batched Red Landmark Dots
      if (options.showLandmarks) {
        ctx.beginPath();
        for (let i = 0; i < hand.landmarks.length; i++) {
          const pt = hand.landmarks[i];
          ctx.moveTo(pt.screenX + 3.8, pt.screenY);
          ctx.arc(pt.screenX, pt.screenY, 3.8, 0, 6.2831853);
        }
        ctx.fillStyle = '#ff2828';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.0;
        ctx.stroke();
      }

      // C. Primary Interaction Point on Index Tip
      const indexTip = hand.indexTip;
      const thumbTip = hand.thumbTip;

      ctx.fillStyle = '#ff00dc';
      ctx.beginPath();
      ctx.arc(indexTip.screenX, indexTip.screenY, 7.5, 0, 6.2831853);
      ctx.fill();

      const ringPulse = 11.5 + Math.sin(time * 6.0) * 2.5;
      ctx.strokeStyle = '#ff00dc';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(indexTip.screenX, indexTip.screenY, ringPulse, 0, 6.2831853);
      ctx.stroke();

      // D. Magenta Pinch Line
      const dx = thumbTip.screenX - indexTip.screenX;
      const dy = thumbTip.screenY - indexTip.screenY;
      const isPinchActive = (dx * dx + dy * dy) < 5625;

      if (isPinchActive) {
        ctx.strokeStyle = '#ff00dc';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(thumbTip.screenX, thumbTip.screenY);
        ctx.lineTo(indexTip.screenX, indexTip.screenY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(thumbTip.screenX, thumbTip.screenY, 7.0, 0, 6.2831853);
        ctx.fill();

        if (creationHoldProgress > 0.05 && activeTool !== VisualEffectState.NONE) {
          const midX = (thumbTip.screenX + indexTip.screenX) * 0.5;
          const midY = (thumbTip.screenY + indexTip.screenY) * 0.5;
          const label = (activeTool === VisualEffectState.RECTANGLE_TRACKING) ? 'HATCH' : 'PRISM';

          ctx.beginPath();
          ctx.arc(midX, midY, 26, -1.5707963, -1.5707963 + 6.2831853 * creationHoldProgress);
          ctx.strokeStyle = '#00f5ff';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.fillStyle = '#00f5ff';
          ctx.textAlign = 'center';
          ctx.fillText('HOLD TO CREATE ' + label, midX, midY - 32);
          ctx.textAlign = 'start';
        }
      }

      // E. Hand Label & Coordinates
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff00';
      ctx.fillText('#' + (hIdx + 1) + ' ' + hand.handedness.toUpperCase(), hand.boundingBox.minX, hand.boundingBox.minY - 10);

      if (options.showCoordinates) {
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('x:' + Math.round(indexTip.screenX) + ' y:' + Math.round(indexTip.screenY), indexTip.screenX + 16, indexTip.screenY + 4);
      }
    }

    // 4. ACTIVE OBJECT SELECTION BRACKETS
    const fovFactor = (2 * Math.tan(0.52359877) * 5);
    const invAspect = (w / h * fovFactor);

    for (let idx = 0; idx < objects.length; idx++) {
      const obj = objects[idx];
      const isSelected = obj.id === selectedObjId;
      const screenX = (obj.position.x / invAspect + 0.5) * w;
      const screenY = (0.5 - obj.position.y / fovFactor) * h;
      const isHatch = obj.type === VisualEffectState.RECTANGLE_TRACKING;
      const tagColor = isSelected ? '#ff00dc' : (isHatch ? '#00f5ff' : '#c084fc');
      const label = isHatch ? 'HATCH' : 'PRISM';

      ctx.strokeStyle = tagColor;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      const sz = 24;
      ctx.strokeRect(screenX - sz, screenY - sz, sz * 2, sz * 2);

      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.fillStyle = tagColor;
      ctx.fillText('[' + label + ' #' + (idx + 1) + ' : ' + obj.state + ']', screenX - sz, screenY - sz - 6);
    }
  }
}
