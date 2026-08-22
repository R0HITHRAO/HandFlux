import { HandLandmarks } from '../types/vision';
import { GestureMetrics } from '../types/gestures';
import { VisualEffectState } from '../types/effects';

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
    state: VisualEffectState,
    options: HUDOptions,
    fps: number,
    time: number = performance.now() / 1000
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // ==========================================
    // 1. TOP-LEFT MAGENTA FPS INDICATOR
    // ==========================================
    ctx.save();
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ff00dc';
    ctx.shadowColor = '#ff00dc';
    ctx.shadowBlur = 10;
    ctx.fillText(`FPS: ${Math.round(fps)}`, 24, 42);

    // Sub-label for tracking status
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 6;
    ctx.fillText(
      hands.length > 0
        ? `HANDS DETECTED: ${hands.length} | GESTURE: ${gestures.primaryGesture}`
        : 'LOOKING FOR HANDS...',
      24,
      64
    );
    ctx.restore();

    // ==========================================
    // 2. VERTICAL GREEN INTERACTION METER (LEFT)
    // ==========================================
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
    // Meter Labels: 100 & 0
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00ff00';
    ctx.fillText('100', meterX + meterWidth + 8, meterY + 12);
    ctx.fillText('0', meterX + meterWidth + 8, meterY + meterHeight);

    // Dynamic Label
    ctx.fillStyle = '#ff00dc';
    ctx.fillText(`${meterLabel}: ${meterPercent}%`, meterX, meterY - 12);

    // Meter Background Box
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 8;
    ctx.strokeRect(meterX, meterY, meterWidth, meterHeight);

    // Inner Grid Hash Marks
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    const steps = 10;
    for (let i = 1; i < steps; i++) {
      const lineY = meterY + (meterHeight / steps) * i;
      ctx.beginPath();
      ctx.moveTo(meterX, lineY);
      ctx.lineTo(meterX + meterWidth, lineY);
      ctx.stroke();
    }

    // Active Filled Bar
    if (meterPercent > 0) {
      const fillHeight = (meterHeight * meterPercent) / 100;
      const fillY = meterY + meterHeight - fillHeight;

      ctx.fillStyle = '#00ff00';
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 12;
      ctx.fillRect(meterX + 2, fillY, meterWidth - 4, fillHeight);
    }
    ctx.restore();

    // ==========================================
    // 3. HAND TRACKING OVERLAYS
    // ==========================================
    if (hands.length === 0) {
      ctx.save();
      const cx = w * 0.5;
      const cy = h * 0.5;
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - 90, cy - 65, 180, 130);
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy);
      ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20);
      ctx.stroke();

      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff00';
      ctx.textAlign = 'center';
      ctx.fillText('[ POSITION HAND IN CAMERA FRAME ]', cx, cy + 85);
      ctx.restore();
      return;
    }

    const fingerChains = [
      [0, 1, 2, 3, 4],    // Thumb
      [0, 5, 6, 7, 8],    // Index
      [0, 9, 10, 11, 12],  // Middle
      [0, 13, 14, 15, 16], // Ring
      [0, 17, 18, 19, 20], // Pinky
      [5, 9, 13, 17, 0]    // Palm Base
    ];

    hands.forEach((hand, handIdx) => {
      // ----------------------------------------------------
      // A. BRIGHT GREEN SKELETON
      // ----------------------------------------------------
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

      // ----------------------------------------------------
      // B. RED LANDMARK POINTS (Small circular red dots)
      // ----------------------------------------------------
      if (options.showLandmarks) {
        ctx.save();
        hand.landmarks.forEach((pt) => {
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

      // ----------------------------------------------------
      // C. PRIMARY INTERACTION HIGHLIGHT (MAGENTA INDEX TIP)
      // ----------------------------------------------------
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

      // ----------------------------------------------------
      // D. PINCH INTERACTION LINE (BRIGHT MAGENTA)
      // ----------------------------------------------------
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

        const midX = (thumbTip.screenX + indexTip.screenX) * 0.5;
        const midY = (thumbTip.screenY + indexTip.screenY) * 0.5;

        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ff00dc';
        ctx.shadowColor = '#ff00dc';
        ctx.shadowBlur = 8;
        ctx.fillText(`PINCH: ${meterPercent}%`, midX + 14, midY - 6);
        ctx.restore();
      }

      // ----------------------------------------------------
      // E. HAND LABEL (#1 LEFT / #2 RIGHT) & COORDINATES
      // ----------------------------------------------------
      ctx.save();
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00ff00';
      ctx.shadowColor = '#00ff00';
      ctx.shadowBlur = 6;
      ctx.fillText(
        `#${handIdx + 1} ${hand.handedness.toUpperCase()}`,
        hand.boundingBox.minX,
        hand.boundingBox.minY - 12
      );

      if (options.showCoordinates) {
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 4;
        ctx.fillText(
          `x:${Math.round(indexTip.screenX)} y:${Math.round(indexTip.screenY)}`,
          indexTip.screenX + 16,
          indexTip.screenY + 4
        );
      }
      ctx.restore();
    });

    if (options.showGuides && hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(h1.palmCenter.screenX, h1.palmCenter.screenY);
      ctx.lineTo(h2.palmCenter.screenX, h2.palmCenter.screenY);
      ctx.stroke();
      ctx.restore();
    }
  }
}
