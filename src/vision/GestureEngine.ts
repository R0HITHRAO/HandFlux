import { HandLandmarks } from '../types/vision';
import { GestureMetrics, HandGestureType } from '../types/gestures';
import { distance2D, angleBetween } from '../utils/mathUtils';

export class GestureEngine {
  private prevPositions: Map<string, { x: number; y: number; time: number }> = new Map();

  public processHands(hands: HandLandmarks[], screenWidth: number, screenHeight: number): GestureMetrics {
    if (hands.length === 0) {
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
    const isPinching = pinchDist < 0.07;
    const hand1Gesture = this.classifySingleHand(hand1, pinchDist);

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
      primaryGesture: hand1Gesture,
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
    if (pinchDist < 0.07) return 'PINCH';

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
