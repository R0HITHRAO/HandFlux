import { HandLandmarks } from '../types/vision';
import { GestureMetrics, HandGestureType } from '../types/gestures';
import { distance2D, angleBetween } from '../utils/mathUtils';

export class GestureEngine {
  private candidateGesture: HandGestureType = 'UNKNOWN';
  private candidateDuration: number = 0;
  private confirmedGesture: HandGestureType = 'UNKNOWN';
  private lastProcessTime: number = performance.now();

  public processHands(hands: HandLandmarks[], screenWidth: number, screenHeight: number): GestureMetrics {
    const now = performance.now();
    const dt = Math.max(0.001, (now - this.lastProcessTime) / 1000);
    this.lastProcessTime = now;

    if (hands.length === 0) {
      this.confirmedGesture = 'UNKNOWN';
      return {
        primaryGesture: 'UNKNOWN',
        pinchDistance: 1,
        isPinching: false,
        twoHandDistance: 0,
        twoHandAngle: 0,
        twoHandMidpoint: { x: 0.5, y: 0.5, screenX: screenWidth * 0.5, screenY: screenHeight * 0.5 },
        spread: 0,
        overallVelocity: 0
      };
    }

    const hand1 = hands[0];
    const pinchDist = distance2D(hand1.thumbTip, hand1.indexTip);
    const isPinching = pinchDist < 0.075;
    const rawGesture = this.classifySingleHand(hand1, pinchDist);

    // Temporal Gesture Filtering: Require stability for 80ms before switching
    if (rawGesture === this.candidateGesture) {
      this.candidateDuration += dt;
      if (this.candidateDuration >= 0.08) {
        this.confirmedGesture = rawGesture;
      }
    } else {
      this.candidateGesture = rawGesture;
      this.candidateDuration = 0;
    }

    let twoHandDistance = 0;
    let twoHandAngle = 0;
    let twoHandMidpoint = {
      x: hand1.palmCenter.x,
      y: hand1.palmCenter.y,
      screenX: hand1.palmCenter.screenX,
      screenY: hand1.palmCenter.screenY
    };
    let secondaryGesture: HandGestureType | undefined = undefined;

    if (hands.length >= 2) {
      const hand2 = hands[1];
      secondaryGesture = this.classifySingleHand(hand2, distance2D(hand2.thumbTip, hand2.indexTip));
      twoHandDistance = distance2D(hand1.palmCenter, hand2.palmCenter);
      twoHandAngle = angleBetween(hand1.palmCenter, hand2.palmCenter);
      twoHandMidpoint = {
        x: (hand1.palmCenter.x + hand2.palmCenter.x) * 0.5,
        y: (hand1.palmCenter.y + hand2.palmCenter.y) * 0.5,
        screenX: (hand1.palmCenter.screenX + hand2.palmCenter.screenX) * 0.5,
        screenY: (hand1.palmCenter.screenY + hand2.palmCenter.screenY) * 0.5
      };
    }

    const overallVelocity = hands.reduce((acc, h) => acc + h.velocity.speed, 0) / hands.length;
    const spread = distance2D(hand1.thumbTip, hand1.pinkyTip);

    return {
      primaryGesture: this.confirmedGesture,
      secondaryGesture,
      pinchDistance: pinchDist,
      isPinching,
      twoHandDistance,
      twoHandAngle,
      twoHandMidpoint,
      spread,
      overallVelocity
    };
  }

  private classifySingleHand(hand: HandLandmarks, pinchDist: number): HandGestureType {
    if (pinchDist < 0.075) return 'PINCH';

    const indexExtended = hand.indexTip.y < hand.landmarks[6].y;
    const middleExtended = hand.middleTip.y < hand.landmarks[10].y;
    const ringExtended = hand.ringTip.y < hand.landmarks[14].y;
    const pinkyExtended = hand.pinkyTip.y < hand.landmarks[18].y;

    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return 'POINTING';
    }
    if (indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return 'PEACE';
    }
    if (!indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      return 'FIST';
    }
    if (indexExtended && middleExtended && ringExtended && pinkyExtended) {
      return 'OPEN_PALM';
    }
    return 'UNKNOWN';
  }
}
