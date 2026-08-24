import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmarks, Landmark2D } from '../types/vision';
import { LandmarkFilterSet } from './OneEuroFilter';

export class HandLandmarkerService {
  private handLandmarker: HandLandmarker | null = null;
  private isLoaded: boolean = false;
  private filterSets: Map<string, LandmarkFilterSet> = new Map();
  private prevLandmarks: Map<string, Landmark2D[]> = new Map();
  private prevTime: number = 0;

  // Fast Offscreen Downscale Canvas (480x270) to accelerate GPU texture transfer by 4x
  private procCanvas: HTMLCanvasElement | null = null;
  private procCtx: CanvasRenderingContext2D | null = null;
  private procWidth: number = 480;
  private procHeight: number = 270;

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

      this.procCanvas = document.createElement('canvas');
      this.procCanvas.width = this.procWidth;
      this.procCanvas.height = this.procHeight;
      this.procCtx = this.procCanvas.getContext('2d', { alpha: false, willReadFrequently: false });

      this.isLoaded = true;
      console.log('High-Efficiency MediaPipe HandLandmarker Initialized.');
    } catch (err) {
      console.warn('MediaPipe initialization fallback:', err);
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
      // Fast downscale frame transfer
      let sourceTarget: HTMLVideoElement | HTMLCanvasElement = video;
      if (this.procCanvas && this.procCtx) {
        this.procCtx.drawImage(video, 0, 0, this.procWidth, this.procHeight);
        sourceTarget = this.procCanvas;
      }

      const result = this.handLandmarker.detectForVideo(sourceTarget, timestamp);
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

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        const landmarks: Landmark2D[] = new Array(rawPoints.length);
        for (let idx = 0; idx < rawPoints.length; idx++) {
          const pt = rawPoints[idx];
          const mirroredNormX = 1.0 - pt.x;
          const normY = pt.y;
          const filtered = filterSet.filterPoint(idx, mirroredNormX, normY, timestamp);
          const screenX = filtered.x * screenWidth;
          const screenY = filtered.y * screenHeight;

          if (screenX < minX) minX = screenX;
          if (screenY < minY) minY = screenY;
          if (screenX > maxX) maxX = screenX;
          if (screenY > maxY) maxY = screenY;

          landmarks[idx] = {
            x: filtered.x,
            y: filtered.y,
            z: pt.z,
            screenX,
            screenY
          };
        }

        // Fast Velocity Calculation
        let vx = 0, vy = 0, speed = 0;
        const prev = this.prevLandmarks.get(id);
        const dt = Math.max((timestamp - this.prevTime) * 0.001, 0.001);
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
      console.warn('MediaPipe fast detect error:', e);
      return [];
    }
  }

  public getIsLoaded(): boolean {
    return this.isLoaded;
  }
}
