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

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
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
    fps: number,
    time: number = performance.now() / 1000
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 1. TOP-LEFT MAGENTA FPS & ACTIVE TOOL
    ctx.save();
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ff00dc';
    ctx.shadowColor = '#ff00dc';
    ctx.shadowBlur = 10;
    ctx.fillText('FPS: ' + Math.round(fps), 24, 42);

    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 6;
    const toolName = EFFECT_CONFIGS[activeTool]?.name || 'NONE';
    ctx.fillText('TOOL: ' + toolName + ' | OBJECTS: ' + objects.length + '/5', 24, 64);
    ctx.restore();

    // 2. VERTICAL GREEN INTERACTION METER (LEFT)
    const meterX = 24;
    const meterY = 100;
    const meterWidth = 18;
    const meterHeight = Math.min(340, h - 220);

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

    ctx.save();
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('100', meterX + meterWidth + 8, meterY + 12);
    ctx.fillText('0', meterX + meterWidth + 8, meterY + meterHeight);

    ctx.fillStyle = '#ff00dc';
    ctx.fillText(meterLabel + ': ' + meterPercent + '%', meterX, meterY - 12);

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 8;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

    const steps = 10;
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    for (let i = 1; i < steps; i++) {
      const lineY = meterY + (meterHeight / steps) * i;
      ctx.beginPath();
      ctx.moveTo(meterX, lineY);
      ctx.lineTo(meterX + meterWidth, lineY);
      ctx.stroke();
    }

    if (meterPercent > 0) {
      const fillHeight = (meterHeight * meterPercent) / 100;
      const fillY = meterY + meterHeight - fillHeight;
      ctx.fillStyle = '#00ff00';
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 12;
      ctx.fillRect(meterX + 2, fillY, meterWidth - 4, fillHeight);
    }
    ctx.restore();

    // 3. HAND TRACKING OVERLAYS (EXACT REFERENCE)
    if (hands.length === 0) {
      return; // Do not show any confusing center box
    }

    const fingerChains = [
      [0, 1, 2, 3, 4],
      [0, 5, 6, 7, 8],
      [0, 9, 10, 11, 12],
      [0, 13, 14, 15, 16],
      [0, 17, 18, 19, 20],
      [5, 9, 13, 17, 0]
    ];

    hands.forEach((hand, handIdx) => {
      // Green Skeleton
      if (options.showLandmarks) {
        ctx.save();
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3.0;
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        fingerChains.forEach(chain => {
          ctx.beginPath();
          chain.forEach((idx, i) => {
            const pt = hand.landmarks[idx];
            if (i === 0) ctx.moveTo(pt.screenX, pt.screenY);
            else ctx.lineTo(pt.screenX, pt.screenY);
          });
          ctx.stroke();
        });
        ctx.restore();
      }

      // Red Landmarks
      if (options.showLandmarks) {
        ctx.save();
        hand.landmarks.forEach(pt => {
          ctx.beginPath();
          ctx.arc(pt.screenX, pt.screenY, 4.0, 0, Math.PI * 2);
          ctx.fillStyle = '#ff2828';
          ctx.shadowColor = '#ff2828';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.0;
          ctx.stroke();
        });
        ctx.restore();
      }

      // Primary Interaction Point on Index Tip
      const indexTip = hand.indexTip;
      const thumbTip = hand.thumbTip;

      ctx.save();
      ctx.beginPath();
      ctx.arc(indexTip.screenX, indexTip.screenY, 8.0, 0, Math.PI * 2);
      ctx.fillStyle = '#ff00dc';
      ctx.shadowColor = '#ff00dc';
      ctx.shadowBlur = 14;
      ctx.fill();

      const ringPulse = 12.0 + Math.sin(time * 6.0) * 3.0;
      ctx.beginPath();
      ctx.arc(indexTip.screenX, indexTip.screenY, ringPulse, 0, Math.PI * 2);
      ctx.strokeStyle = '#ff00dc';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      // Magenta Pinch Line
      const pinchDist = Math.hypot(thumbTip.screenX - indexTip.screenX, thumbTip.screenY - indexTip.screenY);
      const isPinchActive = pinchDist < 75;

      if (isPinchActive) {
        ctx.save();
        ctx.strokeStyle = '#ff00dc';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = '#ff00dc';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.moveTo(thumbTip.screenX, thumbTip.screenY);
        ctx.lineTo(indexTip.screenX, indexTip.screenY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(thumbTip.screenX, thumbTip.screenY, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff00dc';
        ctx.fill();

        // Radial Pinch-to-Create Progress Ring
        if (creationHoldProgress > 0.05 && activeTool !== VisualEffectState.NONE && activeTool !== VisualEffectState.THERMAL) {
          const midX = (thumbTip.screenX + indexTip.screenX) * 0.5;
          const midY = (thumbTip.screenY + indexTip.screenY) * 0.5;

          ctx.beginPath();
          ctx.arc(midX, midY, 26, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * creationHoldProgress);
          ctx.strokeStyle = '#00f5ff';
          ctx.lineWidth = 3.5;
          ctx.stroke();

          ctx.font = 'bold 11px "JetBrains Mono", monospace';
          ctx.fillStyle = '#00f5ff';
          ctx.textAlign = 'center';
          ctx.fillText('HOLD TO CREATE ' + (EFFECT_CONFIGS[activeTool]?.name || 'OBJ'), midX, midY - 32);
        }
        ctx.restore();
      }

      // Hand Label (#1 LEFT / #2 RIGHT) & Coordinates
      ctx.save();
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff00';
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 6;
      ctx.fillText(
        '#' + (handIdx + 1) + ' ' + hand.handedness.toUpperCase(),
        hand.boundingBox.minX,
        hand.boundingBox.minY - 12
      );

      if (options.showCoordinates) {
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 4;
        ctx.fillText(
          'x:' + Math.round(indexTip.screenX) + ' y:' + Math.round(indexTip.screenY),
          indexTip.screenX + 16,
          indexTip.screenY + 4
        );
      }
      ctx.restore();
    });

    // 4. ACTIVE OBJECT SELECTION BRACKETS
    objects.forEach(obj => {
      const isSelected = obj.id === selectedObjId;
      const screenX = (obj.position.x / (w / h * 2 * Math.tan(Math.PI / 6) * 5) + 0.5) * w;
      const screenY = (0.5 - obj.position.y / (2 * Math.tan(Math.PI / 6) * 5)) * h;

      ctx.save();
      ctx.strokeStyle = isSelected ? '#ff00dc' : 'rgba(0, 245, 255, 0.6)';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.shadowColor = isSelected ? '#ff00dc' : '#00f5ff';
      ctx.shadowBlur = isSelected ? 12 : 6;

      const sz = 24;
      ctx.strokeRect(screenX - sz, screenY - sz, sz * 2, sz * 2);

      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = isSelected ? '#ff00dc' : '#00f5ff';
      ctx.fillText('[' + (EFFECT_CONFIGS[obj.type]?.name || 'OBJ') + ']', screenX - sz, screenY - sz - 6);
      ctx.restore();
    });
  }
}
