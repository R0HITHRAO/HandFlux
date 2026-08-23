import * as THREE from 'three';
import { VisualEffectState } from '../types/effects';
import { ARObjectInstance } from '../types/objects';
import { HandLandmarks } from '../types/vision';
import { GestureMetrics } from '../types/gestures';
import { screenToThreeWorld, lerp } from '../utils/mathUtils';
import { HalftoneShader } from '../shaders/halftoneShader';

export class ARObjectManager {
  private objects: ARObjectInstance[] = [];
  private selectedObjectId: string | null = null;
  private activeTool: VisualEffectState = VisualEffectState.PURPLE_PRISM;
  private sceneGroup: THREE.Group;
  private maxObjects: number = 5;

  constructor(sceneGroup: THREE.Group) {
    this.sceneGroup = sceneGroup;
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

  public calculateSpawnPosition(
    hand: HandLandmarks,
    screenWidth: number,
    screenHeight: number
  ): { worldPos: THREE.Vector3; screenPos: { x: number; y: number } } {
    const tip = hand.indexTip;
    const wrist = hand.wrist;

    let dirX = tip.screenX - wrist.screenX;
    let dirY = tip.screenY - wrist.screenY;
    const len = Math.hypot(dirX, dirY) || 1;
    dirX /= len;
    dirY /= len;

    const faceCenterX = screenWidth * 0.5;
    const faceCenterY = screenHeight * 0.35;

    let awayFromFaceX = tip.screenX - faceCenterX;
    let awayFromFaceY = tip.screenY - faceCenterY;
    const faceDist = Math.hypot(awayFromFaceX, awayFromFaceY) || 1;
    awayFromFaceX /= faceDist;
    awayFromFaceY /= faceDist;

    let offsetDirX = dirX * 0.6 + awayFromFaceX * 0.4;
    let offsetDirY = dirY * 0.6 + awayFromFaceY * 0.4;
    const offsetLen = Math.hypot(offsetDirX, offsetDirY) || 1;
    offsetDirX /= offsetLen;
    offsetDirY /= offsetLen;

    const offsetDistance = Math.min(180, Math.max(100, screenWidth * 0.1));

    let spawnScreenX = tip.screenX + offsetDirX * offsetDistance;
    let spawnScreenY = tip.screenY + offsetDirY * offsetDistance;

    spawnScreenX = Math.max(screenWidth * 0.08, Math.min(screenWidth * 0.92, spawnScreenX));
    spawnScreenY = Math.max(screenHeight * 0.08, Math.min(screenHeight * 0.92, spawnScreenY));

    const world = screenToThreeWorld(spawnScreenX, spawnScreenY, screenWidth, screenHeight);
    return {
      worldPos: new THREE.Vector3(world.x, world.y, world.z),
      screenPos: { x: spawnScreenX, y: spawnScreenY }
    };
  }

  public createObjectAtHand(
    type: VisualEffectState,
    hand: HandLandmarks,
    screenWidth: number,
    screenHeight: number
  ): ARObjectInstance {
    if (this.objects.length >= this.maxObjects) {
      this.deleteObject(this.objects[0].id);
    }

    const { worldPos } = this.calculateSpawnPosition(hand, screenWidth, screenHeight);
    const id = 'ar-obj-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

    const group = new THREE.Group();
    group.position.copy(worldPos);
    group.scale.set(0.05, 0.05, 0.05);

    this.buildGeometryForType(type, group);
    this.sceneGroup.add(group);

    const newObj: ARObjectInstance = {
      id,
      type,
      createdAt: performance.now(),
      state: 'SPAWNING',
      position: worldPos.clone(),
      targetPosition: worldPos.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      targetRotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
      targetScale: new THREE.Vector3(1, 1, 1),
      opacity: 1.0,
      group,
      anchorHandId: hand.id,
      grabOffset: new THREE.Vector3(0, 0, 0),
      spawnProgress: 0.0
    };

    this.objects.push(newObj);
    this.selectedObjectId = id;
    return newObj;
  }

  private buildGeometryForType(type: VisualEffectState, group: THREE.Group): void {
    if (type === VisualEffectState.PURPLE_PRISM) {
      const geo = new THREE.CylinderGeometry(1.2, 1.6, 2.2, 6, 1, false);
      const mat = new THREE.MeshStandardMaterial({
        color: 0xc084fc,
        emissive: 0x9333ea,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geo, mat);
      const wire = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x4c1d95, linewidth: 3, transparent: true, opacity: 0.95 }));
      mesh.add(wire);

      const innerGeo = new THREE.OctahedronGeometry(0.8, 0);
      const innerMat = new THREE.MeshStandardMaterial({
        color: 0xf472b6,
        emissive: 0xdb2777,
        emissiveIntensity: 1.0,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
      });
      const innerMesh = new THREE.Mesh(innerGeo, innerMat);
      innerMesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(innerGeo), new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })));
      group.add(mesh);
      group.add(innerMesh);

    } else if (type === VisualEffectState.TRIANGLE_EFFECT) {
      const wedgeGeo = new THREE.ConeGeometry(0.9, 2.0, 3);
      const colors = [0x9333ea, 0xd946ef, 0xec4899];
      for (let i = 0; i < 3; i++) {
        const mat = new THREE.MeshStandardMaterial({
          color: colors[i],
          emissive: colors[i],
          emissiveIntensity: 0.85,
          roughness: 0.1,
          transparent: true,
          opacity: 0.88,
          side: THREE.DoubleSide
        });
        const m = new THREE.Mesh(wedgeGeo, mat);
        m.position.set((i - 1) * 0.85, (i % 2 === 0 ? 0.2 : -0.2), 0);
        m.rotation.z = (i - 1) * 0.3;
        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(wedgeGeo), new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 2.5 })));
        group.add(m);
      }

    } else if (type === VisualEffectState.GLOW_BLOCKS) {
      const cubeGeo = new THREE.BoxGeometry(0.9, 0.9, 0.9);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0xff007f,
        emissive: 0xff007f,
        emissiveIntensity: 1.0,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9
      });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      cube.position.set(-0.6, 0.2, 0);
      cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(cubeGeo), new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2.5 })));
      group.add(cube);

      const cuboidGeo = new THREE.BoxGeometry(0.7, 1.4, 0.7);
      const cuboidMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 1.0,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9
      });
      const cuboid = new THREE.Mesh(cuboidGeo, cuboidMat);
      cuboid.position.set(0.6, -0.1, 0);
      cuboid.add(new THREE.LineSegments(new THREE.EdgesGeometry(cuboidGeo), new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2.5 })));
      group.add(cuboid);

    } else if (type === VisualEffectState.LARGE_GEOMETRY) {
      const palette = [0x9333ea, 0x00f5ff, 0x22c55e, 0xfacc15, 0xf97316, 0xec4899];
      palette.forEach((col, i) => {
        const geo = new THREE.BoxGeometry(0.9, 0.5, 0.3);
        const mat = new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.9
        });
        const m = new THREE.Mesh(geo, mat);
        m.position.set((i - 2.5) * 0.6, Math.sin(i * 1.2) * 0.35, Math.cos(i * 1.5) * 0.2);
        m.rotation.set(i * 0.3, i * 0.4, i * 0.2);
        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })));
        group.add(m);
      });

    } else {
      const isDots = type === VisualEffectState.RECTANGLE_DOTS;
      const planeGeo = new THREE.PlaneGeometry(2.4, 1.3, 4, 4);
      const shaderMat = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
          uOpacity: { value: 0.95 },
          uColorPrimary: { value: new THREE.Color(isDots ? 0xff007f : 0x00f5ff) },
          uColorSecondary: { value: new THREE.Color(isDots ? 0xff4081 : 0xb829ea) },
          uMode: { value: isDots ? 1 : 0 }
        },
        vertexShader: HalftoneShader.vertexShader,
        fragmentShader: HalftoneShader.fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(planeGeo, shaderMat);
      plane.add(new THREE.LineSegments(new THREE.EdgesGeometry(planeGeo), new THREE.LineBasicMaterial({ color: isDots ? 0xff007f : 0x00f5ff, linewidth: 2.5 })));
      group.add(plane);
    }
  }

  public update(
    hands: HandLandmarks[],
    gestures: GestureMetrics,
    screenWidth: number,
    screenHeight: number,
    dt: number,
    time: number
  ): void {
    this.objects.forEach(obj => {
      if (obj.spawnProgress < 1.0) {
        obj.spawnProgress = Math.min(1.0, obj.spawnProgress + dt * 3.5);
        const s = THREE.MathUtils.lerp(0.05, 1.0, Math.sin(obj.spawnProgress * Math.PI * 0.5));
        obj.group.scale.set(s * obj.scale.x, s * obj.scale.y, s * obj.scale.z);
        if (obj.spawnProgress >= 1.0 && obj.state === 'SPAWNING') {
          obj.state = 'ACTIVE';
        }
      }

      let isHandNear = false;
      let controllingHand: HandLandmarks | null = null;

      for (const h of hands) {
        const w = screenToThreeWorld(h.indexTip.screenX, h.indexTip.screenY, screenWidth, screenHeight);
        const handPos = new THREE.Vector3(w.x, w.y, w.z);
        const dist = handPos.distanceTo(obj.position);
        if (dist < 1.4) {
          isHandNear = true;
          controllingHand = h;
          break;
        }
      }

      if (isHandNear && gestures.isPinching && controllingHand) {
        obj.state = 'GRABBED';
        this.selectedObjectId = obj.id;
        const tipWorld = screenToThreeWorld(
          controllingHand.indexTip.screenX,
          controllingHand.indexTip.screenY,
          screenWidth,
          screenHeight
        );
        obj.targetPosition.set(tipWorld.x, tipWorld.y + 0.35, tipWorld.z);

        if (hands.length >= 2) {
          const targetScaleScalar = Math.max(0.6, Math.min(2.5, gestures.twoHandDistance * 2.2));
          obj.targetScale.set(targetScaleScalar, targetScaleScalar, targetScaleScalar);
          obj.targetRotation.z = gestures.twoHandAngle;
        }
      } else if (obj.state === 'GRABBED' && !gestures.isPinching) {
        obj.state = 'RELEASED';
      }

      obj.position.lerp(obj.targetPosition, 0.2);
      obj.rotation.z = lerp(obj.rotation.z, obj.targetRotation.z, 0.2);
      obj.group.position.copy(obj.position);
      obj.group.rotation.copy(obj.rotation);

      if (obj.spawnProgress >= 1.0) {
        obj.scale.lerp(obj.targetScale, 0.2);
        obj.group.scale.copy(obj.scale);
      }

      obj.group.rotation.y = time * 0.6;
      obj.group.rotation.x = Math.sin(time * 0.7 + obj.createdAt) * 0.15;

      obj.group.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material;
          if (mat && (mat as THREE.ShaderMaterial).uniforms && (mat as THREE.ShaderMaterial).uniforms.uTime) {
            (mat as THREE.ShaderMaterial).uniforms.uTime.value = time;
          }
        }
      });
    });
  }

  public deleteObject(id: string): void {
    const idx = this.objects.findIndex(o => o.id === id);
    if (idx !== -1) {
      const obj = this.objects[idx];
      this.sceneGroup.remove(obj.group);
      obj.group.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const m = child as THREE.Mesh;
          if (m.geometry) m.geometry.dispose();
          if (Array.isArray(m.material)) m.material.forEach(mat => mat.dispose());
          else if (m.material) m.material.dispose();
        }
      });
      this.objects.splice(idx, 1);
      if (this.selectedObjectId === id) {
        this.selectedObjectId = this.objects.length > 0 ? this.objects[this.objects.length - 1].id : null;
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
  }
}
