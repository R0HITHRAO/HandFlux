import * as THREE from 'three';
import { VisualEffectState } from './effects';

export type ObjectLifecycleState = 'SPAWNING' | 'UNSELECTED' | 'GRABBED' | 'DESTROYED';

export interface ARObjectInstance {
  id: string;
  type: VisualEffectState;
  createdAt: number;
  state: ObjectLifecycleState;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  opacity: number;
  group: THREE.Group;
  spawnProgress: number;
  boundingRadius: number;
}
