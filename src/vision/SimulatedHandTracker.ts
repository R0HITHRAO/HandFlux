import { HandLandmarks, Landmark2D } from '../types/vision';

export class SimulatedHandTracker {
  private startTime: number = performance.now();

  public getSimulatedHands(width: number, height: number): HandLandmarks[] {
    const elapsed = (performance.now() - this.startTime) / 1000.0;
    
    // Animate two hands naturally in screen coordinates
    // Left hand (screen-space left / user right)
    const h1BaseX = 0.32 + Math.sin(elapsed * 0.8) * 0.08;
    const h1BaseY = 0.52 + Math.cos(elapsed * 1.1) * 0.06;
    
    // Right hand (screen-space right / user left)
    const h2BaseX = 0.68 + Math.sin(elapsed * 0.8 + Math.PI) * 0.08;
    const h2BaseY = 0.52 + Math.sin(elapsed * 0.9) * 0.06;

    const hand1 = this.buildSyntheticHand('sim-1', 'Left', h1BaseX, h1BaseY, width, height, elapsed);
    const hand2 = this.buildSyntheticHand('sim-2', 'Right', h2BaseX, h2BaseY, width, height, elapsed + 1.5);

    return [hand1, hand2];
  }

  private buildSyntheticHand(
    id: string,
    handedness: 'Left' | 'Right',
    cx: number,
    cy: number,
    width: number,
    height: number,
    t: number
  ): HandLandmarks {
    const landmarks: Landmark2D[] = [];
    const isRight = handedness === 'Right';
    const sideSign = isRight ? 1 : -1;

    // Wrist
    const wx = cx;
    const wy = cy + 0.12;

    // Relative finger offsets
    const fingerSpreads = [
      { name: 'thumb', ox: -0.06 * sideSign, oy: -0.03, len: 0.08 },
      { name: 'index', ox: -0.03 * sideSign, oy: -0.09, len: 0.11 },
      { name: 'middle', ox: 0.0, oy: -0.11, len: 0.12 },
      { name: 'ring', ox: 0.03 * sideSign, oy: -0.09, len: 0.10 },
      { name: 'pinky', ox: 0.06 * sideSign, oy: -0.06, len: 0.08 }
    ];

    // Landmark 0: Wrist
    landmarks.push({ x: wx, y: wy, screenX: wx * width, screenY: wy * height });

    // Build 4 joints per finger
    fingerSpreads.forEach((f) => {
      for (let j = 1; j <= 4; j++) {
        const factor = j / 4.0;
        const wiggle = Math.sin(t * 2 + j) * 0.005;
        const jx = cx + f.ox * factor + wiggle;
        const jy = wy + (f.oy * factor) + wiggle;
        landmarks.push({
          x: jx,
          y: jy,
          screenX: jx * width,
          screenY: jy * height
        });
      }
    });

    const wrist = landmarks[0];
    const thumbTip = landmarks[4];
    const indexTip = landmarks[8];
    const middleTip = landmarks[12];
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    const palmCenter: Landmark2D = {
      x: cx,
      y: cy,
      screenX: cx * width,
      screenY: cy * height
    };

    return {
      id,
      handedness,
      score: 0.98,
      landmarks,
      wrist,
      thumbTip,
      indexTip,
      middleTip,
      ringTip,
      pinkyTip,
      palmCenter,
      boundingBox: {
        minX: (cx - 0.1) * width,
        minY: (cy - 0.14) * height,
        maxX: (cx + 0.1) * width,
        maxY: (cy + 0.14) * height,
        width: 0.2 * width,
        height: 0.28 * height
      },
      velocity: {
        vx: Math.cos(t * 0.8) * 0.05,
        vy: -Math.sin(t * 1.1) * 0.05,
        speed: 0.05
      }
    };
  }
}
