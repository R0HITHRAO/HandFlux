export interface Landmark2D {
  x: number; // 0 to 1 (normalized, mirrored)
  y: number; // 0 to 1 (normalized)
  z?: number;
  screenX: number; // in pixels
  screenY: number; // in pixels
}

export interface HandLandmarks {
  id: string;
  handedness: 'Left' | 'Right';
  score: number;
  landmarks: Landmark2D[]; // 21 landmarks
  wrist: Landmark2D;
  thumbTip: Landmark2D;
  indexTip: Landmark2D;
  middleTip: Landmark2D;
  ringTip: Landmark2D;
  pinkyTip: Landmark2D;
  palmCenter: Landmark2D;
  boundingBox: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  velocity: {
    vx: number;
    vy: number;
    speed: number;
  };
}

export interface FrameTrackingData {
  timestamp: number;
  hands: HandLandmarks[];
  handCount: number;
  isSimulated: boolean;
  fps: number;
  visionLatencyMs: number;
}
