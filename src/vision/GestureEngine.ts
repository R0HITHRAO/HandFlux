import { HandLandmarks } from '../types/vision';
import { GestureMetrics, GestureType, GestureEvent } from '../types/gestures';

export class GestureEngine {
  private pinchThreshold: number = 65.0;
  private swipeHistory: { x: number; y: number; time: number }[] = [];
  private lastSwipeTime: number = 0;
  private swipeCooldownMs: number = 600;
  private listeners: ((event: GestureEvent) => void)[] = [];

  public addEventListener(listener: (event: GestureEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emitEvent(event: GestureEvent): void {
    for (let i = 0; i < this.listeners.length; i++) {
      this.listeners[i](event);
    }
  }

  public setPinchThreshold(val: number): void {
    this.pinchThreshold = val;
  }

  public processHands(
    hands: HandLandmarks[],
    screenWidth: number,
    screenHeight: number,
    timestamp: number = performance.now()
  ): GestureMetrics {
    if (hands.length === 0) {
      this.swipeHistory = [];
      return {
        primaryGesture: 'NONE',
        isPinching: false,
        isPointing: false,
        isOpenPalm: false,
        isFist: false,
        pinchDistance: 1.0,
        spread: 0,
        pointerPosition: { screenX: screenWidth * 0.5, screenY: screenHeight * 0.5 },
        twoHandDistance: 0,
        twoHandAngle: 0,
        twoHandMidpoint: { screenX: screenWidth * 0.5, screenY: screenHeight * 0.5 },
        swipeDirection: 'NONE',
        swipeVelocity: 0
      };
    }

    const h1 = hands[0];
    const thumbTip = h1.thumbTip;
    const indexTip = h1.indexTip;
    const middleTip = h1.middleTip;
    const ringTip = h1.ringTip;
    const pinkyTip = h1.pinkyTip;
    const wrist = h1.wrist;

    // 1. Pinch Detection (Squared Euclidean distance)
    const dxP = thumbTip.screenX - indexTip.screenX;
    const dyP = thumbTip.screenY - indexTip.screenY;
    const pinchDistSq = dxP * dxP + dyP * dyP;
    const pinchDistance = Math.sqrt(pinchDistSq);
    const isPinching = pinchDistance < this.pinchThreshold;

    // 2. Point Detection (Index extended, others curled)
    const dIndexWrist = Math.hypot(indexTip.screenX - wrist.screenX, indexTip.screenY - wrist.screenY);
    const dMiddleWrist = Math.hypot(middleTip.screenX - wrist.screenX, middleTip.screenY - wrist.screenY);
    const dRingWrist = Math.hypot(ringTip.screenX - wrist.screenX, ringTip.screenY - wrist.screenY);
    const isPointing = dIndexWrist > 110 && dMiddleWrist < dIndexWrist * 0.75 && !isPinching;

    // 3. Open Palm vs Fist
    const spread = Math.hypot(pinkyTip.screenX - thumbTip.screenX, pinkyTip.screenY - thumbTip.screenY) / Math.max(1, h1.boundingBox.width);
    const isOpenPalm = spread > 0.85 && dIndexWrist > 100 && dMiddleWrist > 100;
    const isFist = spread < 0.45 && dIndexWrist < 85 && dMiddleWrist < 85 && !isPinching;

    // 4. Swipe Detection with Velocity Buffer
    this.swipeHistory.push({ x: indexTip.screenX, y: indexTip.screenY, time: timestamp });
    if (this.swipeHistory.length > 10) this.swipeHistory.shift();

    let swipeDirection: 'LEFT' | 'RIGHT' | 'NONE' = 'NONE';
    let swipeVelocity = 0;

    if (this.swipeHistory.length >= 4 && (timestamp - this.lastSwipeTime) > this.swipeCooldownMs) {
      const first = this.swipeHistory[0];
      const last = this.swipeHistory[this.swipeHistory.length - 1];
      const dtSec = Math.max(0.05, (last.time - first.time) * 0.001);
      const dx = last.x - first.x;
      swipeVelocity = Math.abs(dx) / dtSec;

      if (Math.abs(dx) > 130 && swipeVelocity > 450) {
        swipeDirection = dx < 0 ? 'LEFT' : 'RIGHT';
        this.lastSwipeTime = timestamp;
        this.emitEvent({
          type: swipeDirection === 'LEFT' ? 'SWIPE_LEFT' : 'SWIPE_RIGHT',
          timestamp,
          confidence: 0.92,
          swipeVelocity
        });
      }
    }

    // 5. Two-Hand Distance & Orientation
    let twoHandDistance = 0;
    let twoHandAngle = 0;
    let twoHandMidpoint = { screenX: indexTip.screenX, screenY: indexTip.screenY };

    if (hands.length >= 2) {
      const h2 = hands[1];
      const dx2 = (h2.indexTip.screenX - h1.indexTip.screenX) / screenWidth;
      const dy2 = (h2.indexTip.screenY - h1.indexTip.screenY) / screenHeight;
      twoHandDistance = Math.hypot(dx2, dy2);
      twoHandAngle = Math.atan2(h2.indexTip.screenY - h1.indexTip.screenY, h2.indexTip.screenX - h1.indexTip.screenX);
      twoHandMidpoint = {
        screenX: (h1.indexTip.screenX + h2.indexTip.screenX) * 0.5,
        screenY: (h1.indexTip.screenY + h2.indexTip.screenY) * 0.5
      };
    }

    // Determine Primary Gesture
    let primaryGesture: GestureType = 'NONE';
    if (hands.length >= 2 && Math.abs(twoHandDistance) > 0.15) {
      primaryGesture = 'TWO_HAND_SCALE';
    } else if (isPinching) {
      primaryGesture = 'PINCH';
    } else if (isPointing) {
      primaryGesture = 'POINT';
    } else if (isOpenPalm) {
      primaryGesture = 'OPEN_PALM';
    } else if (isFist) {
      primaryGesture = 'FIST';
    }

    return {
      primaryGesture,
      isPinching,
      isPointing,
      isOpenPalm,
      isFist,
      pinchDistance: pinchDistance / Math.max(1, screenWidth),
      spread,
      pointerPosition: { screenX: indexTip.screenX, screenY: indexTip.screenY },
      twoHandDistance,
      twoHandAngle,
      twoHandMidpoint,
      swipeDirection,
      swipeVelocity
    };
  }
}
