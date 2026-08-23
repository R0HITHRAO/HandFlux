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

  // Edge-triggered pinch creation lock
  private isPinchCreationLocked: boolean = false;
  private pinchTimer: number = 0;

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

  /**
   * Calculates a face-safe spawn location beside the hand (never covering the face)
   */
  public calculateSpawnPosition(
    hand: HandLandmarks,
    screenWidth: number,
    screenHeight: number
  ): { worldPos: THREE.Vector3; screenPos: { x: number; y: number } } {
    const tip = hand.indexTip;

    // Determine if hand is on left or right half of screen
    const isLeftHalf = tip.screenX <= screenWidth * 0.5;

    // Offset outward toward screen edge (away from face)
    const offsetX = isLeftHalf ? -110 : 110;
    // Offset slightly downward (away from upper face)
    const offsetY = 30;

    let spawnX = tip.screenX + offsetX;
    let spawnY = tip.screenY + offsetY;

    // Screen bounds clamp
    spawnX = Math.max(screenWidth * 0.1, Math.min(screenWidth * 0.9, spawnX));
    spawnY = Math.max(screenHeight * 0.15, Math.min(screenHeight * 0.85, spawnY));

    // Face Avoidance: Face center is roughly (0.5 * w, 0.32 * h)
    const faceNormX = 0.5;
    const faceNormY = 0.32;
    const spawnNormX = spawnX / screenWidth;
    const spawnNormY = spawnY / screenHeight;
    const distToFace = Math.hypot(spawnNormX - faceNormX, spawnNormY - faceNormY);

    if (distToFace < 0.24) {
      // Push further outward away from center face
      spawnX = isLeftHalf ? Math.max(screenWidth * 0.08, spawnX - 90) : Math.min(screenWidth * 0.92, spawnX + 90);
    }

    const world = screenToThreeWorld(spawnX, spawnY, screenWidth, screenHeight);
    return {
      worldPos: new THREE.Vector3(world.x, world.y, world.z),
      screenPos: { x: spawnX, y: spawnY }
    };
  }

  /**
   * Spawns exactly ONE object on explicit command
   */
  public createObjectAtHand(
    type: VisualEffectState,
    hand: HandLandmarks,
    screenWidth: number,
    screenHeight: number
  ): ARObjectInstance | null {
    if (type === VisualEffectState.NONE || type === VisualEffectState.THERMAL || type === VisualEffectState.RAW_CAMERA) {
      return null;
    }

    if (this.objects.length >= this.maxObjects) {
      this.deleteObject(this.objects[0].id);
    }

    const { worldPos } = this.calculateSpawnPosition(hand, screenWidth, screenHeight);
    const id = 'ar-obj-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);

    const group = new THREE.Group();
    group.position.copy(worldPos);
    group.scale.set(0.1, 0.1, 0.1); // Starts at 0.1, animates to 1.0

    this.buildCompactGeometry(type, group);
    this.sceneGroup.add(group);

    const newObj: ARObjectInstance = {
      id,
      type,
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
    return newObj;
  }

  /**
   * Compact, moderate geometry sizing (10-20% of viewport, NOT giant)
   */
  private buildCompactGeometry(type: VisualEffectState, group: THREE.Group): void {
    if (type === VisualEffectState.PURPLE_PRISM) {
      // 1. Lavender Crystal Prism (Radius 0.38, Height 0.75)
      const geo = new THREE.CylinderGeometry(0.32, 0.44, 0.75, 6, 1, false);
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
      const wire = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x4c1d95, linewidth: 2.5, transparent: true, opacity: 0.95 }));
      mesh.add(wire);

      const innerGeo = new THREE.OctahedronGeometry(0.24, 0);
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
      // 2. Crystal Wedges (Compact cluster)
      const wedgeGeo = new THREE.ConeGeometry(0.25, 0.65, 3);
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
        m.position.set((i - 1) * 0.32, (i % 2 === 0 ? 0.08 : -0.08), 0);
        m.rotation.z = (i - 1) * 0.25;
        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(wedgeGeo), new THREE.LineBasicMaterial({ color: 0xff00ff, linewidth: 2 })));
        group.add(m);
      }

    } else if (type === VisualEffectState.GLOW_BLOCKS) {
      // 3. Compact Glowing Cuboids
      const cubeGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0xff007f,
        emissive: 0xff007f,
        emissiveIntensity: 1.0,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9
      });
      const cube = new THREE.Mesh(cubeGeo, cubeMat);
      cube.position.set(-0.25, 0.08, 0);
      cube.add(new THREE.LineSegments(new THREE.EdgesGeometry(cubeGeo), new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })));
      group.add(cube);

      const cuboidGeo = new THREE.BoxGeometry(0.28, 0.55, 0.28);
      const cuboidMat = new THREE.MeshStandardMaterial({
        color: 0x00ff88,
        emissive: 0x00ff88,
        emissiveIntensity: 1.0,
        roughness: 0.1,
        transparent: true,
        opacity: 0.9
      });
      const cuboid = new THREE.Mesh(cuboidGeo, cuboidMat);
      cuboid.position.set(0.25, -0.05, 0);
      cuboid.add(new THREE.LineSegments(new THREE.EdgesGeometry(cuboidGeo), new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })));
      group.add(cuboid);

    } else if (type === VisualEffectState.LARGE_GEOMETRY) {
      // 4. Folded Architectural 3D Structure (Controlled initial size)
      const palette = [0x9333ea, 0x00f5ff, 0x22c55e, 0xfacc15, 0xf97316, 0xec4899];
      palette.forEach((col, i) => {
        const geo = new THREE.BoxGeometry(0.35, 0.22, 0.14);
        const mat = new THREE.MeshStandardMaterial({
          color: col,
          emissive: col,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.9
        });
        const m = new THREE.Mesh(geo, mat);
        m.position.set((i - 2.5) * 0.24, Math.sin(i * 1.2) * 0.15, Math.cos(i * 1.5) * 0.08);
        m.rotation.set(i * 0.25, i * 0.35, i * 0.15);
        m.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })));
        group.add(m);
      });

    } else {
      // 5. HATCH / DOTS Plane (0.9 x 0.55)
      const isDots = type === VisualEffectState.RECTANGLE_DOTS;
      const planeGeo = new THREE.PlaneGeometry(0.9, 0.55, 4, 4);
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
      plane.add(new THREE.LineSegments(new THREE.EdgesGeometry(planeGeo), new THREE.LineBasicMaterial({ color: isDots ? 0xff007f : 0x00f5ff, linewidth: 2 })));
      group.add(plane);
    }
  }

  /**
   * Update existing objects, handle grab/manipulation, and advance pinch timer
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

    // 1. Edge-Triggered Pinch Creation Logic
    if (gestures.isPinching && hands.length > 0) {
      if (!this.isPinchCreationLocked) {
        this.pinchTimer += dt;
        pinchHoldProgress = Math.min(1.0, this.pinchTimer / 0.4);

        if (this.pinchTimer >= 0.4) {
          // Trigger exactly 1 object creation
          creationTriggered = true;
          this.isPinchCreationLocked = true; // Lock until release!
          this.pinchTimer = 0.0;
          this.createObjectAtHand(this.activeTool, hands[0], screenWidth, screenHeight);
        }
      }
    } else {
      // Reset pinch timer and unlock when pinch is released
      this.pinchTimer = 0.0;
      this.isPinchCreationLocked = false;
      pinchHoldProgress = 0.0;
    }

    // 2. Animate and Manipulate Existing Objects
    this.objects.forEach(obj => {
      // Spawn Animation: 0.1 -> 1.0 scale over 350ms
      if (obj.spawnProgress < 1.0) {
        obj.spawnProgress = Math.min(1.0, obj.spawnProgress + dt * 3.0);
        const s = THREE.MathUtils.lerp(0.1, 1.0, Math.sin(obj.spawnProgress * Math.PI * 0.5));
        obj.group.scale.set(s * obj.scale.x, s * obj.scale.y, s * obj.scale.z);
        if (obj.spawnProgress >= 1.0 && obj.state === 'SPAWNING') {
          obj.state = 'UNSELECTED';
        }
      }

      // Check if user is grabbing this object with a pinch near it
      let isHandGrabbingThis = false;
      let grabbingHand: HandLandmarks | null = null;

      if (gestures.isPinching) {
        for (const h of hands) {
          const w = screenToThreeWorld(h.indexTip.screenX, h.indexTip.screenY, screenWidth, screenHeight);
          const handPos = new THREE.Vector3(w.x, w.y, w.z);
          const dist = handPos.distanceTo(obj.position);

          if (dist < 0.8) {
            isHandGrabbingThis = true;
            grabbingHand = h;
            break;
          }
        }
      }

      if (isHandGrabbingThis && grabbingHand) {
        obj.state = 'GRABBED';
        this.selectedObjectId = obj.id;
        const w = screenToThreeWorld(grabbingHand.indexTip.screenX, grabbingHand.indexTip.screenY, screenWidth, screenHeight);
        obj.position.set(w.x, w.y, w.z);

        if (hands.length >= 2) {
          const targetScale = Math.max(0.5, Math.min(2.0, gestures.twoHandDistance * 2.0));
          obj.scale.setScalar(targetScale);
          obj.rotation.z = gestures.twoHandAngle;
        }
      } else if (obj.state === 'GRABBED' && !gestures.isPinching) {
        obj.state = 'UNSELECTED'; // Stays in place where released!
      }

      // Apply transform
      obj.group.position.copy(obj.position);
      obj.group.rotation.copy(obj.rotation);
      if (obj.spawnProgress >= 1.0) {
        obj.group.scale.copy(obj.scale);
      }

      // Gentle subtle rotation animation
      obj.group.rotation.y = time * 0.5;

      // Update shader uniforms
      obj.group.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
          const mat = (child as THREE.Mesh).material;
          if (mat && (mat as THREE.ShaderMaterial).uniforms && (mat as THREE.ShaderMaterial).uniforms.uTime) {
            (mat as THREE.ShaderMaterial).uniforms.uTime.value = time;
          }
        }
      });
    });

    return { creationTriggered, pinchHoldProgress };
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
