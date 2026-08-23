import * as THREE from 'three';
import { VisualEffectState } from './effects';

export type ObjectLifecycleState = 'PREVIEW' | 'SPAWNING' | 'ACTIVE' | 'GRABBED' | 'RELEASED' | 'DESTROYED';

export interface ARObjectInstance {
  id: string;
  type: VisualEffectState;
  createdAt: number;
  state: ObjectLifecycleState;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3;
  rotation: THREE.Euler;
  targetRotation: THREE.Euler;
  scale: THREE.Vector3;
  targetScale: THREE.Vector3;
  opacity: number;
  group: THREE.Group;
  anchorHandId: string | null;
  grabOffset: THREE.Vector3;
  spawnProgress: number;
}
