import * as THREE from 'three';
import { VisualEffectState } from '../types/effects';
import { ARObjectInstance } from '../types/objects';
import { HandLandmarks } from '../types/vision';
import { GestureMetrics } from '../types/gestures';
import { screenToThreeWorld } from '../utils/mathUtils';

export class ARObjectManager {
  private objects: ARObjectInstance[] = [];
  private selectedObjectId: string | null = null;
  private activeTool: VisualEffectState = VisualEffectState.NONE; // Initial state: NONE
  private sceneGroup: THREE.Group;
  private maxObjects: number = 5;

  // Edge-triggered pinch creation lock & cooldown
  private isPinchCreationLocked: boolean = false;
  private pinchTimer: number = 0;
  private creationCooldown: number = 0;

  // Grab Offset cache
  private grabOffset: THREE.Vector3 = new THREE.Vector3();
  private grabbedObjectId: string | null = null;

  // Shared Cached Geometry & Materials for PRISM
  private prismCylinderGeo: THREE.CylinderGeometry;
  private prismInnerOctGeo: THREE.OctahedronGeometry;
  private prismOuterMat: THREE.MeshStandardMaterial;
  private prismInnerMat: THREE.MeshStandardMaterial;
  private prismWireMat: THREE.LineBasicMaterial;
  private whiteWireMat: THREE.LineBasicMaterial;

  constructor(sceneGroup: THREE.Group) {
    this.sceneGroup = sceneGroup;

    // Initialize geometry & materials once (Zero allocations in loop)
    this.prismCylinderGeo = new THREE.CylinderGeometry(0.32, 0.44, 0.75, 6, 1, false);
    this.prismInnerOctGeo = new THREE.OctahedronGeometry(0.24, 0);

    this.prismOuterMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      emissive: 0x9333ea,
      emissiveIntensity: 0.9,
      roughness: 0.1,
      metalness: 0.3,
      transparent: true,
      opacity: 0.88,
      side: THREE.DoubleSide
    });

    this.prismInnerMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      emissive: 0xdb2777,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });

    this.prismWireMat = new THREE.LineBasicMaterial({ color: 0x4c1d95, linewidth: 2.5, transparent: true, opacity: 0.95 });
    this.whiteWireMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
  }

  public setActiveTool(tool: VisualEffectState): void {
    this.activeTool = tool;
  }

  public getActiveTool(): VisualEffectState {
    return this.activeTool;
  }

  public getObjects(): ARObjectInstance[] {
    return this.objects;
  }

  public getSelectedObject(): ARObjectInstance | null {
    return this.objects.find(o => o.id === this.selectedObjectId) || null;
  }

  public selectObject(id: string | null): void {
    this.selectedObjectId = id;
  }

  /**
   * Calculates face-safe spawn location beside fingertip
   */
  public calculateSpawnPosition(
    hand: HandLandmarks,
    screenWidth: number,
    screenHeight: number
  ): { worldPos: THREE.Vector3; screenPos: { x: number; y: number } } {
    const tip = hand.indexTip;
    const isLeftHalf = tip.screenX <= screenWidth * 0.5;

    // Offset outward toward edge (110px) and downward (30px)
    const offsetX = isLeftHalf ? -110 : 110;
    const offsetY = 30;

    let spawnX = tip.screenX + offsetX;
    let spawnY = tip.screenY + offsetY;

    spawnX = Math.max(screenWidth * 0.1, Math.min(screenWidth * 0.9, spawnX));
    spawnY = Math.max(screenHeight * 0.15, Math.min(screenHeight * 0.85, spawnY));

    // Face Avoidance: center region (0.5, 0.32)
    const distToFace = Math.hypot((spawnX / screenWidth) - 0.5, (spawnY / screenHeight) - 0.32);
    if (distToFace < 0.24) {
      spawnX = isLeftHalf ? Math.max(screenWidth * 0.08, spawnX - 90) : Math.min(screenWidth * 0.92, spawnX + 90);
    }

    const world = screenToThreeWorld(spawnX, spawnY, screenWidth, screenHeight);
    return {
      worldPos: new THREE.Vector3(world.x, world.y, world.z),
      screenPos: { x: spawnX, y: spawnY }
    };
  }

  /**
   * Spawns exactly ONE Prism at the hand position
   */
  public createObjectAtHand(
    type: VisualEffectState,
    hand: HandLandmarks,
    screenWidth: number,
    screenHeight: number
  ): ARObjectInstance | null {
    if (this.activeTool === VisualEffectState.NONE) {
      this.activeTool = VisualEffectState.PURPLE_PRISM;
    }

    if (this.objects.length >= this.maxObjects) {
      this.deleteObject(this.objects[0].id);
    }

    const { worldPos } = this.calculateSpawnPosition(hand, screenWidth, screenHeight);
    const id = 'prism-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

    const group = new THREE.Group();
    group.position.copy(worldPos);
    group.scale.set(0.1, 0.1, 0.1);

    // Build 3D Crystal Prism
    const mesh = new THREE.Mesh(this.prismCylinderGeo, this.prismOuterMat);
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(this.prismCylinderGeo), this.prismWireMat));
    const innerMesh = new THREE.Mesh(this.prismInnerOctGeo, this.prismInnerMat);
    innerMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(this.prismInnerOctGeo), this.whiteWireMat));
    group.add(mesh);
    group.add(innerMesh);

    this.sceneGroup.add(group);

    const newObj: ARObjectInstance = {
      id,
      type: VisualEffectState.PURPLE_PRISM,
      createdAt: performance.now(),
      state: 'SPAWNING',
      position: worldPos.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      opacity: 1.0,
      group,
      spawnProgress: 0.0,
      boundingRadius: 0.55
    };

    this.objects.push(newObj);
    this.selectedObjectId = id;
    this.creationCooldown = 0.7;
    return newObj;
  }

  /**
   * Update loop: handles animation, grab, move, release (Zero allocations)
   */
  public update(
    hands: HandLandmarks[],
    gestures: GestureMetrics,
    screenWidth: number,
    screenHeight: number,
    dt: number,
    time: number
  ): { creationTriggered: boolean; pinchHoldProgress: number } {
    let creationTriggered = false;
    let pinchHoldProgress = 0.0;

    if (this.creationCooldown > 0) {
      this.creationCooldown -= dt;
    }

    // 1. Edge-Triggered Pinch-to-Create Logic (When PRISM tool active)
    const canCreateWithPinch = this.activeTool === VisualEffectState.PURPLE_PRISM;

    if (canCreateWithPinch && gestures.isPinching && hands.length > 0 && !this.grabbedObjectId) {
      if (!this.isPinchCreationLocked && this.creationCooldown <= 0) {
        this.pinchTimer += dt;
        pinchHoldProgress = Math.min(1.0, this.pinchTimer / 0.4);

        if (this.pinchTimer >= 0.4) {
          creationTriggered = true;
          this.isPinchCreationLocked = true;
          this.pinchTimer = 0.0;
          this.createObjectAtHand(VisualEffectState.PURPLE_PRISM, hands[0], screenWidth, screenHeight);
        }
      }
    } else {
      if (!gestures.isPinching) {
        this.pinchTimer = 0.0;
        this.isPinchCreationLocked = false;
      }
      pinchHoldProgress = 0.0;
    }

    // 2. Nearest Prism Hit-Testing & Grab/Drag/Release Logic
    if (gestures.isPinching && hands.length > 0) {
      const hand = hands[0];
      const w = screenToThreeWorld(hand.indexTip.screenX, hand.indexTip.screenY, screenWidth, screenHeight);
      const handPos = new THREE.Vector3(w.x, w.y, w.z);

      if (!this.grabbedObjectId) {
        // Find nearest prism within 0.8 units
        let nearestObj: ARObjectInstance | null = null;
        let minDist = 0.85;

        for (const obj of this.objects) {
          const dist = handPos.distanceTo(obj.position);
          if (dist < minDist) {
            minDist = dist;
            nearestObj = obj;
          }
        }

        if (nearestObj) {
          this.grabbedObjectId = nearestObj.id;
          this.selectedObjectId = nearestObj.id;
          nearestObj.state = 'GRABBED';
          this.grabOffset.subVectors(nearestObj.position, handPos);
        }
      } else {
        // Dragging grabbed prism
        const grabbed = this.objects.find(o => o.id === this.grabbedObjectId);
        if (grabbed) {
          grabbed.position.set(
            handPos.x + this.grabOffset.x,
            handPos.y + this.grabOffset.y,
            handPos.z + this.grabOffset.z
          );

          if (hands.length >= 2) {
            const targetScale = Math.max(0.5, Math.min(2.0, gestures.twoHandDistance * 2.0));
            grabbed.scale.setScalar(targetScale);
            grabbed.rotation.z = gestures.twoHandAngle;
          }
        }
      }
    } else {
      // Released: Prism stays in place
      if (this.grabbedObjectId) {
        const grabbed = this.objects.find(o => o.id === this.grabbedObjectId);
        if (grabbed) grabbed.state = 'IDLE';
        this.grabbedObjectId = null;
      }
    }

    // 3. Transform Existing Prisms
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];

      // Spawn scale-in animation 0.1 -> 1.0
      if (obj.spawnProgress < 1.0) {
        obj.spawnProgress = Math.min(1.0, obj.spawnProgress + dt * 3.0);
        const s = THREE.MathUtils.lerp(0.1, 1.0, Math.sin(obj.spawnProgress * Math.PI * 0.5));
        obj.group.scale.set(s * obj.scale.x, s * obj.scale.y, s * obj.scale.z);
        if (obj.spawnProgress >= 1.0 && obj.state === 'SPAWNING') {
          obj.state = 'IDLE';
        }
      }

      obj.group.position.copy(obj.position);
      obj.group.rotation.copy(obj.rotation);
      if (obj.spawnProgress >= 1.0) {
        obj.group.scale.copy(obj.scale);
      }

      // Subtle rotation
      obj.group.rotation.y = time * 0.6;
    }

    return { creationTriggered, pinchHoldProgress };
  }

  public deleteObject(id: string): void {
    const idx = this.objects.findIndex(o => o.id === id);
    if (idx !== -1) {
      const obj = this.objects[idx];
      this.sceneGroup.remove(obj.group);
      this.objects.splice(idx, 1);
      if (this.selectedObjectId === id) {
        this.selectedObjectId = this.objects.length > 0 ? this.objects[this.objects.length - 1].id : null;
      }
      if (this.grabbedObjectId === id) {
        this.grabbedObjectId = null;
      }
    }
  }

  public deleteSelected(): void {
    if (this.selectedObjectId) {
      this.deleteObject(this.selectedObjectId);
    }
  }

  public clearAll(): void {
    while (this.objects.length > 0) {
      this.deleteObject(this.objects[0].id);
    }
    this.selectedObjectId = null;
    this.grabbedObjectId = null;
  }
}
