export type HandGestureType = 
  | 'UNKNOWN'
  | 'OPEN_PALM'
  | 'POINTING'
  | 'PINCH'
  | 'FIST'
  | 'PEACE'
  | 'TWO_HAND_HOLD'
  | 'TWO_HAND_EXPAND';

export interface GestureMetrics {
  primaryGesture: HandGestureType;
  secondaryGesture?: HandGestureType;
  pinchDistance: number; // Normalized 0..1
  isPinching: boolean;
  twoHandDistance: number; // Distance between index tips or palm centers (normalized)
  twoHandAngle: number; // Radians
  twoHandMidpoint: { x: number; y: number; screenX: number; screenY: number };
  spread: number;
  overallVelocity: number;
}
