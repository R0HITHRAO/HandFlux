import * as THREE from 'three';
import { VisualEffectState } from '../types/effects';
import { ARObjectInstance } from '../types/objects';
import { HandLandmarks } from '../types/vision';
import { GestureMetrics } from '../types/gestures';
import { screenToThreeWorld, lerp } from '../utils/mathUtils';
import { HatchShader } from '../shaders/hatchShader';

export class ARObjectManager {
  private objects: ARObjectInstance[] = [];
  private selectedObjectId: string | null = null;
  private activeTool: VisualEffectState = VisualEffectState.NONE;
  public sceneGroup: THREE.Group;
  private maxObjects: number = 5;

  private isPinchCreationLocked: boolean = false;
  private pinchTimer: number = 0;
  private creationCooldown: number = 0;
  private grabOffset: THREE.Vector3 = new THREE.Vector3();
  private grabbedObjectId: string | null = null;

  // Geometries & Materials
  private prismGeo: THREE.CylinderGeometry;
  private prismMat: THREE.MeshStandardMaterial;
  private hatchPlaneGeo: THREE.PlaneGeometry;
  private hatchMat: THREE.ShaderMaterial;
  private wedgeGeo: THREE.ConeGeometry;
  private wedgeMat: THREE.MeshStandardMaterial;
  private blockGeo: THREE.BoxGeometry;
  private blockMat: THREE.MeshStandardMaterial;
  private foldGeo: THREE.IcosahedronGeometry;
  private foldMat: THREE.MeshStandardMaterial;

  constructor(sceneGroup: THREE.Group) {
    this.sceneGroup = sceneGroup;

    this.prismGeo = new THREE.CylinderGeometry(0.32, 0.44, 0.75, 6, 1, false);
    this.prismMat = new THREE.MeshStandardMaterial({ color: 0xc084fc, emissive: 0x9333ea, emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.88 });

    this.hatchPlaneGeo = new THREE.PlaneGeometry(1.1, 0.65);
    this.hatchMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uOpacity: { value: 0.85 },
        uColorPrimary: { value: new THREE.Color(0x00f5ff) },
        uColorSecondary: { value: new THREE.Color(0x0077ff) },
        uLineSpacing: { value: 24.0 },
        uLineWidth: { value: 0.28 }
      },
      vertexShader: HatchShader.vertexShader,
      fragmentShader: HatchShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });

    this.wedgeGeo = new THREE.ConeGeometry(0.4, 0.8, 3);
    this.wedgeMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.4, transparent: true, opacity: 0.9 });

    this.blockGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
    this.blockMat = new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0xca8a04, emissiveIntensity: 0.9, roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.9 });

    this.foldGeo = new THREE.IcosahedronGeometry(0.45, 0);
    this.foldMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x2563eb, emissiveIntensity: 0.9, roughness: 0.1, metalness: 0.4, wireframe: true });
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

  public calculateSpawnPosition(hand: HandLandmarks, screenWidth: number, screenHeight: number): { worldPos: THREE.Vector3; screenPos: { x: number; y: number } } {
    const tip = hand.indexTip;
    const isLeftHalf = tip.screenX <= screenWidth * 0.5;
    let spawnX = tip.screenX + (isLeftHalf ? -110 : 110);
    let spawnY = tip.screenY + 30;
    spawnX = Math.max(screenWidth * 0.1, Math.min(screenWidth * 0.9, spawnX));
    spawnY = Math.max(screenHeight * 0.15, Math.min(screenHeight * 0.85, spawnY));

    const world = screenToThreeWorld(spawnX, spawnY, screenWidth, screenHeight);
    return { worldPos: new THREE.Vector3(world.x, world.y, world.z), screenPos: { x: spawnX, y: spawnY } };
  }

  public createObjectAtHand(type: VisualEffectState, hand: HandLandmarks, screenWidth: number, screenHeight: number): ARObjectInstance | null {
    const effectiveType = (type === VisualEffectState.NONE) ? VisualEffectState.RECTANGLE_TRACKING : type;
    if (this.objects.length >= this.maxObjects) this.deleteObject(this.objects[0].id);

    const { worldPos } = this.calculateSpawnPosition(hand, screenWidth, screenHeight);
    const id = effectiveType.toLowerCase() + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    const group = new THREE.Group();
    group.position.copy(worldPos);
    group.scale.set(0.1, 0.1, 0.1);

    if (effectiveType === VisualEffectState.RECTANGLE_TRACKING || effectiveType === VisualEffectState.RECTANGLE_DOTS) {
      const plane = new THREE.Mesh(this.hatchPlaneGeo, this.hatchMat.clone());
      plane.add(new THREE.LineSegments(new THREE.EdgesGeometry(this.hatchPlaneGeo), new THREE.LineBasicMaterial({ color: 0x00f5ff, linewidth: 2 })));
      group.add(plane);
    } else if (effectiveType === VisualEffectState.TRIANGLE_EFFECT) {
      group.add(new THREE.Mesh(this.wedgeGeo, this.wedgeMat));
    } else if (effectiveType === VisualEffectState.GLOW_BLOCKS) {
      group.add(new THREE.Mesh(this.blockGeo, this.blockMat));
    } else if (effectiveType === VisualEffectState.LARGE_GEOMETRY) {
      group.add(new THREE.Mesh(this.foldGeo, this.foldMat));
    } else {
      const mesh = new THREE.Mesh(this.prismGeo, this.prismMat);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(this.prismGeo), new THREE.LineBasicMaterial({ color: 0x4c1d95, linewidth: 2 })));
      group.add(mesh);
    }

    this.sceneGroup.add(group);
    const newObj: ARObjectInstance = {
      id,
      type: effectiveType,
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

  public update(hands: HandLandmarks[], gestures: GestureMetrics, screenWidth: number, screenHeight: number, dt: number, time: number): { creationTriggered: boolean; pinchHoldProgress: number } {
    let creationTriggered = false;
    let pinchHoldProgress = 0.0;

    if (this.creationCooldown > 0) this.creationCooldown -= dt;

    // Pinch Creation
    if (this.activeTool !== VisualEffectState.NONE && gestures.isPinching && hands.length > 0 && !this.grabbedObjectId) {
      if (!this.isPinchCreationLocked && this.creationCooldown <= 0) {
        this.pinchTimer += dt;
        pinchHoldProgress = Math.min(1.0, this.pinchTimer / 0.4);
        if (this.pinchTimer >= 0.4) {
          creationTriggered = true;
          this.isPinchCreationLocked = true;
          this.pinchTimer = 0.0;
          this.createObjectAtHand(this.activeTool, hands[0], screenWidth, screenHeight);
        }
      }
    } else {
      if (!gestures.isPinching) {
        this.pinchTimer = 0.0;
        this.isPinchCreationLocked = false;
      }
      pinchHoldProgress = 0.0;
    }

    // Grab / Drag Logic
    if (gestures.isPinching && hands.length > 0) {
      const hand = hands[0];
      const w = screenToThreeWorld(hand.indexTip.screenX, hand.indexTip.screenY, screenWidth, screenHeight);
      const handPos = new THREE.Vector3(w.x, w.y, w.z);

      if (!this.grabbedObjectId) {
        let nearestObj: ARObjectInstance | null = null;
        let minDist = 0.9;
        for (const obj of this.objects) {
          const dist = handPos.distanceTo(obj.position);
          if (dist < minDist) { minDist = dist; nearestObj = obj; }
        }
        if (nearestObj) {
          this.grabbedObjectId = nearestObj.id;
          this.selectedObjectId = nearestObj.id;
          nearestObj.state = 'GRABBED';
          this.grabOffset.subVectors(nearestObj.position, handPos);
        }
      } else {
        const grabbed = this.objects.find(o => o.id === this.grabbedObjectId);
        if (grabbed) {
          if (hands.length >= 2) {
            const mid = gestures.twoHandMidpoint;
            const midW = screenToThreeWorld(mid.screenX, mid.screenY, screenWidth, screenHeight);
            grabbed.position.set(midW.x, midW.y, midW.z);
            const targetWidthScale = Math.max(0.6, Math.min(2.4, gestures.twoHandDistance * 2.5));
            grabbed.scale.set(targetWidthScale, 1.0, 1.0);
            grabbed.rotation.z = lerp(grabbed.rotation.z, gestures.twoHandAngle, 0.25);
          } else {
            grabbed.position.set(handPos.x + this.grabOffset.x, handPos.y + this.grabOffset.y, handPos.z + this.grabOffset.z);
          }
        }
      }
    } else {
      if (this.grabbedObjectId) {
        const grabbed = this.objects.find(o => o.id === this.grabbedObjectId);
        if (grabbed) grabbed.state = 'IDLE';
        this.grabbedObjectId = null;
      }
    }

    // Spawn scale animation & rotation
    for (let i = 0; i < this.objects.length; i++) {
      const obj = this.objects[i];
      if (obj.spawnProgress < 1.0) {
        obj.spawnProgress = Math.min(1.0, obj.spawnProgress + dt * 3.0);
        const s = THREE.MathUtils.lerp(0.1, 1.0, Math.sin(obj.spawnProgress * Math.PI * 0.5));
        obj.group.scale.set(s * obj.scale.x, s * obj.scale.y, s * obj.scale.z);
        if (obj.spawnProgress >= 1.0 && obj.state === 'SPAWNING') obj.state = 'IDLE';
      }
      obj.group.position.copy(obj.position);
      obj.group.rotation.copy(obj.rotation);
      if (obj.spawnProgress >= 1.0) obj.group.scale.copy(obj.scale);

      if (obj.state !== 'GRABBED') {
        obj.group.rotation.y += dt * 0.5;
      }
    }

    return { creationTriggered, pinchHoldProgress };
  }

  public deleteObject(id: string): void {
    const idx = this.objects.findIndex(o => o.id === id);
    if (idx !== -1) {
      this.sceneGroup.remove(this.objects[idx].group);
      this.objects.splice(idx, 1);
      if (this.selectedObjectId === id) this.selectedObjectId = this.objects.length > 0 ? this.objects[this.objects.length - 1].id : null;
      if (this.grabbedObjectId === id) this.grabbedObjectId = null;
    }
  }

  public deleteSelected(): void {
    if (this.selectedObjectId) this.deleteObject(this.selectedObjectId);
  }

  public clearAll(): void {
    while (this.objects.length > 0) this.deleteObject(this.objects[0].id);
    this.selectedObjectId = null;
    this.grabbedObjectId = null;
  }
}
