export type AppMode = 'PRESENTATION' | 'VIEWER_3D' | 'AR_LAB';

export type GestureType =
  | 'NONE'
  | 'POINT'
  | 'PINCH'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'OPEN_PALM'
  | 'FIST'
  | 'TWO_HAND_SCALE'
  | 'TWO_HAND_ROTATE';

export interface GestureEvent {
  type: GestureType;
  timestamp: number;
  confidence: number;
  pointerPosition?: { screenX: number; screenY: number };
  swipeVelocity?: number;
  scaleFactor?: number;
  rotationAngle?: number;
}

export interface GestureMetrics {
  primaryGesture: GestureType;
  isPinching: boolean;
  isPointing: boolean;
  isOpenPalm: boolean;
  isFist: boolean;
  pinchDistance: number;
  spread: number;
  pointerPosition: { screenX: number; screenY: number };
  twoHandDistance: number;
  twoHandAngle: number;
  twoHandMidpoint: { screenX: number; screenY: number };
  swipeDirection: 'LEFT' | 'RIGHT' | 'NONE';
  swipeVelocity: number;
}
