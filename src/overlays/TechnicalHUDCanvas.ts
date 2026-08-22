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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
}

export class TechnicalHUDCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];

  private fingerColors = [
    '#facc15', // Thumb: Gold
    '#00f5ff', // Index: Neon Cyan
    '#22c55e', // Middle: Lime Green
    '#ec4899', // Ring: Hot Pink
    '#a855f7'  // Pinky: Purple
  ];

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

    this.updateParticles(ctx);

    if (hands.length === 0) {
      ctx.save();
      const cx = w * 0.5;
      const cy = h * 0.5;
      
      const pulse = 1.0 + Math.sin(time * 3.0) * 0.05;
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.6)';
      ctx.lineWidth = 1.5;
      
      const rw = 160 * pulse;
      const rh = 120 * pulse;
      ctx.strokeRect(cx - rw * 0.5, cy - rh * 0.5, rw, rh);

      ctx.beginPath();
      ctx.moveTo(cx - 20, cy); ctx.lineTo(cx + 20, cy);
      ctx.moveTo(cx, cy - 20); ctx.lineTo(cx, cy + 20);
      ctx.stroke();

      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillStyle = '#00f5ff';
      ctx.textAlign = 'center';
      ctx.fillText('[ POSITION HANDS IN CAMERA FRAME ]', cx, cy + rh * 0.5 + 28);
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('Live AR geometries and neon coordinate tags will track your fingers', cx, cy + rh * 0.5 + 46);
      ctx.restore();
      return;
    }

    if (options.showGuides && hands.length >= 2) {
      const h1 = hands[0];
      const h2 = hands[1];

      ctx.save();
      const grad = ctx.createLinearGradient(h1.palmCenter.screenX, h1.palmCenter.screenY, h2.palmCenter.screenX, h2.palmCenter.screenY);
      grad.addColorStop(0, '#00f5ff');
      grad.addColorStop(0.5, '#ec4899');
      grad.addColorStop(1, '#a855f7');
      
      ctx.strokeStyle = grad;
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2.0;

      ctx.beginPath();
      ctx.moveTo(h1.palmCenter.screenX, h1.palmCenter.screenY);
      ctx.lineTo(h2.palmCenter.screenX, h2.palmCenter.screenY);
      ctx.stroke();

      const mid = gestures.twoHandMidpoint;
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
      ctx.strokeStyle = '#00f5ff';
      ctx.lineWidth = 1;
      ctx.fillRect(mid.screenX - 70, mid.screenY - 18, 140, 28);
      ctx.strokeRect(mid.screenX - 70, mid.screenY - 18, 140, 28);

      ctx.fillStyle = '#00f5ff';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `SPAN: ${(gestures.twoHandDistance * 100).toFixed(1)}cm | θ: ${(gestures.twoHandAngle * (180 / Math.PI)).toFixed(0)}°`,
        mid.screenX,
        mid.screenY
      );
      ctx.restore();
    }

    hands.forEach((hand, handIdx) => {
      const speed = hand.velocity.speed;
      if (speed > 0.02) {
        [hand.thumbTip, hand.indexTip, hand.middleTip, hand.ringTip, hand.pinkyTip].forEach((tip, idx) => {
          this.spawnParticle(tip.screenX, tip.screenY, this.fingerColors[idx]);
        });
      }

      if (options.showGuides) {
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 245, 255, 0.3)';
        ctx.lineWidth = 1.0;

        const it = hand.indexTip;
        ctx.beginPath();
        ctx.moveTo(0, it.screenY); ctx.lineTo(w, it.screenY);
        ctx.moveTo(it.screenX, 0); ctx.lineTo(it.screenX, h);
        ctx.stroke();
        ctx.restore();
      }

      if (options.showLandmarks) {
        ctx.save();
        
        const fingerChains = [
          [0, 1, 2, 3, 4],
          [0, 5, 6, 7, 8],
          [0, 9, 10, 11, 12],
          [0, 13, 14, 15, 16],
          [0, 17, 18, 19, 20]
        ];

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(hand.landmarks[5].screenX, hand.landmarks[5].screenY);
        ctx.lineTo(hand.landmarks[9].screenX, hand.landmarks[9].screenY);
        ctx.lineTo(hand.landmarks[13].screenX, hand.landmarks[13].screenY);
        ctx.lineTo(hand.landmarks[17].screenX, hand.landmarks[17].screenY);
        ctx.lineTo(hand.landmarks[0].screenX, hand.landmarks[0].screenY);
        ctx.closePath();
        ctx.stroke();

        fingerChains.forEach((chain, fIdx) => {
          const color = this.fingerColors[fIdx];
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = color;
          ctx.shadowBlur = 8;

          ctx.beginPath();
          chain.forEach((ptIdx, i) => {
            const pt = hand.landmarks[ptIdx];
            if (i === 0) ctx.moveTo(pt.screenX, pt.screenY);
            else ctx.lineTo(pt.screenX, pt.screenY);
          });
          ctx.stroke();
        });

        hand.landmarks.forEach((pt, idx) => {
          const isTip = (idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20);
          const fIdx = idx === 4 ? 0 : idx === 8 ? 1 : idx === 12 ? 2 : idx === 16 ? 3 : idx === 20 ? 4 : -1;
          const color = fIdx >= 0 ? this.fingerColors[fIdx] : '#ffffff';

          ctx.fillStyle = color;
          ctx.shadowColor = color;
          ctx.shadowBlur = isTip ? 12 : 4;

          const size = isTip ? 6 : 3.5;
          ctx.fillRect(pt.screenX - size * 0.5, pt.screenY - size * 0.5, size, size);
        });

        ctx.restore();
      }

      if (options.showBoundingBox) {
        ctx.save();
        const b = hand.boundingBox;
        ctx.strokeStyle = handIdx === 0 ? '#00f5ff' : '#ec4899';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 6;

        const cLen = 16;
        ctx.beginPath();
        ctx.moveTo(b.minX, b.minY + cLen); ctx.lineTo(b.minX, b.minY); ctx.lineTo(b.minX + cLen, b.minY);
        ctx.moveTo(b.maxX - cLen, b.minY); ctx.lineTo(b.maxX, b.minY); ctx.lineTo(b.maxX, b.minY + cLen);
        ctx.moveTo(b.minX, b.maxY - cLen); ctx.lineTo(b.minX, b.maxY); ctx.lineTo(b.minX + cLen, b.maxY);
        ctx.moveTo(b.maxX - cLen, b.maxY); ctx.lineTo(b.maxX, b.maxY); ctx.lineTo(b.maxX, b.maxY - cLen);
        ctx.stroke();
        ctx.restore();
      }

      if (options.showCoordinates) {
        ctx.save();
        ctx.font = '10px "JetBrains Mono", monospace';

        const keyPoints = [
          { pt: hand.indexTip, tag: 'IDX', col: '#00f5ff' },
          { pt: hand.thumbTip, tag: 'THB', col: '#facc15' },
          { pt: hand.wrist, tag: 'WST', col: '#a855f7' },
          { pt: hand.palmCenter, tag: 'CTR', col: '#ec4899' }
        ];

        keyPoints.forEach(({ pt, tag, col }) => {
          const xVal = Math.round(pt.screenX);
          const yVal = Math.round(pt.screenY);

          ctx.strokeStyle = col;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(pt.screenX - 5, pt.screenY); ctx.lineTo(pt.screenX + 5, pt.screenY);
          ctx.moveTo(pt.screenX, pt.screenY - 5); ctx.lineTo(pt.screenX + 5, pt.screenY);
          ctx.stroke();

          ctx.fillStyle = 'rgba(5, 5, 12, 0.85)';
          ctx.strokeStyle = col;
          ctx.fillRect(pt.screenX + 8, pt.screenY - 14, 86, 16);
          ctx.strokeRect(pt.screenX + 8, pt.screenY - 14, 86, 16);

          ctx.fillStyle = col;
          ctx.fillText(`${tag}: ${xVal},${yVal}`, pt.screenX + 12, pt.screenY - 2);
        });

        ctx.fillStyle = '#00f5ff';
        ctx.fillText(
          `[HAND #${handIdx + 1} ${hand.handedness.toUpperCase()} | SPEED: ${(hand.velocity.speed * 100).toFixed(0)}]`,
          hand.boundingBox.minX,
          hand.boundingBox.minY - 8
        );
        ctx.restore();
      }
    });
  }

  private spawnParticle(x: number, y: number, color: string): void {
    if (this.particles.length > 150) return;
    this.particles.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: (Math.random() - 0.5) * 2.5,
      vy: (Math.random() - 0.5) * 2.5 - 1.0,
      size: Math.random() * 4 + 2,
      color,
      alpha: 1.0,
      life: 0
    });
  }

  private updateParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.035;
      p.life++;

      if (p.alpha <= 0 || p.life > 35) {
        this.particles.splice(i, 1);
        continue;
      }

      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();
  }
}
