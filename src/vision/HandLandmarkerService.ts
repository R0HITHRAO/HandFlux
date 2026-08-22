import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmarks, Landmark2D } from '../types/vision';
import { LandmarkFilterSet } from './OneEuroFilter';

export class HandLandmarkerService {
  private handLandmarker: HandLandmarker | null = null;
  private isLoaded: boolean = false;
  private filterSets: Map<string, LandmarkFilterSet> = new Map();
  private prevLandmarks: Map<string, Landmark2D[]> = new Map();
  private prevTime: number = 0;

  public async initialize(): Promise<void> {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.isLoaded = true;
      console.log('MediaPipe HandLandmarker initialized successfully.');
    } catch (err) {
      console.warn('Failed to load MediaPipe from CDN/GPU, will fallback to synthetic or CPU:', err);
      this.isLoaded = false;
    }
  }

  public detectHands(
    video: HTMLVideoElement,
    timestamp: number,
    screenWidth: number,
    screenHeight: number
  ): HandLandmarks[] {
    if (!this.isLoaded || !this.handLandmarker || video.readyState < 2) {
      return [];
    }

    try {
      const result = this.handLandmarker.detectForVideo(video, timestamp);
      if (!result || !result.landmarks || result.landmarks.length === 0) {
        return [];
      }

      const hands: HandLandmarks[] = [];

      for (let i = 0; i < result.landmarks.length; i++) {
        const rawPoints = result.landmarks[i];
        const handednessInfo = result.handedness && result.handedness[i] ? result.handedness[i][0] : null;
        const handedness = (handednessInfo?.categoryName === 'Left') ? 'Left' : 'Right';
        const id = handedness + '-' + i;

        if (!this.filterSets.has(id)) {
          this.filterSets.set(id, new LandmarkFilterSet(21, 1.2, 0.008));
        }
        const filterSet = this.filterSets.get(id)!;

        // MediaPipe coordinates are normalized 0..1.
        // For mirrored view: x_mirrored = 1.0 - raw.x
        const landmarks: Landmark2D[] = rawPoints.map((pt, idx) => {
          const mirroredNormX = 1.0 - pt.x;
          const normY = pt.y;
          const filtered = filterSet.filterPoint(idx, mirroredNormX, normY, timestamp);

          return {
            x: filtered.x,
            y: filtered.y,
            z: pt.z,
            screenX: filtered.x * screenWidth,
            screenY: filtered.y * screenHeight
          };
        });

        // Compute Bounding Box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        landmarks.forEach(p => {
          if (p.screenX < minX) minX = p.screenX;
          if (p.screenY < minY) minY = p.screenY;
          if (p.screenX > maxX) maxX = p.screenX;
          if (p.screenY > maxY) maxY = p.screenY;
        });

        // Compute Velocity
        let vx = 0, vy = 0, speed = 0;
        const prev = this.prevLandmarks.get(id);
        const dt = Math.max((timestamp - this.prevTime) / 1000.0, 0.001);
        if (prev && prev.length === landmarks.length) {
          const dx = landmarks[0].x - prev[0].x;
          const dy = landmarks[0].y - prev[0].y;
          vx = dx / dt;
          vy = dy / dt;
          speed = Math.sqrt(vx * vx + vy * vy);
        }
        this.prevLandmarks.set(id, landmarks);

        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];
        const palmCenter: Landmark2D = {
          x: (wrist.x + landmarks[9].x) * 0.5,
          y: (wrist.y + landmarks[9].y) * 0.5,
          screenX: (wrist.screenX + landmarks[9].screenX) * 0.5,
          screenY: (wrist.screenY + landmarks[9].screenY) * 0.5
        };

        hands.push({
          id,
          handedness,
          score: handednessInfo?.score || 0.9,
          landmarks,
          wrist,
          thumbTip,
          indexTip,
          middleTip,
          ringTip,
          pinkyTip,
          palmCenter,
          boundingBox: {
            minX,
            minY,
            maxX,
            maxY,
            width: maxX - minX,
            height: maxY - minY
          },
          velocity: { vx, vy, speed }
        });
      }

      this.prevTime = timestamp;
      return hands;
    } catch (e) {
      console.warn('MediaPipe frame processing error:', e);
      return [];
    }
  }

  public getIsLoaded(): boolean {
    return this.isLoaded;
  }
}
