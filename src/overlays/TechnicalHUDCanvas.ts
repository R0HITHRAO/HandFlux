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
    fps: number
  ): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (hands.length === 0) return;

    // 1. Two-Hand Guide Connection Line
    if (options.showGuides && hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];

      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(h1.palmCenter.screenX, h1.palmCenter.screenY);
      ctx.lineTo(h2.palmCenter.screenX, h2.palmCenter.screenY);
      ctx.stroke();

      // Midpoint reticle
      const mid = gestures.twoHandMidpoint;
      ctx.strokeStyle = 'rgba(0, 210, 255, 0.8)';
      ctx.setLineDash([]);
      ctx.strokeRect(mid.screenX - 8, mid.screenY - 8, 16, 16);

      // Distance tag
      ctx.fillStyle = 'rgba(0, 210, 255, 0.85)';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(
        `SPAN: ${(gestures.twoHandDistance * 100).toFixed(1)}cm  Î¸: ${(gestures.twoHandAngle * (180 / Math.PI)).toFixed(0)}Â°`,
        mid.screenX + 12,
        mid.screenY - 4
      );
      ctx.restore();
    }

    // 2. Render Hand Overlays
    hands.forEach((hand, handIdx) => {
      // Guide Lines & Crosshairs
      if (options.showGuides) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 0.8;

        // Horizontal and vertical guide lines through index tip
        const it = hand.indexTip;
        ctx.beginPath();
        ctx.moveTo(0, it.screenY);
        ctx.lineTo(w, it.screenY);
        ctx.moveTo(it.screenX, 0);
        ctx.lineTo(it.screenX, h);
        ctx.stroke();
        ctx.restore();
      }

      // Skeleton Guide Lines
      if (options.showLandmarks) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 1.0;

        // Finger chains: [0,1,2,3,4], [0,5,6,7,8], [0,9,10,11,12], [0,13,14,15,16], [0,17,18,19,20]
        const chains = [
          [0, 1, 2, 3, 4],
          [0, 5, 6, 7, 8],
          [0, 9, 10, 11, 12],
          [0, 13, 14, 15, 16],
          [0, 17, 18, 19, 20],
          [5, 9, 13, 17, 0] // Palm loop
        ];

        chains.forEach(chain => {
          ctx.beginPath();
          chain.forEach((idx, i) => {
            const pt = hand.landmarks[idx];
            if (i === 0) ctx.moveTo(pt.screenX, pt.screenY);
            else ctx.lineTo(pt.screenX, pt.screenY);
          });
          ctx.stroke();
        });

        // Small landmark tracking markers
        hand.landmarks.forEach((pt, idx) => {
          ctx.fillStyle = (idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20)
            ? 'rgba(236, 72, 153, 0.9)' // Fingertips in Magenta
            : 'rgba(255, 255, 255, 0.8)';
          ctx.fillRect(pt.screenX - 2, pt.screenY - 2, 4, 4);
        });
        ctx.restore();
      }

      // Reticles & Corner Brackets on Hand Bounds
      if (options.showBoundingBox) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.0;
        const b = hand.boundingBox;
        const cornerLen = 14;

        // 4 Corner brackets
        // Top-Left
        ctx.beginPath();
        ctx.moveTo(b.minX, b.minY + cornerLen);
        ctx.lineTo(b.minX, b.minY);
        ctx.lineTo(b.minX + cornerLen, b.minY);
        // Top-Right
        ctx.moveTo(b.maxX - cornerLen, b.minY);
        ctx.lineTo(b.maxX, b.minY);
        ctx.lineTo(b.maxX, b.minY + cornerLen);
        // Bottom-Left
        ctx.moveTo(b.minX, b.maxY - cornerLen);
        ctx.lineTo(b.minX, b.maxY);
        ctx.lineTo(b.minX + cornerLen, b.maxY);
        // Bottom-Right
        ctx.moveTo(b.maxX - cornerLen, b.maxY);
        ctx.lineTo(b.maxX, b.maxY);
        ctx.lineTo(b.maxX, b.maxY - cornerLen);
        ctx.stroke();
        ctx.restore();
      }

      // Live Technical Coordinate Labels (x: ### y: ###)
      if (options.showCoordinates) {
        ctx.save();
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';

        // Label key points: indexTip, thumbTip, wrist, palmCenter
        const keyPoints = [
          { pt: hand.indexTip, tag: 'IDX' },
          { pt: hand.thumbTip, tag: 'THB' },
          { pt: hand.wrist, tag: 'WST' },
          { pt: hand.palmCenter, tag: 'CTR' }
        ];

        keyPoints.forEach(({ pt, tag }) => {
          const xVal = Math.round(pt.screenX);
          const yVal = Math.round(pt.screenY);

          // Small crosshair
          ctx.strokeStyle = 'rgba(0, 210, 255, 0.7)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pt.screenX - 4, pt.screenY);
          ctx.lineTo(pt.screenX + 4, pt.screenY);
          ctx.moveTo(pt.screenX, pt.screenY - 4);
          ctx.lineTo(pt.screenX, pt.screenY + 4);
          ctx.stroke();

          // Coordinate readout
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(`x:${xVal} y:${yVal}`, pt.screenX + 7, pt.screenY - 5);
        });

        // Hand summary tag
        ctx.fillStyle = 'rgba(168, 85, 247, 0.9)';
        ctx.fillText(
          `[#${handIdx + 1} ${hand.handedness.toUpperCase()} / V:${(hand.velocity.speed * 100).toFixed(0)}]`,
          hand.boundingBox.minX,
          hand.boundingBox.minY - 8
        );
        ctx.restore();
      }
    });
  }
}
